# FY2027 BP workflow implementation review

> Updated implementation: see [the workbook implementation and verification report](bp_forms_excel_implementation.md). The earlier missing-BP-A-PDF gate and implementation counts below describe the historical audit state.

Branch: `feature/fy2027-bp-forms-audit`, created from freshly fetched `origin/main` (`c6d44ae`). No push or merge is authorised or performed.

This review records the initial feature implementation. The later [correction review](bp_forms_corrections_review.md) supersedes its administrator-editor instructions, Form A performance-field requirement, Form B columns and final test count.

The [compliance audit](bp_forms_compliance_audit.md) contains the per-form findings, official references, implemented-field inventory and DOST questions. This change improves the existing Team 27 workflow; it does not certify the whole BP set as DBM-compliant.

## Changes and bugs fixed

- One shared questionnaire supplies administrator conditions and requester Step 2, including exactly matching funding choices. Stable question IDs and answer values support ALL/ANY. Old numeric, comparison and aggregate foreign-funding conditions still work. The editor explains saved legacy rules without exposing a new technical expression builder.
- Required forms update from answers, actual budget totals and enabled fiscal-year configuration. Explanation text includes matched question/answer. Disabled and paused forms do not become required. BP201-C uses real financial expense entries; BP207 uses explicitly tagged MOOE/CO, never old TAG; duplicate climate rule IDs are removed. BP300 also covers retention.
- Mandatory removals require explicit administrator permission and a reason. Overrides are recorded with the request/version and token-backed activity records. Inactive-form values and signed files stay in drafts; a warning precedes an answer change that removes a populated form from the required list.
- New monetary data supports PS, MOOE, FINEX and CO. Climate expenditure is an included subset. Shared calculations reconcile request, version, consolidation and dashboard class totals. Original TAG rows, IDs and amounts remain untouched. New FinEx reference rows are added idempotently; there is no historical TAG migration.
- BP202 adds ranking, category/ICT/PIP, project-cost/revised-date capture and year/tier/class funding rows. Current-year funding rows must reconcile with expenditure classes. BP204 supports multiple positions, separate salary grade/rate, compensation components and calculated costs. B/C/D and the BP201 summary now have structured institution working schedules. BP207 reuses item typologies and requires the CCC-approved QAR annex file when applicable.
- Unavailable historical values remain blank in the unified workflow; a confirmed zero is distinct. OU, implementing agency, appropriation source and PREXC metadata are entered once and reused. No government codes or entitlement rates are invented.
- The API enforces requester/unit creation and edit policy, stored item ownership, valid amounts, allowed status transitions, built-in/configured fields, relevant question answers and actual uploaded files. Submitted requests are locked and repeated submission is rejected. Payload actor IDs, primary keys, totals and status fields cannot impersonate a submitter or change a draft's status. Review/consolidation read access follows the existing reviewer/executive role policy.
- Header/item replacement is transactional in SQLite. Saving no longer requires a sequence of client-side item additions/deletions. Partial draft rows survive reopening, and existing-item updates/deletions recalculate the stored request total. The legacy `/budget-requests/new` URL leads into the five-step wizard; older saved classic requests and the Forms module remain readable/editable through their existing paths.
- Submitted versions capture definitions, catalogue metadata, common values, line items, answers, totals, overrides and signed/supporting attachment identities. Review and consolidation do not rewrite the source version. Consolidated versions retain references and copies of the exact source institution forms. Signatures bind to rendered content and definitions, and old metadata cannot be forged to refresh an existing signed file.
- Printable views and snapshot PDFs explicitly identify themselves as internal working schedules in pesos. Structured rows and generated line tables are retained in submitted display/PDF output. The signed upload remains the approved official form supplied by the institution.

## Validation

Run from `dost-bms-web`:

```powershell
npm.cmd test
npm.cmd run test:budget-cycles
npm.cmd run build
npm.cmd run lint
```

`npm test` runs all Node tests, including the existing Vite/React/JSDOM integration test. Coverage includes all default proposal triggers, shared administrator options, Tier/Yes-No/ALL/ANY changes, legacy conditions, custom fields, per-year settings, disabled forms, mandate overrides, required default fields and supporting documents, draft persistence, old TAG preservation, FinEx/climate totals, invalid amounts/ownership/actions, signed-content changes, version preservation, consolidation and SQLite upgrades/rollback.

Final integration run: **45 tests passed, zero failed; production build passed; lint passed with zero errors and the same 15 baseline warnings; git diff whitespace check passed.** Lint already had 15 warnings on the baseline (unused props and React refresh exports). The production build already reports a large bundle warning; this work does not change the build architecture.

## Manual workflow test

Use local mock data only. Do not reset an existing SQLite database containing work you want to preserve. Restart the mock API after pulling the change so its additive FinEx reference upgrade runs.

1. In PowerShell, `cd C:\test111\BMS-Capstone\dost-bms-web`, then `npm.cmd run dev:mock`. Open the Vite URL shown in the terminal. The test-account password is `Test12345` as documented in README.
2. Sign in as `main.admin@dost.gov.ph` or `tech.admin@dost.gov.ph`. Open Budget Cycles → FY2027. Check the enabled forms and keep a note of the current settings before changing them. Existing explicitly configured lists are preserved; enable the new BP201 working summary if desired.
3. Edit BP202. Select **Conditionally required**, then check **Requester answers Tier 2 - new or expanded proposal** under **Which budget tier is this proposal?**. Save. Edit BP207 and check the climate question's **Requester answers Yes** checkbox. Save. Confirm all question wording/options match Step 2. Repeat with a temporary custom form (initially Optional), one required text field and an optional dropdown. Use ALL for Tier 2 + climate Yes; later change to ANY. Keep override permission off initially. See [the correction review](bp_forms_corrections_review.md) for Form A's missing-PDF gate and the corrected Form B columns.
4. Switch to FY2028. Confirm the temporary FY2027 configuration is absent. Return to FY2027, disable the temporary form and verify it does not become required even when its answers match. Re-enable it for the remaining checks.
5. Sign in as `requester.co@dost.gov.ph`. Create a request for FY2027. Confirm the institution/unit is locked. Enter a title, funding source and common project information. Leave unavailable official codes/history blank. Add PS **1,000**, MOOE **2,000**, FINEX **300** and CO **400**. The grand total must be **PHP 3,700**.
6. Set climate expenditure of **400** on the MOOE line and **100** on the CO line. Enter confirmed typology text and adaptation/mitigation for each. The climate subset must be **500**, and the grand total must remain **3,700**. Try a climate amount greater than its item or a PS climate amount: submission must be blocked. Do not enter invented typology codes for real use.
7. In Step 2 choose Tier 1, climate Yes, outyears No, nonpermanent staffing No and convergence No. Answer only questions relevant to enabled requester forms; agency-finance questions should not all be compulsory. Confirm BP201-A/B/C/D and BP207 apply. BP202 should follow its configured Tier rule. Choosing foreign grant or loan should select BP203; National Government should remove that default requirement. Foreign funding must not silently change the chosen Tier.
8. Select Tier 2 and confirm BP202/custom conditions update immediately. In Step 3 inspect each reason and completing-office text. Institution/consolidation schedules should remain distinct from requester tasks. An administrator-mandated form should not offer a removal action unless its administrator explicitly permits overrides.
9. In Step 4 complete the existing requester-required fields. Open BP202's funding table, add current-year rows by class and tier, and make them reconcile to the line items. Incorrect current-year class amounts must block completion. Inspect the correct FinEx total and fiscal-year-relative labels. The new fields are capture support; they do not certify full official-form completeness.
10. For staffing, answer nonpermanent staffing Yes. In BP204 add two rows with eligible classifications, separate grade/rate, count and months. Confirm calculated months/salary and explicit compensation totals. Leave an unknown allowance blank and confirm it is not invented as zero. Enter zero only when confirmed. Ensure known personnel costs fit the PS budget. Confirm no new HR login/approval lane is imposed.
11. Enter data in BP202, then change Tier to 1. A warning should explain removal from the required list and retention of the data. Change back to Tier 2 and confirm the values remain. Try ALL/ANY and disabled-form conditions against the administrator settings.
12. Add a partially entered new line item. Save as draft, leave and reopen from Budget Requests. Answers, complete items, partial row, custom/table values and existing uploaded files must remain. Remove or finish the partial row before submission. Refresh a saved draft and verify the same data is returned.
13. In Step 5 attach signed official copies for each required requester form. Attach the **CCC-approved QAR form** for BP207 and any cycle-required supporting documents. Save/reopen and inspect the association. Attempt submission without a required field, signed copy or annex: the UI and API must reject it.
14. After uploading a signed copy, change relevant common data, a line item, or a form value. The signature must be invalidated or require replacement. Change an administrator field label/definition in the same fiscal year, reload the draft and verify replacement is required. Existing old signatures without content tracking must be reuploaded before a new unified submission.
15. Review the totals and print preview. Check the **internal working schedule / pesos** label, row contents and totals. Obtain institution approval and upload the correctly signed official form. Submit once; another submission or direct edit of the submitted request must be rejected.
16. Sign in as `tech.staff@dost.gov.ph` (Budget and Finance Division). Review the exact submitted form values, tables, attachments and version PDF. Return with remarks, correct as the original requester and resubmit. The prior version must remain unchanged and the new submission must have a new version. A requester from another unit must not view/edit the request.
17. Review/accept and consolidate eligible institution requests. Confirm FinEx appears in class totals and explicit climate amounts stay included subsets. Compare the source version before and after consolidation: definitions, values and attachments must remain identical. A consolidated amount cannot be reduced below its retained climate component without explicit reconciliation. The existing Forms module can still be used for official institutional/consolidated templates; automatic full official consolidation is not claimed.
18. Open an older record containing TAG. Verify its original amount and category remain, it is labelled unresolved, and TAG alone does not select BP207. Do not reclassify it until DOST approves its meaning/accounting treatment. Open an older classic request and its native form entries to confirm compatibility.

## Known limits and decisions still needed

- Full official form reproduction, agency/OU/Tier/history tables, authoritative UACS/IOS/typology data, benefit entitlement calculations, structured physical targets for every form, and automatic official consolidated BP output remain incomplete. See audit rows and D1–D12.
- DOST must settle responsibilities per institution/form. Specialist-office contributions and signatories are not new enforced BMS roles.
- TAG's meaning and formal historical reconciliation remain unresolved. New explicit climate fields do not reinterpret old TAG.
- Tier/FAP/profile exemptions remain conservative configurable defaults. They are not presented as fully verified DOST business rules.
- Existing native Forms-module history/default cells and old records without captured definitions need individual review. No historical value or old official layout can be retroactively reconstructed with certainty.
- Mock login tokens and generated file links retain the demo server's authentication/storage limitations. Generated-file serving is not a production private-document store. Real authentication, attachment storage authorisation, malware scanning and scanned-signature verification belong in the production backend. API ownership fixes do not certify the demo for real DOST data.
- A changed server-side cycle may require an open wizard to be reloaded. The server is authoritative at submission; it rejects stale requirements rather than accepting an old client schema.
- A database transaction protects request header/item replacement. Uploaded files are not part of the SQLite transaction; a failed save can leave an unused generated file, without changing the submitted record.

## Proposed pull request description

**Title:** Audit FY2027 BP requirements and harden configurable request/form preparation

The FY2027 request workflow previously used a separate administrator condition vocabulary, omitted real FinEx entries, treated undefined TAG records as climate expenditure, and allowed API edits/submissions to bypass form and ownership checks. This change shares the requester questionnaire with the cycle editor, supports question/answer ALL/ANY rules, reconciles four expenditure classes with separate climate subsets, and preserves legacy TAG data without conversion.

It expands institution working schedules and BP202/204 capture, retains the five-step wizard and Forms module, saves partial drafts, validates signed/supporting uploads against current server definitions, and captures immutable submitted forms and source-institution versions for consolidation. The official-source audit records remaining template gaps and DOST decisions; generated schedules explicitly do not claim full DBM compliance.

Validation: all Node/React integration tests, production build and lint. Baseline lint/bundle warnings remain documented. DOST review is needed for per-form responsibility, profile exemptions, authoritative reference datasets, TAG accounting and official output acceptance. No push or merge is included.

## Specific files changed

The following inventory is generated from the feature diff against `c6d44ae`, including new files. Paths are relative to the repository root.

```text
.gitignore
docs/bp_forms_compliance_audit.md
docs/bp_forms_workflow_review.md
dost-bms-web/mock/db.json
dost-bms-web/mock/server/db.mjs
dost-bms-web/mock/server/routes/budgetRequests.mjs
dost-bms-web/mock/server/routes/budgetReview.mjs
dost-bms-web/mock/server/routes/unifiedBudgets.mjs
dost-bms-web/mock/server/services/budgetRequestLifecycle.mjs
dost-bms-web/mock/server/services/budgetRequestValidation.mjs
dost-bms-web/mock/server/services/budgetRequestVersionPdf.mjs
dost-bms-web/mock/server/services/budgetRequests.mjs
dost-bms-web/mock/server/services/dashboard.mjs
dost-bms-web/mock/server/services/requestActor.mjs
dost-bms-web/mock/server/services/requestFormConfiguration.mjs
dost-bms-web/mock/server/services/unifiedBudgetVersionPdf.mjs
dost-bms-web/mock/server/services/unifiedBudgets.mjs
dost-bms-web/mock/server/services/users.mjs
dost-bms-web/mock/tests/bpWorkflow.test.mjs
dost-bms-web/mock/tests/budgetCycles.test.mjs
dost-bms-web/mock/tests/budgetCyclesPage.test.mjs
dost-bms-web/package.json
dost-bms-web/src/bp_forms/bp_form_catalog.js
dost-bms-web/src/bp_forms/bp_form_conditions.js
dost-bms-web/src/bp_forms/bp_form_configuration.js
dost-bms-web/src/bp_forms/bp_form_fields.js
dost-bms-web/src/bp_forms/bp_form_rules.js
dost-bms-web/src/bp_forms/proposal_questions.js
dost-bms-web/src/bp_forms/structured_fields.js
dost-bms-web/src/components/form/structured_field.jsx
dost-bms-web/src/components/form/unified_request_forms_summary.jsx
dost-bms-web/src/components/shared/budget_request_totals_summary.jsx
dost-bms-web/src/pages/budget_consolidate/budget_consolidation_detail_page.jsx
dost-bms-web/src/pages/budget_consolidate/edit_budget_consolidation.jsx
dost-bms-web/src/pages/budget_consolidate/new_budget_consolidation.jsx
dost-bms-web/src/pages/budget_cycles/budget_cycles_page.jsx
dost-bms-web/src/pages/budget_cycles/form_configuration_editor.jsx
dost-bms-web/src/pages/budget_requests/budget_request_detail_page.jsx
dost-bms-web/src/pages/budget_requests/edit_budget_request.jsx
dost-bms-web/src/pages/budget_requests/new_budget_request.jsx
dost-bms-web/src/pages/budget_review/budget_review_detail_page.jsx
dost-bms-web/src/pages/dashboard/dashboard_page.jsx
dost-bms-web/src/pages/unified_request/step_prefilled_forms.jsx
dost-bms-web/src/pages/unified_request/step_proposal_questions.jsx
dost-bms-web/src/pages/unified_request/step_request_details.jsx
dost-bms-web/src/pages/unified_request/step_required_forms.jsx
dost-bms-web/src/pages/unified_request/step_review_submit.jsx
dost-bms-web/src/pages/unified_request/unified_request_page.jsx
dost-bms-web/src/pages/unified_request/use_unified_request_draft.js
dost-bms-web/src/router/app_router.jsx
dost-bms-web/src/routes/permission_route.jsx
dost-bms-web/src/utils/budget_financials.js
dost-bms-web/src/utils/budget_request_utils.js
dost-bms-web/src/utils/consolidation_line_rows.js
dost-bms-web/src/utils/unified_request_checks.js
dost-bms-web/src/utils/unified_request_form_attachments.js
```
