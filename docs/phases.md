# Implementation Roadmap
## Predictive Land Acquisition Intelligence & Early-Intervention Decision Support Platform

### Execution Rule

Treat each **MILESTONE** as one execution unit. Do not treat individual tasks as separate approval gates.

Within a milestone:
1. Inspect the existing project state.
2. Complete the dependent tasks.
3. Test the implementation.
4. Verify the milestone output.
5. Then proceed to the next milestone.

Do not redesign the approved architecture without a concrete technical reason. Ask before destructive or irreversible operations.

---

# MILESTONE 0 — PROJECT ORIENTATION & PLAN

### Objective
Understand the specification and establish the implementation direction before substantial development.

### Tasks
- Read `prd.md`.
- Read `technology_architecture.md`.
- Read `data_dictionary.md`.
- Read `design.md`.
- Read this `phases.md`.
- Inspect the existing repository before modifying it.
- Compare the implementation plan against the documentation.
- Identify missing dependencies, contradictions, or blocking decisions.
- Establish the initial project structure.
- Do not make substantial feature implementation changes during this milestone.

### Output
A clear implementation baseline with the documentation and existing repository treated as the project source of truth.

---

# MILESTONE 1 — FOUNDATION

### Objective
Build a stable local application foundation.

### Tasks
- Create React + TypeScript + Vite frontend.
- Create Python + FastAPI backend.
- Establish modular frontend/backend structure.
- Establish a small reusable UI foundation consistent with `design.md`:
  - layout/sidebar
  - buttons
  - inputs
  - cards
  - badges
  - risk indicators
- Defer complex page assembly to later milestones.
- Configure local environment and secrets safely.
- Install/configure local PostgreSQL + PostGIS.
- Create initial database schema/migrations.
- Establish geographic data support.
- Implement JWT authentication and secure password hashing.
- Implement Admin-created users.
- Implement Central/State/District RBAC.
- Enforce geographic scope in backend APIs.
- Add basic API/database health diagnostics.

### Output
The application runs locally with PostgreSQL/PostGIS, a core UI foundation, and secure role-based authentication.

---

# MILESTONE 2 — DATA + ML

### Objective
Create the trustworthy data and prediction foundation.

### Tasks
- Implement the canonical data model from `data_dictionary.md`.
- Separate operational and historical/training data.
- Generate complete synthetic project histories.
- Derive chronological historical snapshots.
- Validate dates, balances, progress, and outcomes.
- Clearly label synthetic data.
- Build the feature and target pipeline.
- Define `next_stage_delayed_30d`.
- Define `next_stage_delay_days`.
- Add leakage checks.
- Establish baseline models.
- Train and evaluate LightGBM.
- Calibrate probabilities where appropriate.
- Generate SHAP explanations.
- Version dataset, feature schema, and model metadata.

### Output
A validated, reproducible training pipeline and approved prototype model.

---

# MILESTONE 3 — CORE APPLICATION

### Objective
Connect real project workflows to the trained model.

### Tasks
- Implement project creation using observed records.
- Validate inputs and calculate derived fields.
- Save project state/history.
- Run the existing approved model after project creation.
- Store the prediction.
- Implement project updates as new chronological snapshots.
- Re-run the existing model after updates.
- Do not retrain on operational updates.
- Detect meaningful risk changes.
- Build Existing Projects.
- Build Project Details.
- Display:
  - risk
  - prediction
  - confidence
  - data freshness
  - SHAP factors
  - current stage
  - progress
  - timeline
- Add explainable intervention recommendations.

### Output
A complete project creation → prediction → update → re-prediction workflow.

---

# MILESTONE 4 — DASHBOARD + GIS + ANALYTICS

### Objective
Turn predictions into an operational decision-support interface.

### Tasks
- Build role-scoped dashboard KPIs.
- Build high-risk project views.
- Build risk and trend analytics.
- Implement PostGIS project geometry.
- Implement Leaflet GIS map.
- Add role-scoped risk markers.
- Add risk heatmap.
- Link map projects to Project Details.
- Add state/district comparisons.
- Add stage-wise analytics.
- Add parameter/risk-driver analytics.
- Add timeline analysis.
- Distinguish descriptive analytics from model predictions.

### Output
A role-aware monitoring, GIS, and analytics experience.

---

# MILESTONE 5 — ALERTS + AUDIT + MODEL GOVERNANCE

### Objective
Make the system traceable and operationally useful.

### Tasks
- Implement in-app notifications.
- Alert on configured high/critical risk changes.
- Add appropriate stale-data alerts.
- Implement project audit history.
- Record actor, action, timestamp, and relevant changes.
- Keep completed projects out of active dashboard, GIS, and alerts while preserving historical records.
- Implement model, dataset, and schema versioning.
- Add controlled validation and approval workflow for future model updates.
- Never automatically retrain after every project update.

### Output
An auditable system with alerts and a controlled model lifecycle.

---

# MILESTONE 6 — SECURITY + TESTING + SIH POLISH

### Objective
Make the prototype reliable, demonstrable, and defensible.

### Tasks
- Test backend authorization and geographic RBAC.
- Test database and data integrity.
- Test frontend workflows.
- Test ML leakage and prediction consistency.
- Test synthetic-data validity.
- Test GIS scope.
- Test notifications and audit logging.
- Harden secret and configuration handling.
- Polish Dashboard, Project Details, and GIS.
- Make risk explanations and confidence/data freshness obvious.
- Prepare a deterministic end-to-end SIH demonstration.
- Document assumptions, limitations, and evaluation results.
- Do not fabricate government integrations, model accuracy, or impact claims.

### Output
A tested and polished SIH prototype ready for demonstration.

---

# MODEL HANDOFF RULE

When changing models during development, do not rely on conversational memory alone.

Before continuing, inspect:

- Current repository/code.
- Project documentation.
- Current milestone.
- Existing implementation status.
- Recent build/test results.
- Relevant database/schema state.

Treat the documentation and existing code as the source of truth.

Do not recreate or redesign completed work merely because a different model is being used.

---

# DEPENDENCY CHAIN

```text
M0  Orientation & Plan
        ↓
M1  Foundation
        ↓
M2  Data + ML
        ↓
M3  Core Application
        ↓
M4  Dashboard + GIS + Analytics
        ↓
M5  Alerts + Audit + Model Governance
        ↓
M6  Security + Testing + SIH Polish
```

# DEFINITION OF DONE

The prototype is complete when:

1. It runs locally without Docker.
2. PostgreSQL/PostGIS works.
3. Server-side RBAC works.
4. Officers enter observed records rather than risk scores.
5. Project state history is chronological.
6. The approved model predicts from current state.
7. The primary target is explicitly defined.
8. Leakage checks exist.
9. SHAP explanations work.
10. Risk, confidence, and data freshness are visible.
11. Completed projects are separated from active projects.
12. GIS is role-scoped.
13. Alerts and audit trails work.
14. Synthetic data is clearly labelled and validated.
15. Security, data, and ML tests pass.
16. Documentation matches the implementation.
17. No Docker, deployment infrastructure, or fabricated external integrations are required.
