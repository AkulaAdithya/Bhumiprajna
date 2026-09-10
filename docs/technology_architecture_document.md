# Technology Architecture
## Predictive Land Acquisition Intelligence & Early-Intervention Decision Support Platform

### 1. Architecture Principles
- Local-first development.
- No Docker.
- No deployment infrastructure.
- Backend-enforced RBAC.
- PostgreSQL/PostGIS as the operational database.
- ML separated from business logic.
- Historical training data separated from active operational data.
- Prediction uses current observable state only.
- Every important mutation is auditable.
- Integrations are abstracted and must never be fabricated.

### 2. Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | React | Web UI |
| Frontend language | TypeScript | Type-safe application code |
| Build tooling | Vite | Local development/build |
| Styling | Tailwind CSS | UI styling |
| Maps | Leaflet | Interactive GIS |
| Charts | Plotly | Analytics/visualizations |
| Backend | Python | Application + ML ecosystem |
| API framework | FastAPI | REST API |
| ASGI server | Uvicorn | Local API serving |
| Validation | Pydantic | Request/response validation |
| Database | PostgreSQL | Relational operational data |
| Spatial DB | PostGIS | Geographic data and queries |
| Data processing | Pandas | Dataset processing |
| Numerical computing | NumPy | Numerical operations |
| ML baseline | scikit-learn | Baselines, preprocessing, metrics, calibration |
| ML candidate | LightGBM | Tabular prediction |
| Explainability | SHAP | Feature contribution explanations |
| Authentication | JWT | Stateless API authentication |
| Password security | Secure password hashing | Credential protection |
| Authorization | Application RBAC | Role/scope enforcement |
| Audit | PostgreSQL-backed audit records | Traceability |

### 3. Explicitly Not Used
- Docker.
- Docker Compose.
- Kubernetes.
- AWS/Azure/GCP deployment.
- Vercel/cloud hosting.
- Production hosting infrastructure.
- Email/SMS notification infrastructure.

### 4. Logical Architecture
```text
React + TypeScript
        |
        | REST/JSON
        v
FastAPI Backend
  |      |       |
  |      |       +--> Auth/RBAC
  |      |
  |      +----------> Prediction Service
  |                       |
  |                       +--> scikit-learn baselines
  |                       +--> LightGBM model
  |                       +--> SHAP explainer
  |
  +---------------------> PostgreSQL + PostGIS
                            |
                            +--> Operational Projects
                            +--> Project State History
                            +--> Users/Roles
                            +--> Notifications
                            +--> Audit Logs
                            +--> Spatial Data

Offline/controlled ML workflow
Historical Data
     |
     v
Pandas / NumPy
     |
     v
Validation + feature construction
     |
     v
Baseline comparison + LightGBM
     |
     v
Evaluation + calibration + SHAP
     |
     v
Approved model artifact + metadata
     |
     v
Prediction Service
```

### 5. Backend Modules
Recommended FastAPI modules:
- `auth`
- `users`
- `roles`
- `projects`
- `project_updates`
- `stages`
- `predictions`
- `recommendations`
- `notifications`
- `analytics`
- `gis`
- `audit`
- `data_quality`
- `ml`
- `admin`

Keep domain services separate from route handlers.

### 6. Frontend Modules
Recommended React structure:
- `auth`
- `layout`
- `dashboard`
- `projects`
- `project-details`
- `project-update`
- `project-create`
- `gis`
- `analytics`
- `notifications`
- `admin`
- `shared`

Use reusable components for:
- Risk badges.
- KPI cards.
- Progress indicators.
- Charts.
- Map markers.
- Tables.
- Filters.
- Timeline.
- SHAP/risk-factor display.

### 7. Database Architecture
Core entities:
- users
- roles
- geographic scopes
- projects
- project_state_snapshots
- stage definitions
- project stages
- parameter observations
- predictions
- recommendations
- notifications
- audit_logs
- model_versions
- historical_projects
- historical_project_snapshots

Operational and historical datasets may share controlled reference tables, but training records must not accidentally become active projects.

### 8. Project State Model
Each update represents an observation at a point in time.

Conceptually:
```text
Project
  ├── identity
  ├── location
  ├── lifecycle status
  ├── current stage
  └── ordered state history
          ├── observation 1
          ├── observation 2
          └── observation N
```

This allows the system to reconstruct how risk changed over time.

### 9. Prediction Architecture
Input:
- Project details.
- Current stage.
- Current parameter observations.
- Historical context available at prediction time.

Output:
- `next_stage_delayed_30d_probability`
- `next_stage_delayed_30d`
- `next_stage_delay_days` where regression model is available.
- Risk category.
- Confidence/data-quality metadata.
- Top SHAP contributors.
- Recommendations.

Prediction must be deterministic/reproducible for a fixed model version and input state where practical.

### 10. Training Architecture
```text
Completed Project Histories
        |
        v
Chronological snapshots
        |
        v
Feature/target construction
        |
        v
Leakage checks
        |
        +--> Baseline models
        |
        +--> LightGBM
        |
        v
Validation + calibration
        |
        v
Model registry/version metadata
```

Synthetic data:
- Generate complete project histories first.
- Derive snapshots from those histories.
- Preserve chronological consistency.
- Use domain-constrained relationships.
- Clearly label synthetic records.

Never independently randomize each snapshot.

### 11. API Design
Use versioned REST endpoints, for example:
```text
/api/v1/auth/login
/api/v1/users
/api/v1/projects
/api/v1/projects/{id}
/api/v1/projects/{id}/updates
/api/v1/projects/{id}/predict
/api/v1/projects/{id}/history
/api/v1/dashboard
/api/v1/analytics
/api/v1/gis
/api/v1/notifications
/api/v1/audit
/api/v1/admin
```

Exact endpoint contracts should be documented in the implementation.

### 12. Security Architecture
- JWT authentication.
- Password hashing; never store plaintext passwords.
- Backend permission checks on every protected resource.
- Geographic scope checks.
- Input validation using Pydantic.
- Parameterized database operations/ORM-safe access.
- Secrets stored outside source code.
- Audit sensitive mutations.
- Do not expose model/data administration endpoints to ordinary officers.

### 13. GIS Architecture
Store project coordinates/geometries in PostGIS.

Frontend:
- Leaflet renders maps.
- Backend returns only authorized project geometries.
- Risk category is associated with the returned project.
- Heatmap data is derived from authorized project states.

Do not rely on frontend filtering for geographic security.

### 14. Notification Architecture
Notifications are stored in the database and shown in-app.

Flow:
```text
Project update
   -> validation
   -> prediction
   -> threshold/change detection
   -> notification record
   -> officer notification center
```

No email/SMS dependency is required.

### 15. Audit Architecture
For important changes:
```text
User -> API -> authorization -> mutation
                    |
                    +-> audit event
                    +-> prediction event if applicable
                    +-> notification event if applicable
```

Audit events should include actor, timestamp, project, action and changed fields.

### 16. Local Development
Required local services:
- PostgreSQL with PostGIS.
- FastAPI/Uvicorn.
- React/Vite development server.

The stack runs directly on Windows. Docker is intentionally excluded.

### 17. Deployment Boundary
Deployment is not part of this SIH prototype architecture. Keep interfaces modular so deployment can be considered later without designing the current project around cloud infrastructure.
