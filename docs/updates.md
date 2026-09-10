PRAVAAH — FINAL REDESIGN + BUG FIX PROMPT

Project is already-working. DO NOT restart, rewrite, or redesign the architecture. First inspect the existing frontend, backend, DB, ML pipeline, RBAC, Add/Update Project workflows, Admin panel and docs/phases.md. Identify what already works, then modify only what is necessary.

1. GOVERNMENT-STYLE UI
- Replace the current very dark theme with a professional Government of India-style administrative portal.
- Use light/white backgrounds, restrained navy/blue/green accents, formal typography, clean borders, structured cards/tables and professional spacing.
- Avoid flashy gradients, excessive animations and SaaS/startup styling.
- Preserve ALL existing pages, navigation, features, APIs, ML, GIS, analytics, notifications, audit, RBAC and database functionality.

2. PROJECT REPORT UPLOAD
Redesign Add Project so officers can upload the available project report directly as Excel (.xlsx/.xls) or PDF instead of manually entering every parameter.

Extract/map available information for:
- Project details
- Approvals
- Legal disputes
- Compensation
- Documentation
- Notifications
- Ownership conflicts
- R&R
- Possession
- Stakeholder responsiveness
- Inter-department coordination
- Other required current-state information

Workflow:
UPLOAD → EXTRACT → VALIDATE/REVIEW → CORRECT → SAVE → EXISTING ML PREDICTION

Requirements:
- Never invent missing data.
- Clearly show extracted, missing, ambiguous and invalid fields.
- Provide Review & Validate before saving.
- Allow corrections.
- Keep manual editing as fallback.
- Preserve report/source metadata and auditability where appropriate.
- Use only information available up to the report date.
- Do not retrain the model during upload.

3. FIX UPDATE DATA BUG
Currently Existing Project → “Update Data” incorrectly returns to Home.

Diagnose and fix the ROOT CAUSE in routing/project-ID/state/API handling.

Expected:
Existing Project → Update Data → Correct project update interface → Upload latest Excel/PDF OR edit data → Review/Validate → Save new snapshot → Re-predict → Updated Project Details.

Requirements:
- Preserve project ID/context.
- Do not redirect to Home unexpectedly.
- Do not overwrite historical snapshots.
- Create a new project-state snapshot.
- Re-run the EXISTING trained ML model.
- Update risk probability, expected delay, risk drivers and recommendations.
- Preserve History and Audit Logs.
- Trigger existing notification logic when applicable.
- Preserve RBAC/scope enforcement.
- Show API/validation errors instead of silently navigating away.

4. REMOVE MODEL VERSION FROM VISIBLE DASHBOARD
Remove visible “Model: v1.0.0” from the officer-facing Existing Project dashboard.
Keep model-version tracking internally in backend/database/audit/model management for traceability.

5. IMPROVE RISK EXPLANATION
Redesign the prediction section so an officer immediately understands:

PROJECT STATUS → OVERALL RISK → WHY → WHAT TO DO → CURRENT PROGRESS → HISTORY/EVIDENCE

Show:
- Low/Medium/High/Critical risk category
- Overall delay probability
- Expected delay
- Clear plain-language meaning of the risk category
- Top risk drivers using existing SHAP/model output
- Explain why each major factor increases/reduces risk
- Actionable, project-specific recommendations based on actual risk drivers

Examples:
pending approvals → follow-up/escalation
compensation bottleneck → prioritize pending compensation
legal disputes → prioritize unresolved cases
documentation gaps → complete/verify documentation
ownership conflicts → prioritize verification
R&R bottleneck → address pending cases
stakeholder delays → follow up on pending responses
coordination delays → escalate long-pending requests

Never fabricate facts or recommendations.

6. CURRENT PROGRESS
Keep existing progress for approvals, compensation, documentation, notifications, R&R and possession.

Clearly label these as CURRENT PROGRESS/COMPLETION, NOT delay probability.

Do NOT add parameter-wise or stage-wise delay probabilities. The system should retain the OVERALL project delay probability only.

7. CONFIDENCE
Inspect the current “80% Confidence” implementation before changing it.
Determine what it actually represents.
Do not present a heuristic/data-quality value as statistically validated model confidence. Rename/relabel it accurately if necessary. Keep data freshness visible.

8. SIH26017 ALIGNMENT
Ensure the UI clearly communicates:
- Early delay detection
- Project-wise risk scoring
- Overall delay probability
- Risk categorization
- Key delay factors
- Explainable AI
- Corrective/intervention recommendations
- Timeline/KPI information
- Historical information
- Existing GIS, alerts and analytics

Communicate the core loop:
PREDICT → EXPLAIN → PRIORITIZE → INTERVENE → LEARN

9. CRITICAL CONSTRAINTS
- Preserve existing LightGBM/SHAP pipeline and trained models.
- Preserve DB data/schema unless genuinely necessary.
- Preserve APIs, RBAC, GIS, analytics, notifications, audit and lifecycle.
- No Docker/deployment/cloud work.
- No fabricated data/predictions/confidence.
- No unsupported stage/parameter risk probabilities.
- Ask before destructive operations.
- Fix root causes, not workarounds.
- Test after every major change.

10. FINAL VERIFICATION
Verify:
- Login/RBAC
- Existing Project prediction/explanation
- Progress + History
- Add Project → Excel upload → Review → Save → Predict
- Add Project → PDF upload → Review → Save → Predict
- Existing Project → Update Data → new snapshot → Re-predict → updated details
- GIS
- Analytics
- Notifications
- Audit logs
- Backend tests
- Frontend build
- No existing functionality/regressions

Before implementation, briefly inspect and report what already exists and what needs changing. Then implement only the required changes and provide a concise final summary of changes, tests and remaining limitations.