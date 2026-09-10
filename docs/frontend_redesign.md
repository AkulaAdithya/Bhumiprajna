## UI Visual References

The images in `docs/ui-reference/` are the APPROVED visual references
for the Pravaah frontend redesign.

- `landing-page-reference.png` — Landing page visual reference
- `login-page-reference.png` — Officer login visual reference
- `dashboard-reference.png` — Authenticated dashboard visual reference

These references define the intended:
- Color palette
- Typography
- Spacing
- Card styling
- Navigation
- Buttons
- Forms
- Visual hierarchy
- Overall product appearance

All other application pages must follow the same design language while
adapting their layouts to their specific functionality.

The reference images are design references only. DO NOT copy their
sample data, numbers, project names, dates, statistics or other content
into the application.

## Admin Project Removal

Add a project removal option to the Existing Projects / Project Details
interface.

IMPORTANT:
- ONLY the Admin role may remove a project.
- Normal officers must not see or use the removal action.
- Enforce the permission in the BACKEND as well as the frontend.
- Require a confirmation before removing a project.
- Clearly identify the project being removed in the confirmation.
- Preserve audit/history information.
- Prefer the existing soft-delete/archive mechanism if one exists.
- Do not unnecessarily delete historical snapshots, predictions or audit
  records.

## Strict Change Boundary

This redesign must NOT disturb the existing application.

ONLY perform the changes explicitly described in this document:
1. Apply the approved visual design to the frontend.
2. Add Admin-only project removal.

DO NOT:
- Rewrite the architecture.
- Change the backend unnecessarily.
- Change the database unnecessarily.
- Change the ML/LightGBM/SHAP pipeline.
- Change prediction calculations.
- Change existing APIs unnecessarily.
- Change RBAC except for the required Admin-only project removal permission.
- Remove or modify existing features.
- Change GIS functionality.
- Change Analytics functionality.
- Change Notifications.
- Change Audit Trail functionality except for recording project removal.
- Change project data.
- Change existing workflows unnecessarily.
- Add unrelated features.
- Replace working components unnecessarily.

Preserve all existing functionality, data, routes, APIs and behavior.

If an existing component already provides the required functionality,
modify/reuse it rather than creating a parallel implementation.

Before making changes, inspect the existing implementation and identify
the minimum files/components that need modification.

Do not perform destructive operations without explicit approval.