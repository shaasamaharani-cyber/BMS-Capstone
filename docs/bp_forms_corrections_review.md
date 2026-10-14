# BP form corrections — 14 October 2026

> Updated implementation: see [the workbook implementation and verification report](bp_forms_excel_implementation.md). The earlier missing-BP-A-PDF gate and implementation counts below describe the historical audit state.

These changes follow the user's correction request on the existing `feature/fy2027-bp-forms-audit` branch. The working tree was clean when this correction task began. Changes remain local and uncommitted; nothing was pushed or merged. Earlier commits and unrelated work are preserved.

## Administrator checkboxes

The editor groups checkboxes by the existing Step 2 question. Each answer has its own checkbox, including No, both tiers and every funding-source option. Definitions come from `proposal_questions.js` through the existing shared condition catalogue. New selections persist a stable `questionId`, matching legacy `field`, exact answer value and condition ID. Administrators choose ANY or ALL, Always Required or Optional. The field/operator/value expression builder and Add Question Condition button are removed.

The backend validates question/answer pairs and rejects conflicting `questionId`/`field` references. Saved comparisons, numeric thresholds and aggregate foreign-funding conditions remain supported, shown with readable summaries and enable/remove controls. Existing question-answer conditions appear checked. No new requester question is introduced. React tests use the real Step 2 Yes/No controls and confirm immediate required-form changes.

New forms start Optional in the editor. The server also marks newly added custom metadata `optionalByDefault: true`, including API creations without field configuration. Explicit Always/Conditional settings still apply. Previously saved custom forms without configuration retain their former mandatory behaviour; editing such a form shows Always explicitly. The optional marker survives subsequent clients omitting it. Fiscal-year availability, paused conditions, mandates and permitted overrides continue to apply.

Completing-office text is now editable and validated for built-in forms as well as custom forms, saved per fiscal year and captured in submitted catalogue metadata. Institution/consolidation scope stays configurable and does not make every requester responsible for agency-wide reporting. No HR, Finance or Planning role workflow is imposed. Actual DOST responsibility assignments remain provisional.

## Form A: limited corrections; PDF still required

`A.2_BP-FORM-A-_-ACTUAL.pdf` was not found anywhere in the workspace, including ignored research/generated folders. The user was asked to add it. In accordance with that instruction, the Form A template, historical/Tier tables, GAS/STO/Operations hierarchy, OG/P/T status, thousand-peso display and official signatory layout have **not** been redesigned. The existing four-class working matrix is not presented as an official Form A reproduction.

The old standalone `performanceMeasure` no longer blocks completion. Its key and entered data remain; the editor and output label it internal and optional. An old live cycle configuration cannot reinstate that built-in mandatory field. Previously captured submitted definitions are read first and remain unchanged. A distinct administrator-defined internal field can still have its own requirement.

Investigation of the local SQLite requests/cycle configurations did not reproduce the reported three fields all containing `67`. Current sources are independent:

| Field | Source |
| --- | --- |
| Department | Existing DOST department constant |
| Agency / implementing agency | Explicit request implementing-agency name, then configured requesting-unit `agency`, then legacy unit-name fallback |
| Operating unit | Explicit request operating-unit name, then looked-up `ru_name` |
| Appropriation source | Request `appropriationSource`; blank if absent |
| P/A/P UACS/PREXC reference | Request `prexcCode`; blank if absent |
| P/A/P description | Request `programPap`, then proposal title |
| Fiscal year | Fiscal-year lookup's year label |

Neither unit IDs nor fiscal-year IDs populate accounting-reference fields. The frontend and trusted submission service now both pass the agency-name lookup separately. Regression tests distinguish ID `67` from names/references and preserve already entered literal `67` values. No authoritative code registry is available here: user-supplied codes are not certified as verified, inferred or manufactured. The original affected record and an authoritative reference source are still needed to establish that reported case's cause.

## Form B

Reference: [NBM No. 156, BP Form B and instructions, PDF pages 47–48](https://www.dbm.gov.ph/wp-content/uploads/Issuances/2026/National-Budget-Memorandum/NATIONAL-BUDGET-MEMORANDUM-NO-156.pdf#page=47). The official specification has 2025 GAA targets/actual, 2026 GAA targets, baseline, and separate 2027 NEP Tier 1/Tier 2 targets. Outyears are not official Form B columns.

The working editor now has repeatable organisational-outcome, program, sub-program, outcome/output indicator type and indicator rows with those target columns. Targets are text because counts, percentages and milestones use different units; they are not financial amounts or summed. The unified form derives year labels from its common fiscal year. Department/agency/operating-unit metadata reuse the common request values. Budget officer, Planning officer, Agency head and date fields print with blank signature lines; no signatures or historical targets are generated automatically.

Existing `actualTarget`, `actualAccomplishment`, `currentTarget`, `baseline`, program/outcome and indicator keys are retained. New NEP keys are `proposedTier1` and `proposedTier2`. An old `proposedTarget` remains explicitly **Internal: legacy proposed NEP target (tier unassigned)**. Old outyear values remain internal legacy fields. They are never copied into Tier 1/Tier 2. The exact previous built-in column-key shape is upgraded when resolving a live configuration, without mutating saved values or captured historical definitions. Differently structured administrator tables remain unchanged and require deliberate review.

The separate Forms module's empty Form B placeholder now has a FY2027 performance schema using the same column definitions. Seeding fills missing/empty Form B schemas, preserving nonempty custom layouts. Old financial sample sections remain stored and visible as internal legacy data, not converted to indicators. This standalone FY2027 schema does not automatically import a particular request; the unified wizard is the common-data route. Other years need a reviewed native schema or the fiscal-year-aware unified editor.

Printing uses a stacked indicator report so wide target columns are retained. Both native-entry PDFs and submitted-version PDFs preserve the two tiers, units, names and day/month/year date. The version report also resets text width after a financial table. Outputs remain working reports, not certified reproductions of the official grouped layout. Signed official uploads are still required under the configured request-level workflow. Relevant changes invalidate existing draft signatures; previously submitted versions keep their captured definitions and values.

## Local verification

From `C:\test111\BMS-Capstone\dost-bms-web`:

```powershell
npm.cmd test
npm.cmd run lint
npm.cmd run build
npm.cmd run dev:mock
```

Do not run a database reset to test these changes. Open the Vite URL printed by the last command. Restart the mock API to load the changed backend code. Use existing local administrator/requester accounts; the earlier workflow review lists demo accounts.

1. As administrator, choose open FY2027 in Budget Cycles and add a temporary custom form. Verify Optional is initially selected. Give it a required text field, choose Conditional, check climate expenditure → Requester answers Yes, and save. Refresh and reopen the editor: the checkbox must remain checked. Leave override permission off.
2. Create a requester proposal for FY2027 with a valid line item and funding source. Answer climate Yes in Step 2. The custom form must appear immediately. Answer No: it disappears unless another selected condition/override applies. Values already entered in it must remain when Yes is selected again. If BP207 is also enabled, supply valid climate amounts within MOOE/CO plus its signed/QAR requirements before submission.
3. Check Tier 2 as a second condition. Under ALL, only Tier 2 + climate Yes requires the form. Under ANY, either match requires it. Test No as a triggering answer and each funding option too. Disable the form in FY2027: it must not appear. FY2028 settings must remain unchanged. Confirm mandates cannot be removed without administrator override permission and a reason.
4. Edit Form B's completing office and level for FY2027 using provisional labels. Keep institution/consolidation scope to verify it does not block every requester; change to request level only if explicitly intended. Refresh and verify the choices persist.
5. Enter Form B indicator rows with 2025 target `80%`, 2025 actual `85%`, 2026 target `90%`, 2027 Tier 1 `92%`, Tier 2 `95%`, baseline units, and user-supplied signatory names/date. Save a draft, leave, reopen and print. Both tiers and signatory sections must remain. An old single proposed target must show an unassigned tier. In the Forms module, inspect the new empty-placeholder replacement and preserved old sample section; custom nonempty schemas are left for review.
6. For a Form B explicitly configured at request level, upload its signed copy, change a target and try submitting: replacement must be required. Upload the new signed form and submit; review its version PDF. Later live configuration changes must not rewrite that captured version.
7. Add Form A PS/MOOE/FinEx/CO lines `10.01`, `20.02`, `30.03`, `40.04`. Its current working matrix must total `100.10` pesos. The internal performance measure must be optional and old data retained. Official-layout comparison, hierarchy/year/Tier/thousands checks are pending the actual PDF; do not accept this as an official Form A test.

Automated coverage includes checkbox labels/options, live requester Yes/No updates, ANY/ALL, backend validation, per-year persistence/defaults/office configuration, old conditions, distinct common sources, four-class arithmetic, Form B repeatable entry/reopen/print, draft/signature/version preservation and extracted PDF target/signatory contents. PDF text extraction uses `pdftotext` when installed; that subtest is marked skipped on machines without it. It ran on this workspace.

Final run: **54 tests passed, zero failed, zero skipped.** Production build passed. Lint passed with zero errors and the same 15 baseline warnings. The build retains its existing large-bundle warning and reported a plugin-timing advisory. Git whitespace validation passed. Form A's missing-template comparison was not counted as a passed test.

## Files changed in this correction task

Paths below are relative to the repository root. Earlier feature-branch changes are listed separately in the original workflow review.

```text
docs/bp_forms_compliance_audit.md
docs/bp_forms_corrections_review.md
docs/bp_forms_workflow_review.md
dost-bms-web/mock/server/routes/settings.mjs
dost-bms-web/mock/server/services/budgetCycles.mjs
dost-bms-web/mock/server/services/budgetRequestVersionPdf.mjs
dost-bms-web/mock/server/services/formEntryPdf.mjs
dost-bms-web/mock/server/services/requestFormConfiguration.mjs
dost-bms-web/mock/tests/bpPerformancePdf.test.mjs
dost-bms-web/mock/tests/bpWorkflow.test.mjs
dost-bms-web/mock/tests/budgetCycles.test.mjs
dost-bms-web/mock/tests/budgetCyclesPage.test.mjs
dost-bms-web/src/bp_forms/bp_form_b.js
dost-bms-web/src/bp_forms/bp_form_catalog.js
dost-bms-web/src/bp_forms/bp_form_configuration.js
dost-bms-web/src/bp_forms/bp_form_fields.js
dost-bms-web/src/bp_forms/bp_form_rules.js
dost-bms-web/src/components/form/form_signatories.jsx
dost-bms-web/src/components/form/structured_field.jsx
dost-bms-web/src/components/form/unified_request_forms_summary.jsx
dost-bms-web/src/forms/components/form_renderer.jsx
dost-bms-web/src/forms/schemas/default_schemas.js
dost-bms-web/src/forms/utils/seed_default_schemas.js
dost-bms-web/src/pages/budget_cycles/budget_cycles_page.jsx
dost-bms-web/src/pages/budget_cycles/form_configuration_editor.jsx
dost-bms-web/src/pages/unified_request/step_prefilled_forms.jsx
dost-bms-web/src/pages/unified_request/unified_request_page.jsx
```
