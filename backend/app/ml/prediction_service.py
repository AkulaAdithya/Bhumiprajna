"""
Pravaah - ML Prediction Service
Loads trained model artifacts and provides predictions for operational projects.
Uses only current observable state — no future information.
"""

import json
import os
from pathlib import Path
from typing import Dict, List, Optional, Any
from datetime import date, datetime

import joblib
import numpy as np
import pandas as pd
import shap

MODEL_DIR = Path(__file__).parent.parent.parent / "models"

# Feature labels for SHAP explanations (human-readable)
FEATURE_LABELS = {
    "land_area": "Total Land Area",
    "affected_families": "Affected Families Count",
    "project_type_encoded": "Project Type",
    "current_stage_encoded": "Current Acquisition Stage",
    "approvals_required": "Approvals Required",
    "approvals_completed": "Approvals Completed",
    "approvals_pending": "Pending Approvals",
    "approval_progress_pct": "Approval Progress",
    "oldest_pending_approval_days": "Oldest Pending Approval (days)",
    "legal_cases_total": "Total Legal Cases",
    "legal_cases_pending": "Pending Legal Cases",
    "legal_cases_resolved": "Resolved Legal Cases",
    "disputed_land_area": "Disputed Land Area",
    "oldest_pending_case_days": "Oldest Pending Case (days)",
    "legal_resolution_rate": "Legal Resolution Rate",
    "compensation_total_amount": "Total Compensation",
    "compensation_paid_amount": "Compensation Paid",
    "compensation_pending_amount": "Pending Compensation",
    "beneficiaries_eligible": "Eligible Beneficiaries",
    "beneficiaries_compensated": "Compensated Beneficiaries",
    "beneficiaries_pending": "Pending Beneficiaries",
    "compensation_progress_pct": "Compensation Progress",
    "documents_required": "Documents Required",
    "documents_submitted": "Documents Submitted",
    "documents_verified": "Documents Verified",
    "documents_incomplete": "Incomplete Documents",
    "documentation_progress_pct": "Documentation Progress",
    "verification_rate": "Document Verification Rate",
    "notifications_required": "Notifications Required",
    "notifications_issued": "Notifications Issued",
    "notifications_pending": "Pending Notifications",
    "notification_progress_pct": "Notification Progress",
    "parcels_total": "Total Parcels",
    "parcels_disputed": "Disputed Parcels",
    "ownership_conflicts_pending": "Pending Ownership Conflicts",
    "ownership_conflicts_resolved": "Resolved Ownership Conflicts",
    "ownership_dispute_rate": "Ownership Dispute Rate",
    "rr_families_required": "R&R Families Required",
    "rr_families_completed": "R&R Families Completed",
    "rr_families_pending": "R&R Families Pending",
    "rr_progress_pct": "R&R Progress",
    "land_required_for_possession": "Land Required for Possession",
    "land_acquired_for_possession": "Land Acquired for Possession",
    "possession_progress_pct": "Possession Progress",
    "stakeholder_requests_raised": "Stakeholder Requests Raised",
    "stakeholder_responses_received": "Stakeholder Responses Received",
    "stakeholder_requests_pending": "Pending Stakeholder Requests",
    "average_response_time_days": "Avg Response Time (days)",
    "stakeholder_response_rate": "Stakeholder Response Rate",
    "departments_involved": "Departments Involved",
    "coordination_requests_raised": "Coordination Requests",
    "coordination_requests_resolved": "Coordination Resolved",
    "coordination_requests_pending": "Pending Coordination",
    "average_coordination_response_days": "Avg Coordination Time (days)",
    "coordination_resolution_rate": "Coordination Resolution Rate",
    "days_in_current_stage": "Days in Current Stage",
    "total_project_days": "Total Project Duration (days)",
    "pending_actions_total": "Total Pending Actions",
    "overall_progress_score": "Overall Progress Score",
    "bottleneck_score": "Bottleneck Score",
}


class PredictionService:
    """Loads model artifacts and provides predictions."""

    def __init__(self):
        self.classifier = None
        self.calibrated_classifier = None
        self.regressor = None
        self.explainer = None
        self.scaler = None
        self.feature_columns = None
        self.metadata = None
        self._loaded = False
        self._use_calibrated = False  # Disabled until validated

    def load(self):
        """Load all model artifacts from disk."""
        if self._loaded:
            return

        try:
            self.classifier = joblib.load(MODEL_DIR / "classifier.joblib")
            self.calibrated_classifier = joblib.load(MODEL_DIR / "classifier_calibrated.joblib")
            self.regressor = joblib.load(MODEL_DIR / "regressor.joblib")
            self.explainer = joblib.load(MODEL_DIR / "shap_explainer.joblib")
            self.feature_columns = joblib.load(MODEL_DIR / "feature_columns.joblib")

            scaler_path = MODEL_DIR / "scaler.joblib"
            if scaler_path.exists():
                self.scaler = joblib.load(scaler_path)

            metadata_path = MODEL_DIR / "model_metadata.json"
            if metadata_path.exists():
                with open(metadata_path) as f:
                    self.metadata = json.load(f)

            self._loaded = True
            self._validate_calibration()
            model_type = self.metadata.get('model_type', 'unknown') if self.metadata else 'unknown'
            model_ver = self.metadata.get('model_version', '?') if self.metadata else '?'
            cal_status = "calibrated" if self._use_calibrated else "raw (calibration degenerate)"
            print(f"[OK] ML models loaded: {model_type} v{model_ver} [{cal_status}]")
        except Exception as e:
            print(f"[WARNING] ML models not loaded: {e}")
            self._loaded = False

    def _validate_calibration(self):
        """
        Probe the calibrated classifier with a small spread of synthetic inputs.
        If it outputs the same probability for all (variance < 0.01), the
        isotonic mapping is degenerate — fall back to the raw classifier.
        """
        try:
            n_cols = len(self.feature_columns)
            # Three sentinel rows: all zeros, moderate values, high values
            sentinels = np.array([
                np.zeros(n_cols),
                np.full(n_cols, 0.5),
                np.full(n_cols, 1.0),
            ], dtype="float64")
            X_sent = pd.DataFrame(sentinels, columns=self.feature_columns)
            cal_probs = self.calibrated_classifier.predict_proba(X_sent)[:, 1]
            prob_variance = float(np.var(cal_probs))
            if prob_variance < 0.01:
                print(
                    f"[WARNING] Calibrated classifier is degenerate "
                    f"(output variance={prob_variance:.6f} across sentinel inputs). "
                    f"Falling back to raw classifier for predictions."
                )
                self._use_calibrated = False
            else:
                self._use_calibrated = True
        except Exception as e:
            print(f"[WARNING] Calibration validation failed: {e}. Using raw classifier.")
            self._use_calibrated = False

    def predict(self, features: Dict[str, Any], snapshot_date: Optional[date] = None) -> Dict[str, Any]:
        """
        Generate prediction from current observable state.
        
        Args:
            features: Dictionary of current project state features.
            snapshot_date: Date of observation (for data freshness).
        
        Returns:
            Prediction result with probability, risk category, SHAP factors, recommendations.
        """
        if not self._loaded:
            self.load()

        if not self._loaded:
            return self._fallback_prediction(features)

        # Build feature vector — replace None with 0.0 and enforce float64 dtype
        feature_vector = [float(v) if v is not None else 0.0 for v in self._build_feature_vector(features)]
        X = pd.DataFrame([feature_vector], columns=self.feature_columns).astype("float64")

        # Predict probability — use calibrated only if it passed validation
        try:
            if self._use_calibrated:
                prob = self.calibrated_classifier.predict_proba(X)[0][1]
            else:
                prob = self.classifier.predict_proba(X)[0][1]
        except Exception:
            prob = self.classifier.predict_proba(X)[0][1]

        prob = float(np.clip(prob, 0, 1))

        # Predict delay days
        try:
            delay_days = float(max(0, self.regressor.predict(X)[0]))
        except Exception:
            delay_days = None

        # Risk category
        risk_category = self._categorize_risk(prob)

        # Data freshness
        data_freshness_days = 0
        if snapshot_date:
            data_freshness_days = (date.today() - snapshot_date).days

        # Confidence score
        confidence = self._compute_confidence(prob, features, data_freshness_days)

        # SHAP explanations
        top_factors = self._get_shap_factors(X)

        # Recommendations
        recommendations = self._generate_recommendations(top_factors, risk_category, features)

        return {
            "delay_probability": round(prob, 4),
            "predicted_delay_days": round(delay_days, 1) if delay_days else None,
            "risk_category": risk_category,
            "confidence_score": round(confidence, 2),
            "data_freshness_days": data_freshness_days,
            "top_factors": top_factors,
            "recommendations": recommendations,
            "model_version": self.metadata.get("model_version", "unknown") if self.metadata else "unknown",
        }

    def _build_feature_vector(self, features: Dict[str, Any]) -> List[float]:
        """Build ordered feature vector from dictionary."""
        from ml_pipeline.feature_engineering import FEATURE_COLUMNS, PROJECT_TYPE_MAP, STAGE_MAP

        # Set defaults and compute derived features
        feat = {}

        # Direct mappings
        for col in FEATURE_COLUMNS:
            feat[col] = features.get(col, 0)

        # Encode categoricals
        feat["project_type_encoded"] = PROJECT_TYPE_MAP.get(features.get("project_type", "OTHER"), 8)
        feat["current_stage_encoded"] = STAGE_MAP.get(features.get("current_stage", ""), 0)

        # Derived features
        legal_total = features.get("legal_cases_total", 0)
        legal_resolved = features.get("legal_cases_resolved", 0)
        feat["legal_resolution_rate"] = legal_resolved / max(legal_total, 1)

        docs_submitted = features.get("documents_submitted", 0)
        docs_verified = features.get("documents_verified", 0)
        feat["verification_rate"] = docs_verified / max(docs_submitted, 1)

        parcels_total = features.get("parcels_total", 0)
        parcels_disputed = features.get("parcels_disputed", 0)
        feat["ownership_dispute_rate"] = parcels_disputed / max(parcels_total, 1)

        sth_raised = features.get("stakeholder_requests_raised", 0)
        sth_received = features.get("stakeholder_responses_received", 0)
        feat["stakeholder_response_rate"] = sth_received / max(sth_raised, 1)

        coord_raised = features.get("coordination_requests_raised", 0)
        coord_resolved = features.get("coordination_requests_resolved", 0)
        feat["coordination_resolution_rate"] = coord_resolved / max(coord_raised, 1)

        # Pending actions total
        feat["pending_actions_total"] = (
            features.get("approvals_pending", 0) +
            features.get("legal_cases_pending", 0) +
            features.get("beneficiaries_pending", 0) +
            features.get("documents_incomplete", 0) +
            features.get("notifications_pending", 0) +
            features.get("ownership_conflicts_pending", 0) +
            features.get("rr_families_pending", 0) +
            features.get("stakeholder_requests_pending", 0) +
            features.get("coordination_requests_pending", 0)
        )

        # Progress score
        progress_vals = [
            features.get("approval_progress_pct", 0),
            features.get("compensation_progress_pct", 0),
            features.get("documentation_progress_pct", 0),
            features.get("notification_progress_pct", 0),
            features.get("rr_progress_pct", 0),
            features.get("possession_progress_pct", 0),
        ]
        feat["overall_progress_score"] = np.mean(progress_vals)
        feat["bottleneck_score"] = 100 - min(progress_vals)

        return [feat.get(col, 0) for col in FEATURE_COLUMNS]

    def _categorize_risk(self, probability: float) -> str:
        """Categorize risk from delay probability."""
        if probability >= 0.75:
            return "CRITICAL"
        elif probability >= 0.50:
            return "HIGH"
        elif probability >= 0.25:
            return "MEDIUM"
        return "LOW"

    def _compute_confidence(self, prob: float, features: Dict, freshness_days: int) -> float:
        """
        Compute confidence score. 
        Risk ≠ Confidence ≠ Data Freshness (these are separate concepts).
        Confidence reflects data completeness and freshness.
        """
        # Start with base confidence
        confidence = 0.8

        # Penalize stale data
        if freshness_days > 60:
            confidence -= 0.3
        elif freshness_days > 30:
            confidence -= 0.15
        elif freshness_days > 14:
            confidence -= 0.05

        # Penalize missing/zero data
        key_fields = ["land_area", "affected_families", "approvals_required", "compensation_total_amount"]
        missing = sum(1 for f in key_fields if features.get(f, 0) == 0)
        confidence -= missing * 0.05

        return max(0.1, min(1.0, confidence))

    def _get_shap_factors(self, X: pd.DataFrame, top_n: int = 6) -> List[Dict]:
        """Get top SHAP contributing factors."""
        try:
            shap_values = self.explainer.shap_values(X)

            # Handle different SHAP value formats
            if isinstance(shap_values, list):
                values = shap_values[1][0]  # Class 1 (delayed)
            elif hasattr(shap_values, 'values'):
                values = shap_values.values[0]
            else:
                values = shap_values[0]

            # Sort by absolute contribution
            indices = np.argsort(np.abs(values))[::-1][:top_n]

            factors = []
            for idx in indices:
                feature_name = self.feature_columns[idx]
                contribution = float(values[idx])
                factors.append({
                    "feature": feature_name,
                    "label": FEATURE_LABELS.get(feature_name, feature_name),
                    "contribution": round(abs(contribution), 4),
                    "direction": "increases_risk" if contribution > 0 else "decreases_risk",
                })

            return factors
        except Exception as e:
            print(f"SHAP error: {e}")
            return []

    def _generate_recommendations(self, factors: List[Dict], risk: str, features: Dict) -> List[str]:
        """Generate decision-support recommendations based on risk factors."""
        recs = []

        for factor in factors[:4]:
            if factor["direction"] != "increases_risk":
                continue

            feat = factor["feature"]

            if "legal" in feat and "pending" in feat:
                recs.append("Prioritize resolution of pending legal disputes to reduce acquisition delays.")
            elif "approval" in feat and "pending" in feat:
                recs.append("Expedite pending administrative approvals — consider escalation if overdue.")
            elif "compensation" in feat and ("pending" in feat or "progress" in feat):
                recs.append("Accelerate compensation disbursement to affected beneficiaries.")
            elif "document" in feat:
                recs.append("Follow up on incomplete or unverified documentation.")
            elif "ownership" in feat or "disputed" in feat:
                recs.append("Address outstanding ownership conflicts and disputed parcels.")
            elif "rr" in feat and "pending" in feat:
                recs.append("Focus on completing rehabilitation & resettlement for remaining families.")
            elif "stakeholder" in feat:
                recs.append("Improve stakeholder response times — consider direct outreach.")
            elif "coordination" in feat:
                recs.append("Strengthen inter-department coordination to resolve pending requests.")
            elif "possession" in feat:
                recs.append("Review possession progress and address barriers to land handover.")
            elif "bottleneck" in feat:
                recs.append("Address the most lagging parameter area to unblock overall progress.")
            elif "days_in_current_stage" in feat:
                recs.append("Review why the project has been in the current stage for an extended period.")

        if risk in ("HIGH", "CRITICAL") and not recs:
            recs.append("Schedule an urgent review meeting to assess all pending actions.")

        if not recs:
            recs.append("Continue monitoring project progress and maintain current pace.")

        return recs[:5]

    def _fallback_prediction(self, features: Dict) -> Dict:
        """Fallback when models aren't loaded."""
        return {
            "delay_probability": 0.0,
            "predicted_delay_days": None,
            "risk_category": "LOW",
            "confidence_score": 0.0,
            "data_freshness_days": 0,
            "top_factors": [],
            "recommendations": ["Model not loaded — predictions unavailable."],
            "model_version": "unavailable",
        }


# Singleton instance
prediction_service = PredictionService()
