# PRAVAAH (प्रवाह)
### Predictive Land Acquisition Intelligence & Early-Intervention Decision Support Platform

[![SIH 2024](https://img.shields.io/badge/SIH-SIH26017-orange.svg)](https://www.sih.gov.in/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI%200.115-009688.svg?logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React%2019%20%7C%20TypeScript-61DAFB.svg?logo=react)](https://react.dev/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%20%2B%20PostGIS-336791.svg?logo=postgresql)](https://www.postgresql.org/)
[![LightGBM](https://img.shields.io/badge/ML-LightGBM%20%2B%20SHAP-blue.svg)](https://lightgbm.readthedocs.io/)
[![Vite](https://img.shields.io/badge/Build-Vite%206-646CFF.svg?logo=vite)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Styles-TailwindCSS%20v4-38B2AC.svg?logo=tailwind-css)](https://tailwindcss.com/)
[![Tests](https://img.shields.io/badge/Tests-44%2F44%20Passing-brightgreen.svg)]()

---

## 1. Project Overview

**PRAVAAH** (*Predictive Land Acquisition Intelligence & Early-Intervention Decision Support Platform*) is an enterprise-grade decision-support system built for infrastructure authorities, state revenue departments, and central ministries across India.

Large-scale national infrastructure projects (highways, dedicated freight corridors, high-speed rail, industrial corridors, renewable parks) frequently face substantial delays and cost overruns during the land acquisition phase under the **Right to Fair Compensation and Transparency in Land Acquisition, Rehabilitation and Resettlement Act (RFCTLARR), 2013**. 

PRAVAAH bridges the gap between field-level operational data and strategic risk management by implementing a continuous, intelligent loop:

$$\textbf{Predict} \longrightarrow \textbf{Explain} \longrightarrow \textbf{Prioritize} \longrightarrow \textbf{Intervene} \longrightarrow \textbf{Learn}$$

### Core Objectives
- **Fact-Based Ingestion**: Officers record observed ground facts (financial disbursements, title verification percentages, objection counts, court cases) rather than subjective risk guesses.
- **Dual-Horizon Prediction**: Uses gradient boosting to predict both the **probability of an impending stage delay (>30 days)** and the **estimated delay magnitude (in days)**.
- **Explainable AI (XAI)**: Demystifies predictions using **SHAP (SHapley Additive exPlanations)**, highlighting the exact top 6 factors driving delay risk up or down for every single project.
- **Prescriptive Interventions**: Automatically recommends tailored administrative, legal, and operational countermeasures mapped to detected risk drivers.
- **Geo-Spatial Tracking**: Leverages PostGIS and interactive GIS mapping to provide visual spatial intelligence and risk clustering across districts and states.
- **Decision-Support Guardrails**: PRAVAAH informs and empowers officers; it **never** automates legal determinations, compensation amounts, or eviction orders.

---

## 2. SIH26017 Problem Statement

- **Problem Statement ID**: `SIH26017`
- **Title**: *Predictive Analytics System for Early Detection of Land Acquisition Delays*
- **Theme**: Infrastructure & Smart Governance
- **Background**: Traditional project monitoring relies on lagging indicators (noting delays after milestones have already elapsed). Land acquisition involves complex inter-dependencies between social impact assessments, Section 11/19 notifications, Section 15 objection hearings, title dispute litigations, award inquiries, exchequer fund releases, and physical possession. A bottleneck in any single stream stalls subsequent phases.
- **The PRAVAAH Solution**: PRAVAAH converts multi-stream operational data into a 60-feature project state vector, enabling early detection of bottlenecks weeks before scheduled deadlines, allowing administrators to intervene proactively.

---

## 3. Key Features

### 🏛️ 1. Hierarchical Role-Based Access Control (RBAC)
Strict server-side security and geographic scoping enforced on every API route:
- **Central Officer**: Nationwide visibility across all states and districts; national KPIs, pan-India risk heatmaps, and inter-state comparisons.
- **State Officer**: Scoped to their assigned state; monitors all districts within that state, tracks state-level aggregate bottlenecks, and guides district collectors.
- **District Officer**: Scoped to their assigned district; creates and updates local projects, submits ground parameters, and resolves alerts.
- **Admin**: Manages officer user accounts, permissions, geographic boundaries, audit trails, and ML model governance.

### 🔄 2. Configurable 9-Stage Acquisition Lifecycle
Adapts to statutory acquisition workflows:
1. **Initial Assessment / SIA** (Social Impact Assessment & Feasibility)
2. **Notification** (Preliminary Notification - Section 11/4)
3. **Objection / Hearing** (Hearing of Objections - Section 15)
4. **Land & Ownership Verification** (Title Verification, Revenue Records & Mutation)
5. **Award / Valuation** (Determination of Land Value & Award Declaration - Section 23/31)
6. **Compensation Disbursement** (Direct Benefit Transfer to Affected Landowners)
7. **Rehabilitation & Resettlement (R&R)** (Infrastructural & Financial R&R Execution)
8. **Possession** (Taking Physical & Legal Possession - Section 38)
9. **Acquisition Completion** (Final Revenue Mutation & Handover to Executing Agency)

### 📊 3. Ten Parameter Intelligence Groups
Projects are quantified through 10 granular operational groups:
1. **Approvals & Clearances**: Environmental, Forest, Wildlife, Railway, Defense clearances.
2. **Legal & Litigation**: Pending high court/district court writ petitions, stay orders, injunctions.
3. **Compensation Financials**: Sanctioned compensation, disbursed amount, pending balance, beneficiary counts.
4. **Documentation**: Cadastral survey records, 7/12 & RTC extracts, encumbrance certificates.
5. **Notifications**: Publication in official gazettes, local newspapers, and gram panchayat notices.
6. **Land Ownership & Titling**: Disputed parcels, undisputed land share, title partition disputes.
7. **Rehabilitation & Resettlement (R&R)**: Resettlement packages sanctioned, housing units allotted, physical shifting progress.
8. **Physical Possession**: Demarcation, encumbrance-free area possessed, joint measurement surveys (JMS).
9. **Stakeholder & Public Sentiment**: Gram sabha consent percentages, pending public grievances.
10. **Inter-Departmental Coordination**: Joint site inspections completed, utility shifting approvals (water/power/gas).

### 🤖 4. Dual ML Prediction & Risk Engine
- **Classification Target (`next_stage_delayed_30d`)**: Evaluates if the upcoming stage transition will slip by $\ge 30$ days.
- **Regression Target (`next_stage_delay_days`)**: Forecasts the expected duration of delay in calendar days.
- **Four Risk Categories**:
  - 🟢 **LOW**: Delay Probability $< 25\%$
  - 🟡 **MEDIUM**: Delay Probability $25\% - 50\%$
  - 🟠 **HIGH**: Delay Probability $50\% - 75\%$
  - 🔴 **CRITICAL**: Delay Probability $\ge 75\%$

### 🔍 5. Explainable AI (SHAP) & Intervention Engine
- Computes local Shapley values using `shap.TreeExplainer`.
- Identifies the **Top 6 Contributing Factors** (positive contributors accelerating risk vs. negative factors cushioning risk).
- Maps high-risk drivers directly to actionable interventions (e.g., *"Fast-track special Lok Adalat for pending Section 15 title suits"*, *"Release second compensation tranche via DBT"*).

### 🗺️ 6. PostGIS Geo-Spatial Map & Risk Clustering
- PostGIS-backed geographic storage of project coordinates and district boundaries.
- Leaflet map featuring interactive color-coded risk markers, district polygon overlays, spatial clustering, and one-click drilldown into project dossiers.

### ⏱️ 7. Automated Project Lifecycle & Data Freshness
- **Automatic Completion**: Automatically transitions project state from `ONGOING` to `COMPLETED` when all 9 stage milestones and physical possession requirements reach 100%.
- **Data Freshness Tracker**: Continuously computes days since last parameter update, flagging stale records with low-confidence alerts.
- **Soft Deletion / Archival**: Allows project removal from active dashboards while maintaining full integrity for historical training logs.

### 📋 8. Audit Logs & Excel Bulk Ingestion
- **Immutable Audit Trail**: Append-only log recording every login, parameter revision, stage advancement, and user action.
- **Excel Batch Upload**: Client-side parsing using SheetJS (`xlsx`) for importing bulk legacy land acquisition rosters.

---

## 4. System Architecture

```mermaid
flowchart TB
    subgraph Client["Presentation Layer (Frontend)"]
        UI["React 19 + TypeScript + Vite"]
        TW["TailwindCSS v4 UI Theme"]
        MAP["Leaflet + PostGIS Geo Engine"]
        EXCEL["SheetJS (.xlsx) Importer"]
        CHARTS["Analytics & Risk Visualizations"]
    end

    subgraph API["Application Layer (FastAPI Backend)"]
        ROUTER["Async REST API (v1)"]
        AUTH["JWT (HS256) + Bcrypt Auth"]
        RBAC["Server-Side RBAC & Geo-Scope Enforcement"]
        AUTO["Lifecycle & Auto-Completion Engine"]
        AUDIT["Immutable Audit Logger"]
        ALERTS["Notification & Freshness Monitor"]
    end

    subgraph ML["Intelligence & Explainability Tier"]
        FEAT["60-Feature Engineering Pipeline"]
        LGB_CLS["LightGBM Delay Classifier (v1)"]
        LGB_REG["LightGBM Delay Regressor (v1)"]
        SHAP_EXP["SHAP TreeExplainer (Top 6 Factors)"]
        INTERV["Rules-Based Intervention Engine"]
    end

    subgraph Data["Persistence Layer"]
        PG[("PostgreSQL 15+ Database")]
        GIS[("PostGIS Spatial Extension")]
        MODELS[("Versioned ML Artifacts (.joblib)")]
    end

    UI -->|"HTTPS / REST"| ROUTER
    ROUTER --> AUTH
    ROUTER --> RBAC
    ROUTER --> AUTO
    ROUTER --> AUDIT
    ROUTER --> ALERTS

    ROUTER -->|"Feature Extraction"| FEAT
    FEAT --> LGB_CLS
    FEAT --> LGB_REG
    LGB_CLS --> SHAP_EXP
    SHAP_EXP --> INTERV

    ROUTER -->|"SQLAlchemy 2.0 Async / GeoAlchemy2"| PG
    PG --- GIS
    FEAT -.->|"Loads"| MODELS
```

---

## 5. Technology Stack

| Category | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Backend Framework** | **FastAPI** | `0.115.12` | High-performance asynchronous REST API backend |
| **ASGI Server** | **Uvicorn** | `0.34.3` | Async server implementation with uvloop |
| **Database ORM** | **SQLAlchemy** | `2.0.41` | Modern async ORM queries and session management |
| **Database Driver** | **asyncpg** | `0.31.0` | Ultra-fast asynchronous PostgreSQL client library |
| **Migrations** | **Alembic** | `1.16.1` | Automated database schema migrations |
| **Data Validation** | **Pydantic** | `2.11.4` | Strict request/response parsing and schema validation |
| **Authentication** | **python-jose** / **bcrypt** | `3.4.0` / `4.3.0` | JWT token issuance (HS256) and password hashing |
| **Frontend Framework** | **React** | `19.0.0` | Declarative UI rendering |
| **Language** | **TypeScript** | `5.7.2` | Type-safe frontend component development |
| **Build Tool** | **Vite** | `6.2.0` | High-speed frontend bundling and HMR dev server |
| **Styling** | **TailwindCSS** | `4.0.0` | Modern utility-first CSS framework |
| **Routing** | **React Router** | `7.3.0` | Client-side routing with guarded layout wrappers |
| **Spatial / GIS** | **Leaflet** / **React-Leaflet** | `1.9.4` | Interactive tile layers, markers, and vector overlays |
| **Data Ingestion** | **SheetJS (xlsx)** | `0.18.5` | Client-side spreadsheet parsing and data import |
| **Icons** | **Lucide React** | `0.477.0` | Consistent iconography |
| **Machine Learning** | **LightGBM** | `4.6.0` | Gradient boosted decision trees for classification/regression |
| **Explainable AI** | **SHAP** | `0.46.0` | Game-theoretic TreeExplainer for feature importance |
| **Data Science** | **Scikit-Learn** / **Pandas** / **NumPy** | `1.6.1` / `2.2.3` / `2.2.6` | Data wrangling, preprocessing, and serialization |
| **Spatial Database** | **PostgreSQL** + **PostGIS** | `15+` / `3+` | ACID database with native spatial geometry handling |
| **Testing** | **pytest** + **pytest-asyncio** + **httpx** | `8.3.5` | Comprehensive automated API and unit testing suite |

---

## 6. Machine Learning Approach

### 1. Feature Engineering (60 Features)
The system synthesizes raw parameters into an engineered 60-dimensional feature vector before scoring:
- **Financial Ratios**: $\text{Disbursed Ratio} = \frac{\text{Amount Disbursed}}{\text{Total Sanctioned Compensation}}$
- **Dispute Severity**: $\text{Litigation Density} = \frac{\text{Disputed Land Area}}{\text{Total Required Land Area}}$
- **R&R Execution Index**: Ratio of allotted housing units and released subsistence allowances to total affected families.
- **Clearance Latency**: Status and pending days across statutory clearance gates (Forest, Wildlife, Railway, MoEFCC).
- **Public Friction Factor**: Recorded objection counts under Section 15 and percentage of non-consenting landowners.
- **Stage Progression Velocity**: Elapsed days in current stage vs. average baseline days required for that milestone.

### 2. Dual-Model Architecture
```
Project State (10 Parameter Groups) 
       │
       ▼
Feature Vector Pipeline (60 Engineered Features)
       ├──► LightGBM Binary Classifier ──► Delay Probability (0.00 - 1.00) ──► Risk Level
       │
       ├──► LightGBM Regressor          ──► Expected Delay Duration (Days)
       │
       └──► SHAP TreeExplainer          ──► Top 6 Feature Attributions (± Impact)
                                                   │
                                                   ▼
                                        Prescriptive Interventions Engine
```

- **Classifier (`stage_delay_classifier_v1.joblib`)**: LightGBM binary classifier trained on stage-specific historical milestone outcomes to predict `next_stage_delayed_30d`.
- **Regressor (`delay_days_regressor_v1.joblib`)**: LightGBM regressor predicting continuous `next_stage_delay_days`.
- **Interpretability via SHAP**: For every inference, `shap.TreeExplainer` generates individual Shapley values for the 60 features. PRAVAAH sorts and extracts the **Top 6 high-impact factors** with directional impact (increasing risk or decreasing risk) and human-readable explanations.
- **Governance & Versioning**: Model weights, feature names, and performance metrics are tracked in `backend/models/metadata.json`. Retraining requires administrative sign-off; models do not perform unmonitored online updates.

---

## 7. Dataset Disclaimer

> [!IMPORTANT]
> **SYNTHETIC DATASET NOTICE (SIH PROTOTYPE ENVIRONMENT)**
> 
> All training and demonstration data supplied with this repository (`datasets/synthetic_projects.csv`, generated via `generate_dataset.cjs`) is **100% synthetic**.
> 
> - The dataset was programmatically generated using realistic statistical distributions, realistic administrative workflows, and statutory timelines defined in the **RFCTLARR Act, 2013**.
> - **It does NOT represent actual government records**, proprietary state revenue files, classified infrastructure blueprints, or personally identifiable citizen information (PII).
> - The synthetic dataset was crafted strictly to train, evaluate, and demonstrate the technical feasibility and accuracy of the PRAVAAH predictive engine during the Smart India Hackathon evaluation.
> - In a live production deployment, PRAVAAH connects directly to state digital land record portals (e.g., *Bhulekh*, *Bhoomi*, *AnyRoR*, *e-Dharti*) via secure internal state government APIs.

---

## 8. Setup Instructions

### Prerequisites
- **Python**: `3.12+`
- **Node.js**: `18.0.0+` & **npm**: `9.0.0+`
- **PostgreSQL**: `15+` with **PostGIS** extension installed

---

### Step 1: Database Setup
1. Start your local PostgreSQL server.
2. Create the database and enable the PostGIS extension:
```sql
CREATE DATABASE pravaah;
\c pravaah;
CREATE EXTENSION IF NOT EXISTS postgis;
```

---

### Step 2: Backend Configuration & Startup

1. Open a terminal and navigate to `backend/`:
   ```powershell
   cd backend
   ```

2. Create and activate a Python virtual environment:
   ```powershell
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On Linux/macOS:
   source venv/bin/activate
   ```

3. Install required Python packages:
   ```powershell
   pip install -r requirements.txt
   ```

4. Configure environment variables:
   Copy `.env.example` to `.env` in the root or `backend/` directory and configure your PostgreSQL credentials:
   ```env
   DATABASE_URL=postgresql+asyncpg://postgres:your_password@localhost:5432/pravaah
   JWT_SECRET_KEY=super-secret-key-at-least-32-chars-long-pravaah-2026
   JWT_ALGORITHM=HS256
   JWT_ACCESS_TOKEN_EXPIRE_MINUTES=480
   APP_NAME=Pravaah
   APP_VERSION=1.0.0
   DEBUG=true
   CORS_ORIGINS=http://localhost:5173
   ADMIN_EMAIL=admin@pravaah.gov.in
   ADMIN_PASSWORD=Pravaah@2026
   ```

5. Start the FastAPI backend server (automatic table creation and data seeding will execute on startup):
   ```powershell
   python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
   ```
   *Backend interactive OpenAPI documentation will be accessible at `http://127.0.0.1:8000/docs`.*

---

### Step 3: Frontend Setup & Startup

1. Open a new terminal and navigate to `frontend/`:
   ```powershell
   cd frontend
   ```

2. Install dependencies:
   ```powershell
   npm install
   ```

3. Launch the Vite development server:
   ```powershell
   npm run dev
   ```
   *The application interface will open at `http://localhost:5173`.*

---

### Step 4: Default Demo Accounts

The database seeds automatically with pre-configured accounts representing every tier of governance:

| Role | Email Address | Password | Geographic Jurisdiction |
| :--- | :--- | :--- | :--- |
| **System Administrator** | `admin@pravaah.gov.in` | `Pravaah@2026` | Full System & Governance Scope |
| **Central Officer** | `central@pravaah.gov.in` | `Pravaah@2026` | Pan-India (All States & Districts) |
| **State Officer** | `state.mh@pravaah.gov.in` | `Pravaah@2026` | Maharashtra State Jurisdiction |
| **District Officer** | `district.pune@pravaah.gov.in` | `Pravaah@2026` | Pune District Jurisdiction |

---

### Step 5: Running the Test Suite

PRAVAAH includes comprehensive automated tests verifying JWT authentication, server-side RBAC scoping, prediction accuracy, SHAP factor generation, and automatic project completion:

```powershell
cd backend
.\venv\Scripts\python.exe -m pytest tests\ -v
```
*Expected Result: `44 passed in ~4.5s`.*

---

## 9. Project Structure

```text
LandSight/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── v1/
│   │   │       ├── admin.py            # Officer account & permission management
│   │   │       ├── analytics.py        # Aggregated state/district metrics & KPIs
│   │   │       ├── auth.py             # Login & JWT token distribution
│   │   │       ├── dashboard.py        # Role-scoped operational project rollups
│   │   │       ├── gis.py              # Spatial coordinates, polygons & risk heatmap
│   │   │       ├── models.py           # ML governance & performance metadata
│   │   │       ├── notifications.py    # Alert triage & freshness notifications
│   │   │       └── projects.py         # 10-parameter project creation, updates & lifecycle
│   │   ├── core/
│   │   │   ├── config.py           # Pydantic v2 application settings
│   │   │   ├── dependencies.py     # Auth dependencies & RBAC permission guards
│   │   │   └── security.py         # Bcrypt password hashing & JWT handling
│   │   ├── db/
│   │   │   ├── session.py          # Async engine & session factory
│   │   │   └── seed.py             # Automated idempotent database seeding
│   │   ├── ml/
│   │   │   └── prediction_service.py # Feature pipeline, LightGBM inference & SHAP
│   │   ├── models/                 # SQLAlchemy 2.0 ORM models
│   │   │   ├── audit.py            # Immutable audit log
│   │   │   ├── geography.py        # State & District spatial models
│   │   │   ├── notification.py     # High-risk & stale alerts
│   │   │   ├── project.py          # Project entity, parameters & lifecycle state
│   │   │   ├── stage.py            # 9-stage sequence definitions
│   │   │   └── user.py             # User accounts & RBAC roles
│   │   ├── schemas/                # Pydantic validation schemas
│   │   └── services/               # Alert generation & notification services
│   ├── models/                     # Versioned LightGBM binaries & metadata
│   │   ├── metadata.json           # Model evaluation metrics & feature list
│   │   ├── stage_delay_classifier_v1.joblib
│   │   └── delay_days_regressor_v1.joblib
│   ├── tests/                      # Automated test suite (44 unit/integration tests)
│   ├── requirements.txt            # Python dependencies
│   └── .env.example                # Configuration template
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AppLayout.tsx       # Navigation bar, role badges & layout wrapper
│   │   │   └── ProtectedRoute.tsx  # Route guards for authentication and roles
│   │   ├── context/
│   │   │   └── AuthContext.tsx     # Reactive auth state & local token cache
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx       # Secure official credentials login
│   │   │   ├── DashboardPage.tsx   # Role-customized high-level metrics & project lists
│   │   │   ├── ProjectsPage.tsx    # Filterable project catalog & status badges
│   │   │   ├── ProjectDetailPage.tsx # 360-degree dossier, SHAP graphs & interventions
│   │   │   ├── AddProjectPage.tsx  # 10-parameter ingestion wizard & Excel importer
│   │   │   ├── AnalyticsPage.tsx   # Trend analysis, delays by stage & district charts
│   │   │   ├── GisMapPage.tsx      # Leaflet spatial map & risk heatmap overlay
│   │   │   ├── NotificationsPage.tsx # Prioritized alert center
│   │   │   ├── AuditLogsPage.tsx   # System-wide immutable activity trail
│   │   │   └── AdminUsersPage.tsx  # User provisioning & permission control
│   │   ├── services/
│   │   │   └── api.ts              # Axios HTTP client with JWT interceptors
│   │   ├── types/
│   │   │   └── index.ts            # Full TypeScript interface definitions
│   │   ├── App.tsx                 # React Router v7 application root
│   │   └── main.tsx                # React DOM entrypoint
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
├── datasets/
│   └── synthetic_projects.csv      # Synthetic historical dataset for ML training
├── docs/                           # PRD, Architecture, Data Dictionary & ML Specs
├── generate_dataset.cjs            # Node.js synthetic data generator
└── README.md                       # Master Documentation
```

---

## 10. Limitations & Future Roadmap

1. **Probability Calibration in Small Samples**: While probability calibration (isotonic regression / Platt scaling) is architected into the pipeline, raw LightGBM tree probabilities are used by default to prevent degeneracies when operating on small stage-specific training batches.
2. **Synthetic Data vs. Real-World Integration**: The current prototype demonstrates the full end-to-end ML lifecycle on synthetic data modeled after the RFCTLARR Act (2013). Live production deployment will require connecting to state land registries and district collectorate databases to ingest live historical awards.
3. **In-App Alerts vs. External SMS/Email Gateways**: Per the hackathon prototype scope, notifications are maintained and delivered through an in-app alert center rather than external telecommunication channels (NIC SMS Gateway / CDAC Kavach).
4. **Local Hardware Execution**: Per PRD design guidelines, PRAVAAH runs on local Python/Node/PostgreSQL infrastructure and does not depend on cloud services or external microservice meshes.
5. **Frontend Asset Optimization**: The production bundle includes comprehensive GIS and charting libraries (Leaflet, Plotly/Chart engines). Advanced route-level code splitting and dynamic bundle chunks are designated for subsequent release iterations.

---

## 11. Contributors & Acknowledgments

- **Team**: Developed for **Smart India Hackathon 2024**
- **Problem Statement**: **SIH26017**
- **Mentorship & Guidance**: Dedicated to modernizing India's public infrastructure delivery and establishing transparency, fairness, and speed in land acquisition governance.
