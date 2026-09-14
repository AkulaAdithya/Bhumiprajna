"""
Bhūmi Prājñā - Model Training Pipeline
Establishes baselines first, then evaluates LightGBM.
Does NOT assume LightGBM is automatically best.
Uses SHAP for explanations and calibrates probabilities.

Workflow:
1. Generate synthetic data
2. Build features
3. Check for leakage
4. Train baseline (Logistic Regression)
5. Train LightGBM
6. Compare metrics
7. Calibrate best model
8. Generate SHAP explainer
9. Save model artifacts + metadata
"""

import os
import sys
import json
import joblib
from datetime import datetime
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.metrics import (
    precision_score, recall_score, f1_score,
    average_precision_score, brier_score_loss,
    classification_report, mean_absolute_error,
    roc_auc_score
)
from sklearn.calibration import CalibratedClassifierCV
from sklearn.preprocessing import StandardScaler
import lightgbm as lgb
import shap

# Add parent to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from synthetic_data import generate_synthetic_data
from feature_engineering import (
    prepare_training_data, leakage_check, FEATURE_COLUMNS, build_features
)

# Output directory for model artifacts
MODEL_DIR = Path(__file__).parent.parent / "models"
MODEL_DIR.mkdir(exist_ok=True)


def train_pipeline():
    """Run the complete training pipeline."""
    print("=" * 60)
    print("BHŪMI PRĀJÑĀ ML TRAINING PIPELINE")
    print("=" * 60)

    # 1. Generate synthetic data
    print("\n📊 Step 1: Generating synthetic data...")
    projects_df, snapshots_df = generate_synthetic_data(200, seed=42)
    print(f"   Generated {len(projects_df)} projects, {len(snapshots_df)} snapshots")

    # 2. Build features
    print("\n🔧 Step 2: Building features...")
    X, y_class, y_reg = prepare_training_data(snapshots_df, projects_df)
    print(f"   Feature matrix: {X.shape}")
    print(f"   Target distribution: {dict(y_class.value_counts())}")

    # 3. Leakage check
    print("\n🔍 Step 3: Leakage check...")
    violations = leakage_check(X)
    if violations:
        print("   ⚠️ LEAKAGE DETECTED:")
        for v in violations:
            print(f"     {v}")
        raise RuntimeError("Leakage detected — aborting training!")
    print("   ✅ No leakage detected")

    # 4. Train/test split
    print("\n📋 Step 4: Splitting data...")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y_class, test_size=0.2, random_state=42, stratify=y_class
    )
    _, _, y_reg_train, y_reg_test = train_test_split(
        X, y_reg, test_size=0.2, random_state=42, stratify=y_class
    )
    print(f"   Train: {len(X_train)}, Test: {len(X_test)}")

    # 5. Baseline: Logistic Regression
    print("\n📈 Step 5: Training Logistic Regression baseline...")
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    lr_model = LogisticRegression(max_iter=1000, random_state=42, class_weight="balanced")
    lr_model.fit(X_train_scaled, y_train)
    lr_probs = lr_model.predict_proba(X_test_scaled)[:, 1]
    lr_preds = lr_model.predict(X_test_scaled)

    lr_metrics = compute_metrics(y_test, lr_preds, lr_probs, "Logistic Regression")

    # 6. LightGBM
    print("\n🌲 Step 6: Training LightGBM...")
    lgb_model = lgb.LGBMClassifier(
        n_estimators=200,
        max_depth=6,
        learning_rate=0.05,
        num_leaves=31,
        min_child_samples=20,
        subsample=0.8,
        colsample_bytree=0.8,
        random_state=42,
        class_weight="balanced",
        verbose=-1,
    )
    lgb_model.fit(X_train, y_train)
    lgb_probs = lgb_model.predict_proba(X_test)[:, 1]
    lgb_preds = lgb_model.predict(X_test)

    lgb_metrics = compute_metrics(y_test, lgb_preds, lgb_probs, "LightGBM")

    # 7. Compare and select best
    print("\n📊 Step 7: Model Comparison")
    print(f"   {'Metric':<25} {'Logistic Reg':<15} {'LightGBM':<15}")
    print(f"   {'-'*55}")
    for metric in ["precision", "recall", "f1", "pr_auc", "roc_auc", "brier_score"]:
        lr_val = lr_metrics[metric]
        lgb_val = lgb_metrics[metric]
        better = "◀" if lr_val > lgb_val else "▶" if lgb_val > lr_val else "="
        if metric == "brier_score":
            better = "◀" if lr_val < lgb_val else "▶" if lgb_val < lr_val else "="
        print(f"   {metric:<25} {lr_val:<15.4f} {lgb_val:<15.4f} {better}")

    # Select best model (based on PR-AUC as primary metric)
    if lgb_metrics["pr_auc"] >= lr_metrics["pr_auc"]:
        best_name = "LightGBM"
        best_model = lgb_model
        best_metrics = lgb_metrics
        best_probs = lgb_probs
        best_needs_scaler = False
        print(f"\n   ✅ Selected: LightGBM (PR-AUC: {lgb_metrics['pr_auc']:.4f})")
    else:
        best_name = "Logistic Regression"
        best_model = lr_model
        best_metrics = lr_metrics
        best_probs = lr_probs
        best_needs_scaler = True
        print(f"\n   ✅ Selected: Logistic Regression (PR-AUC: {lr_metrics['pr_auc']:.4f})")

    # 8. Calibrate probabilities
    print("\n🎯 Step 8: Calibrating probabilities...")
    if best_needs_scaler:
        cal_model = CalibratedClassifierCV(lr_model, cv=3, method="isotonic")
        cal_model.fit(X_train_scaled, y_train)
        cal_probs = cal_model.predict_proba(X_test_scaled)[:, 1]
    else:
        cal_model = CalibratedClassifierCV(lgb_model, cv=3, method="isotonic")
        cal_model.fit(X_train, y_train)
        cal_probs = cal_model.predict_proba(X_test)[:, 1]

    cal_brier = brier_score_loss(y_test, cal_probs)
    orig_brier = best_metrics["brier_score"]
    print(f"   Brier score before calibration: {orig_brier:.4f}")
    print(f"   Brier score after calibration:  {cal_brier:.4f}")

    # 9. Regression model for delay days
    print("\n📈 Step 9: Training delay days regression...")
    reg_model = lgb.LGBMRegressor(
        n_estimators=150,
        max_depth=5,
        learning_rate=0.05,
        random_state=42,
        verbose=-1,
    )
    reg_model.fit(X_train, y_reg_train)
    reg_preds = reg_model.predict(X_test)
    reg_mae = mean_absolute_error(y_reg_test, reg_preds)
    print(f"   Delay days MAE: {reg_mae:.1f} days")

    # 10. SHAP explanations
    print("\n🔍 Step 10: Generating SHAP explainer...")
    if best_name == "LightGBM":
        explainer = shap.TreeExplainer(lgb_model)
    else:
        explainer = shap.LinearExplainer(lr_model, X_train_scaled)
    print("   ✅ SHAP explainer created")

    # 11. Save artifacts
    print("\n💾 Step 11: Saving model artifacts...")
    version = "v1.0.0"
    timestamp = datetime.utcnow().isoformat()

    # Save models
    joblib.dump(best_model, MODEL_DIR / "classifier.joblib")
    joblib.dump(cal_model, MODEL_DIR / "classifier_calibrated.joblib")
    joblib.dump(reg_model, MODEL_DIR / "regressor.joblib")
    joblib.dump(explainer, MODEL_DIR / "shap_explainer.joblib")
    if best_needs_scaler:
        joblib.dump(scaler, MODEL_DIR / "scaler.joblib")

    # Feature names
    joblib.dump(FEATURE_COLUMNS, MODEL_DIR / "feature_columns.joblib")

    # Save metadata
    metadata = {
        "model_version": version,
        "model_type": best_name,
        "training_timestamp": timestamp,
        "training_dataset": {
            "n_projects": len(projects_df),
            "n_snapshots": len(snapshots_df),
            "n_training_samples": len(X_train),
            "n_test_samples": len(X_test),
            "target_distribution": dict(y_class.value_counts().items()),
            "seed": 42,
            "seed_version": "v1.0-synthetic",
            "is_synthetic": True,
        },
        "feature_schema_version": "v1.0",
        "n_features": len(FEATURE_COLUMNS),
        "requires_scaler": best_needs_scaler,
        "validation_metrics": {
            "classification": best_metrics,
            "regression": {"mae": round(reg_mae, 2)},
            "calibration": {
                "brier_before": round(orig_brier, 4),
                "brier_after": round(cal_brier, 4),
            },
        },
        "baseline_comparison": {
            "logistic_regression": lr_metrics,
            "lightgbm": lgb_metrics,
        },
        "status": "approved",
    }

    with open(MODEL_DIR / "model_metadata.json", "w") as f:
        json.dump(metadata, f, indent=2, default=str)

    # Save synthetic data for reference
    data_dir = MODEL_DIR / "training_data"
    data_dir.mkdir(exist_ok=True)
    projects_df.to_csv(data_dir / "synthetic_projects.csv", index=False)
    snapshots_df.to_csv(data_dir / "synthetic_snapshots.csv", index=False)

    print(f"   ✅ All artifacts saved to {MODEL_DIR}")

    # Summary
    print("\n" + "=" * 60)
    print("TRAINING COMPLETE")
    print("=" * 60)
    print(f"   Model: {best_name} v{version}")
    print(f"   PR-AUC: {best_metrics['pr_auc']:.4f}")
    print(f"   F1: {best_metrics['f1']:.4f}")
    print(f"   Brier (calibrated): {cal_brier:.4f}")
    print(f"   Delay MAE: {reg_mae:.1f} days")
    print(f"   Features: {len(FEATURE_COLUMNS)}")
    print(f"   Leakage: ✅ None detected")
    print(f"   Data: ⚠️ Synthetic (clearly labelled)")

    return metadata


def compute_metrics(y_true, y_pred, y_prob, name: str) -> dict:
    """Compute classification metrics."""
    precision = precision_score(y_true, y_pred, zero_division=0)
    recall = recall_score(y_true, y_pred, zero_division=0)
    f1 = f1_score(y_true, y_pred, zero_division=0)
    pr_auc = average_precision_score(y_true, y_prob)
    roc_auc = roc_auc_score(y_true, y_prob)
    brier = brier_score_loss(y_true, y_prob)

    print(f"\n   {name} Metrics:")
    print(f"     Precision: {precision:.4f}")
    print(f"     Recall:    {recall:.4f}")
    print(f"     F1:        {f1:.4f}")
    print(f"     PR-AUC:    {pr_auc:.4f}")
    print(f"     ROC-AUC:   {roc_auc:.4f}")
    print(f"     Brier:     {brier:.4f}")

    return {
        "precision": round(precision, 4),
        "recall": round(recall, 4),
        "f1": round(f1, 4),
        "pr_auc": round(pr_auc, 4),
        "roc_auc": round(roc_auc, 4),
        "brier_score": round(brier, 4),
    }


if __name__ == "__main__":
    train_pipeline()
