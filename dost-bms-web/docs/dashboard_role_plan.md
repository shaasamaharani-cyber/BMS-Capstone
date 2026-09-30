# BMS front end - decisions and dashboard plan (Team T214)

Last updated: 30 Sep 2026. Status: working notes for the team, not yet confirmed by DOST unless stated.

## 1. What has been built

| Area | Where | Status |
|---|---|---|
| Unified Budget Request wizard (5 steps) | `src/pages/unified_request/`, `src/bp_forms/`, `src/utils/unified_request_checks.js` | Built and tested |
| "+ New Request" opens the wizard (classic button removed) | `src/pages/budget_requests/budget_requests_page.jsx` | Done. The classic page and route still exist in the code, unlinked |
| Requester dashboard (slice 1) | `src/pages/dashboard/requester_dashboard.jsx` | Built and tested |
| Requester dashboard scoped to own unit on the server | `mock/server/routes/dashboard.mjs` | Done. Restart the dev server to load it |
| "Save as draft" on every step (saved on the server, listed under Budget Requests, reopens in the wizard at the same step) | `src/pages/unified_request/unified_request_page.jsx`, route `/budget-requests/unified/:id` | Built and tested |
| Returned requests are fixed and resubmitted inside the wizard (forms and signed copies come back) | same | Built and tested |
| Leaving with unsaved changes asks: Stay / Leave without saving / Save as draft and leave | same | Built and tested |

## 2. Design rules we follow

- Keep the original Team 27 look: same shell, Inter font, design tokens (`src/styles/tokens.css`), UI components (`src/components/ui`), section titles in the original bold uppercase style, "Back" button plus title on form pages, `dashboard-panel` cards on dashboards.
- Each role gets the dashboard that answers its own question. Data scope follows the role: requesters see their own unit only.
- Keep a number's meaning identical across roles.
- The technical administrator sees no financial amounts (least privilege).
- Requesters see their own unit's spending, not other units'.
- **Cost structure is a fixed list** (General Administration and Support, Support to Operations, Operations), not free text. The original system validates it against that list ("Please select a valid Cost Structure"), and consolidation and the BP forms group by it. Free text goes in the item name and justification. If DOST ever adds a classification, it is added to the list in `src/utils/cost_structure.js`, not typed per line.
- A request created in the wizard is edited in the wizard (drafts and returned requests). Older requests still use the classic edit page.
- Only draft and returned requests can be edited; submitted ones open read-only.

## 3. Dashboard plan by role

Legend: `*` = shown first, `o` = shown further down, `-` = not shown.

| Widget | Requester | Budget officer | Finance director | Planning director | Main admin | Tech admin |
|---|---|---|---|---|---|---|
| My requests and action needed | * | - | - | - | - | - |
| Review queue with age | - | * | - | - | o | - |
| Consolidation readiness by unit | - | * | o | o | o | - |
| Approvals waiting for me | - | - | * | * | o | - |
| Legislative tracker (DBM, Congress, Senate) | o (own request) | * | * | * | * | - |
| Execution rates (obligation, disbursement, absorption) | * (own unit) | o | * | o | * | - |
| Attention list | * (own unit) | * | * | o | * | - |
| Unobligated balances and deadlines | o (own unit) | o | * | - | o | - |
| Physical vs financial (needs confirming, no data exists yet) | o (own unit) | - | o | * | o | - |
| Pillar / 6Ps / R&D breakdown | - | - | o | * | o | - |
| Year-end projection and funding gap (mock in Phase 1) | - | - | * | o | o | - |
| Next-cycle reference (Phase 2) | - | - | o | * | o | - |
| Reports and export | o | * | * | * | * | - |
| System panel (cycle forms, users, activity log) | - | - | - | - | * | * |

Finance and Planning directors share one layout with a different order (money first vs performance first).

## 4. Open decisions and questions for DOST

1. Who may create a budget request? Recommended: requesters only, everyone else read-only. The original code is inconsistent (server: requester only; browser: reviewers and directors too; the create endpoint checks no role).
2. Does anyone in the Central Office budget team both prepare Central Office's request and review others'? (Would need two accounts.)
3. The monitoring page DOST asked for: submit actual spending, validate against the approved budget, justification when it does not match. Not built. Requesters would enter the data.
4. Physical vs financial: only in the original brief, and the code has no physical data. Confirm with DOST before building.
5. Utilisation targets. The colour bands (green 90+, amber 75-89, red below 75) come from Team 27's dashboard, not from DOST.
6. How can actual spending exceed an allocation (realignment, augmentation, extra releases)? It decides the wording of projection alerts.
7. What does TAG mean? It is currently mapped to BP Form 207 as an assumption.
8. Where does actual spending data come from and how often? What reports are printed for hearings?

## 5. Next steps (agreed order)

1. Requester slice 2: the monitoring page (record spending against the approved budget) once DOST confirms item 3.
2. Show the generated BP forms on the reviewer's and director's pages.
3. Restrict request creation to requesters (item 1).
4. Budget officer dashboard, then directors, then admins, one role at a time.
5. Laravel: repeat every validation and scoping rule on the server. The browser and this mock are not trusted.

## 6. Running it

```
cd C:\Users\Grakenzo\bms-t214\dost-bms-web
npm.cmd run dev:mock
```

Open http://localhost:5173. Test accounts (password `Test12345`): `requester.ncr@dost.gov.ph`, `requester.co@dost.gov.ph`, `requester.car@dost.gov.ph`, `tech.staff@dost.gov.ph`, `finance.director@dost.gov.ph`, `planning.director@dost.gov.ph`, `main.admin@dost.gov.ph`, `tech.admin@dost.gov.ph`.
Use `npm.cmd` in PowerShell (script execution is disabled). Restart the server after changing anything under `mock/`.
