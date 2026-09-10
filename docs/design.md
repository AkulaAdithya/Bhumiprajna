# UI/UX Design
## Predictive Land Acquisition Intelligence & Early-Intervention Decision Support Platform

### 1. Design Goal
The interface should make a complex acquisition project understandable in seconds:
**Status → Risk → Why → What next → Evidence/history**

The design must feel like a government decision-support dashboard rather than a generic analytics demo.

### 2. Visual Principles
- Professional, restrained government/enterprise aesthetic.
- Clear hierarchy.
- High information density without visual clutter.
- Strong typography and readable tables.
- Consistent risk language.
- Accessible contrast.
- Responsive desktop-first layout.
- Use color as a supplement, not the only risk signal.

Risk categories:
- Low
- Medium
- High
- Critical

Always pair color with text/icon/label.

### 3. Main Navigation
Recommended sidebar:
- Dashboard
- Existing Projects
- GIS Map
- Analytics
- Notifications
- Audit / History where permitted
- Admin where permitted
- Profile / Logout

Navigation visibility may vary by role, but backend authorization remains authoritative.

### 4. Landing Page
Minimal:
- Project/system title.
- One-line purpose.
- Short explanation of predictive early intervention.
- Login button at top right.

Avoid unnecessary marketing sections.

### 5. Login
- Official email/Officer ID.
- Password.
- Login action.
- Clear error state.
- No role selector.
- No public sign-up.

After login, route to the correct role-scoped dashboard.

### 6. Dashboard Layout
Suggested hierarchy:

```text
Header
 ├── Role / scope
 ├── Notifications
 └── User menu

Main
 ├── KPI row
 │    ├── Total ongoing
 │    ├── Critical
 │    ├── High
 │    ├── Medium
 │    └── Low
 │
 ├── High-risk projects
 │
 ├── Risk trend / stage trend
 │
 ├── GIS risk overview
 │
 └── Data health / freshness
```

Dashboard should prioritize projects requiring attention, not merely display statistics.

### 7. Add Project
Use a guided form rather than one overwhelming screen.

Sections:
1. Project details.
2. Current stage/status.
3. Administrative approvals.
4. Legal disputes.
5. Compensation.
6. Documentation.
7. Notifications.
8. Ownership conflicts.
9. R&R.
10. Possession.
11. Stakeholder responsiveness.
12. Inter-department coordination.
13. Review & submit.

The form should clearly say:
**Enter observed records/progress. The system calculates risk.**

Validation:
- Required fields.
- Numeric bounds.
- Date consistency.
- Cross-field consistency.
- Clear inline errors.

### 8. Prediction Result
After save/update, show a prominent prediction panel:

```text
NEXT STAGE RISK
81% probability of >30-day delay

Risk: HIGH
Next stage: Possession
Expected delay: 35–55 days
Confidence: High
Data freshness: 4 days old
```

Then:
- Top contributing factors.
- Recommended actions.
- What changed since previous update.

Never present confidence as model certainty.

### 9. Risk Explanation
Use a horizontal contribution list or bar visualization.

Example:
```text
Top contributors
1. Pending legal disputes       +++
2. Compensation progress       ++
3. Approval pending             ++
4. Documentation backlog        +
```

Explain that these are model-associated contributors, not proven causal effects.

### 10. Project Details
Recommended sections:
- Project header.
- Risk summary.
- Stage/progress timeline.
- Parameter cards.
- Risk contributors.
- Recommendations.
- Update history.
- Audit information.
- Map location.

Use collapsible parameter sections to avoid overwhelming the user.

### 11. Existing Projects
Table/list columns:
- Project.
- State/District.
- Current stage.
- Progress.
- Risk.
- Predicted delay.
- Last updated.
- Data freshness.

Filters:
- State.
- District.
- Project type.
- Stage.
- Risk.
- Status.

Default to ongoing projects.

### 12. Update Project
Show current values beside new values where useful.

Example:
```text
Compensation paid
Previous: ₹10 Cr
New:      ₹18 Cr

Compensation progress
Previous: 25%
New:      45%

Risk
Previous: HIGH
New:      MEDIUM
```

This makes the predictive loop visible.

### 13. GIS Map
Map page:
- Full map canvas.
- Scope indicator.
- Risk filters.
- Stage filters.
- Project search.
- Legend.
- Optional heatmap toggle.

Marker click:
**Open the same Project Details view**, not a separate duplicated information model.

### 14. Analytics
Use Plotly for:
- Risk trends.
- Stage distributions.
- District/state comparisons.
- Delay distributions.
- Parameter contribution summaries.
- Timeline charts.

Every chart should have:
- Clear title.
- Units.
- Time period.
- Scope.
- Empty-state handling.

### 15. Notifications
Notification center:
- Severity.
- Project.
- Trigger.
- Timestamp.
- Read/unread state.

Example:
**High-risk transition — Project X**
Risk changed from Medium to High after the latest update.

Avoid notification spam.

### 16. Data Health
Make data quality visible:
- Last updated.
- Days since update.
- Missing critical fields.
- Stale indicator.
- Prediction confidence qualifier.

A high risk based on stale data should not visually look identical to a high risk based on fresh, complete data.

### 17. Audit UI
Where permitted:
- Actor.
- Timestamp.
- Action.
- Changed fields.
- Before/after values.

Use a timeline/table format.

### 18. Admin UI
Admin can:
- Create officer.
- Assign role.
- Assign state/district scope.
- Activate/deactivate account.
- Review audit events.

Do not expose admin functions to ordinary officers.

### 19. Responsive Behavior
Desktop is the primary target.

At narrower widths:
- Sidebar can collapse.
- KPI cards wrap.
- Tables become horizontally scrollable or switch to cards.
- Forms become single-column.
- Map controls remain accessible.

### 20. Empty / Loading / Error States
Every major component needs:
- Loading state.
- Empty state.
- Error state.
- Retry action where appropriate.

Never display fabricated values merely to fill an empty dashboard.

### 21. Design System
Create reusable tokens/components for:
- Typography.
- Spacing.
- Cards.
- Buttons.
- Inputs.
- Tables.
- Badges.
- Alerts.
- Modals.
- Tooltips.
- Charts.
- Timeline.
- Map controls.

Maintain consistent component behavior across Dashboard, Projects and GIS.

### 22. Key UX Rule
The interface should repeatedly reinforce:

**Observed project data → prediction → explanation → intervention → updated observation → new prediction**

That is the product's central experience.
