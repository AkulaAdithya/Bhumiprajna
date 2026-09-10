# Product Requirements Document (PRD)
## Predictive Land Acquisition Intelligence & Early-Intervention Decision Support Platform

### 1. Purpose
Build a local, functional web application for SIH26017: **Predictive Analytics System for Early Detection of Land Acquisition Delays**.

The system converts project records supplied by authorized officers into a structured project state, predicts the probability of upcoming stage delays, explains the main contributing factors, prioritizes interventions, and maintains an auditable project history.

This is a decision-support system. It does not automatically make legal, administrative, compensation, or acquisition decisions.

### 2. Core Product Loop
**Predict → Explain → Prioritize → Intervene → Learn**

For every active project, the system should answer:
- What is the current project state?
- What is the next critical stage/milestone?
- How likely is that stage to be delayed?
- What is the expected delay?
- How confident is the prediction and how fresh is the data?
- What factors are contributing most to the risk?
- What action should the responsible officer prioritize?

### 3. Scope
#### In scope
- Role-based authentication and authorization.
- Admin-controlled officer account creation.
- Central, State, and District officer dashboards.
- Project creation and parameter-wise current-state entry.
- Project updates from latest observed records.
- Historical/completed project dataset management for ML.
- Synthetic historical data generation for prototype training.
- Stage-aware delay prediction.
- Risk categories and calibrated probabilities.
- Explainable predictions using SHAP.
- Recommended interventions.
- Existing-project management.
- GIS map and risk heatmap.
- District/state analytics.
- In-app alerts and notifications.
- Audit trails.
- Data freshness and data-quality indicators.
- Controlled model evaluation/retraining workflow.
- Local PostgreSQL/PostGIS operation.

#### Explicitly out of scope
- Docker/Docker Compose.
- Cloud deployment or production hosting.
- AWS/Azure/GCP/Vercel deployment.
- Email/SMS infrastructure.
- Automatic legal decisions or compensation decisions.
- Automatic model retraining after every project update.
- Fabricated claims of access to government APIs.
- Treating synthetic data as real government data.

### 4. Users and RBAC
#### Central Officer
- India-wide visibility.
- View nationwide project, risk, trend and GIS analytics.
- Manage/inspect state and district performance.

#### State Officer
- Visibility limited to assigned state.
- Manage projects within permitted state scope.
- View state and permitted district analytics.

#### District Officer
- Visibility limited to assigned district.
- Create/update projects within permitted district scope.
- View district projects, risks, alerts and analytics.

#### Admin
- Manage officer accounts and permissions.
- Create/activate/deactivate officers.
- Assign role, state and district scope.
- View audit information.

The backend must enforce RBAC and geographic scope. Frontend hiding alone is not security.

### 5. Authentication
- Login using official email/Officer ID and password.
- No public role-selection during login.
- No unrestricted public sign-up.
- Admin creates officer accounts.
- Prototype may use pre-created demo accounts.
- Passwords must be securely hashed.
- Session/authentication tokens must be handled securely.

### 6. Project Lifecycle
Use operational statuses:
- `ONGOING`
- `COMPLETED`
- `CANCELLED`
- `ON_HOLD`

Only `ONGOING` projects appear in the active dashboard, Existing Projects, active GIS markers and active alerts.

Completed projects remain in the historical/training domain and may be used for future model development and historical analytics.

### 7. Configurable Stage Model
Do not hardcode the stage sequence as a universal legal workflow because acquisition processes can vary by applicable law, state and project.

Prototype stages:
1. Initial Assessment / SIA
2. Notification
3. Objection / Hearing
4. Land & Ownership Verification
5. Award / Valuation
6. Compensation Disbursement
7. Rehabilitation & Resettlement
8. Possession
9. Acquisition Completion

The stage engine must permit configuration later.

### 8. Project Creation
Officers directly provide the records they currently have.

They enter **observed facts/progress**, not a manually assigned risk score or manually calculated delay.

Examples:
- Compensation total: ₹40 crore.
- Amount paid: ₹10 crore.
- Amount pending: ₹30 crore.
- Eligible beneficiaries, compensated beneficiaries, pending beneficiaries.
- Approval records and dates.
- Pending legal cases and disputed land.
- Required/submitted/verified documentation.
- Notification status.
- Ownership conflict status.
- R&R progress.
- Possession progress.
- Stakeholder response information.
- Inter-department coordination information.

The system derives percentages, pending balances, freshness indicators and predictive outputs where appropriate.

### 9. Prediction
Primary prototype target:
- `next_stage_delayed_30d`

Supporting regression output:
- `next_stage_delay_days`

Prediction must use only information available at prediction time.

The system should show:
- Delay probability.
- Risk category: Low / Medium / High / Critical.
- Expected delay/range where supported.
- Confidence/data-quality indicator.
- Current stage and next stage.
- Top contributing factors.
- Recommended interventions.

Risk score and data confidence are separate concepts.

### 10. Machine Learning
Recommended model workflow:
- Establish simple baselines first.
- Compare Logistic Regression and tree/boosting models.
- Evaluate LightGBM as the primary tabular candidate.
- Use SHAP for explanations.
- Calibrate probabilities where appropriate.

Do not assume LightGBM is automatically best.

Evaluation should include:
- Precision/Recall.
- PR-AUC.
- Calibration/Brier score.
- MAE for delay-days regression.
- Lead time for useful warnings.
- Performance across relevant project/state/stage groups where sample size permits.

Avoid target leakage.

### 11. Dashboard
Dashboard should include:
- Total ongoing projects.
- Low/Medium/High/Critical counts.
- High-risk project list.
- Alerts.
- Risk distribution.
- District/state trends.
- Timeline analysis.
- KPIs.
- GIS risk map.
- Risk heatmap.
- Data freshness/quality indicators.

### 12. Existing Projects
- Show active/ongoing projects.
- Search and filter by state, district, project type, stage, status and risk.
- Open a project to see the full Project Details view.
- Completed projects are not mixed into the active-project list.

### 13. Project Details
Show:
- Project identity and location.
- Current status/stage.
- Current progress.
- Risk probability/category.
- Expected delay.
- Prediction confidence/data freshness.
- Timeline.
- Parameter-wise current state.
- Top risk contributors.
- Recommended actions.
- Update history.
- Audit information as permitted by role.

### 14. GIS
- Use PostGIS for spatial storage/querying.
- Use Leaflet for interactive maps.
- Central Officer: India-level view.
- State Officer: state-focused view.
- District Officer: district-focused view.
- Risk-colored markers.
- Risk heatmap.
- Marker click opens the same Project Details component used elsewhere.

### 15. Analytics
Provide:
- State comparison.
- District comparison.
- Risk trend over time.
- Stage-wise delay patterns.
- Parameter/risk-driver analysis.
- Project timeline analysis.
- Comparative KPIs.

Analytics must distinguish descriptive historical statistics from model predictions.

### 16. Alerts and Recommendations
Generate in-app alerts when:
- A project enters a configured high/critical risk state.
- Risk changes materially.
- A critical milestone becomes high risk.
- Data becomes stale enough to affect confidence.

Recommendations are decision-support suggestions, not automatic instructions.

### 17. Audit Trail
Record:
- Who created/updated a project.
- What fields changed.
- Before/after values where appropriate.
- Timestamp.
- Relevant project and user scope.
- Risk/prediction change caused by the update.

Audit records should be append-oriented and protected from ordinary modification.

### 18. Data Architecture
Separate:
1. Operational project data.
2. Historical/completed training data.
3. Model artifacts/metadata.
4. Audit and notification data.

Training eligibility is separate from operational visibility.

### 19. Data Freshness
Every important project state should carry an observation/update date.

If records are stale:
- Show a visible stale-data indicator.
- Reduce/qualify prediction confidence as appropriate.
- Avoid presenting stale predictions as current facts.

### 20. Continuous Learning
Continuous learning means a controlled lifecycle:
New historical data → validation → drift/performance checks → candidate model → evaluation → approval → deployment.

Do not retrain on every operational update.

### 21. Non-Functional Requirements
- Secure backend authorization.
- Explainable predictions.
- Consistent validation.
- Reproducible synthetic-data generation.
- Auditability.
- Responsive dashboard.
- Maintainable modular architecture.
- Clear separation of frontend/backend/data/ML.
- Local Windows development without Docker.

### 22. SIH Demonstration Flow
Recommended demo:
1. Login as a role.
2. View scoped dashboard.
3. Add a project with observed records.
4. Run prediction.
5. Show risk, confidence, SHAP factors and recommendations.
6. Open GIS marker.
7. Update a project parameter.
8. Re-run the existing model.
9. Show changed risk and alert.
10. Complete a project and show that it leaves active views but remains historical.
11. Show analytics and audit trail.
