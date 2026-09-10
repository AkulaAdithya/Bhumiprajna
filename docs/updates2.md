Please implement the following 5 changes in the existing project. First inspect the existing code, architecture, database model, API routes, and frontend components. Do not rebuild or unnecessarily modify existing functionality.

1. Fix Admin Remove Project
The Remove Project option must be available only to Admin.
Currently, clicking Remove Project gives 405 Method Not Allowed. Find the actual frontend/backend route or HTTP-method mismatch and fix it.
Removing a project must remove it from the active system for every role, not just from the Admin's screen.
After removal, the project must disappear from:
Central Officer dashboard
State Officer dashboard
District Officer dashboard
Existing Projects
Active GIS markers
GIS heatmap data where applicable
Active notifications/alerts
Active project API queries
The removal must be backend-enforced, not just hidden using frontend filtering.
Preserve the project's historical/audit information so that auditability is not lost.
2. Remove Demo Accounts From Login Page

Remove all demo-account credentials from the login page.

Remove:

Demo email addresses
Demo passwords
Demo account cards
Credential hints
Autofill/example credentials
Any text exposing prototype login credentials

The login page should only have the normal:

Email / Officer ID
Password
Login button
Required authentication UI

Do not break authentication or RBAC. Backend test/demo accounts may remain if required internally, but their credentials must not be exposed in the frontend/login page.

3. Automatically Complete Projects

A project must automatically change from ONGOING → COMPLETED when all required land-acquisition parameters/milestones are completed, according to the existing canonical data model.

Do not require the officer to manually mark it as completed.
Do not invent a new completion definition.
Use the existing canonical completion logic/data model.
The automatic completion must be enforced by the backend.

Once completed, the project must automatically disappear from:

Active dashboards
Existing Projects
Active GIS markers
Active GIS heatmap
Active alerts/notifications
Active project queries

However, do not delete the project from the database.

Keep:

Historical project record
Project snapshots
Predictions
Audit history
Data needed for historical analytics and future ML training
4. Make GIS Heatmap Darker

The current GIS heatmap is too faint and difficult to see.

Make the heatmap noticeably darker and more visible, especially for high-risk areas.

You may adjust appropriate visualization settings such as:

Intensity
Opacity
Radius
Blur
Gradient/threshold visibility

Do not change the underlying risk calculations.

Preserve:

Risk meaning
Geographic scope
Risk categories
Geographic accuracy
Map usability
5. Clean Up Dashboard Header

Remove the following from the Dashboard page header:

Search

Remove the entire search bar, including:

Search input
Search icon
Placeholder text
Ctrl K shortcut indicator

Do not leave a large empty space where it was.

Profile

Remove the Dashboard header:

Profile/avatar icon
User name
User designation
Profile dropdown/chevron

Do not break authentication, RBAC, or Sign Out functionality elsewhere.

Notifications

Remove the Dashboard header:

Notification bell
Notification count/badge
Header notification control

Do not unnecessarily remove the underlying notification backend/system.

Tricolor

Also remove the thin Indian tricolor strip at the very top of the Dashboard.

Do not replace it with another decorative strip.

Final Verification

After implementing everything:

Run the complete backend tests.
Run the frontend TypeScript check.
Run the frontend production build.
Test Admin project removal and confirm it no longer returns 405.
Confirm a removed project disappears from every role's active views.
Test automatic completion using a project where all required parameters are completed.
Confirm the completed project remains in the database/history.
Confirm login page contains zero demo credentials.
Confirm Dashboard search/profile/notification controls are gone.
Confirm the tricolor strip is gone.
Visually verify that the GIS heatmap is substantially darker and clearly visible.
Fix any failures before declaring the work complete.

Do not modify unrelated functionality. Do not move to unrelated tasks.