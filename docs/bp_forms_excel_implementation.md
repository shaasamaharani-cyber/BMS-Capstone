# FY2027 BP forms: workbook implementation and verification

Updated 15 October 2026 on `feature/fy2027-bp-forms-audit`. Changes are local. No commit, push, PR, merge, database reset, production deployment or submission migration was performed for this implementation.

This report supersedes earlier missing-reference and implementation-status statements in the audit/correction reports. The newly supplied BP A reference is available and has been inspected. The old reports remain historical records.

## Evidence and boundaries

The actual `docs/reference/DBM BP Forms FY2027 - Consolidated.xlsx` was read, including all cells, merges, table headers, notes and formulas in its Index and 21 form worksheets. SHA-256: `d5ce80db9b1eda59ed67b94e0640627ca0c317d78286fa38fc142af7064364ae`. The duplicate workbook under the application reference folder has the same hash. All 1,601 blue example cells are excluded from exported inventory values and runtime defaults. Worksheet formulas are evidence, never executable configuration. Sample institutional names, accounting codes, salary rates and signatures are not DOST defaults.

Evidence artifacts:

- [Cell inventory](bp_forms_workbook_inventory.json): all 22 sheets, source ranges, merge ranges and formula locations; examples are marked without copying their values.
- [Field mapping](bp_forms_field_mapping.md): all workbook columns, source notes, actual persisted runtime field paths, mappings, calculations and prefill sources. Source paths and stored field IDs are distinguished.
- [NBM 156](https://www.dbm.gov.ph/wp-content/uploads/Issuances/2026/National-Budget-Memorandum/NATIONAL-BUDGET-MEMORANDUM-NO-156.pdf): blank forms and instructions, read from the complete downloaded PDF. The [DBM index](https://www.dbm.gov.ph/index.php/compliance-with-good-governance-conditions) supplies the FY2027 form list and DBM submission references.
- Supplied PDFs in `dost-bms-web/docs/reference/`: BP A, B, 202 and 207 were visually inspected. They are DBM-OSEC examples; none is used as a PDF background or submission dataset.
- The Week 7 transcript, BP Forms & Dynamic Budget Entry Proposal, P611 requirements and internal project charter remain the policy sources linked in the [earlier audit](bp_forms_compliance_audit.md). This implementation uses the user's subsequent policy clarification and does not assert new DOST decisions.

All 21 exports remain **DRAFT / INTERNAL — layout verification and office certification pending**. Programmatic reconstruction and visual comparison do not establish DBM acceptance. The outputs preserve records and principal headings; exact spacing, prescribed fixed hierarchy, source variants and final certification still need acceptance. Wide schedules intentionally use continuation column sets with repeated identifiers instead of reducing all 60 MOOE columns to unreadable print.

## Stage 1: schema, administration and conditional requirements

Implemented a shared schema for text, long text, numbers, currency, dates, selects, radios, checkboxes, attachments, repeating cards/groups and declarative calculations. Field settings include required status, descriptions, section membership, input validation, proposal-answer visibility, contributor metadata and automatic sources. The editor uses the existing Step 2 questions and exact answer values for ANY/ALL conditions. New optional/conditional forms retain their existing behavior; no second requester applicability questionnaire was introduced.

Official source IDs, mapped repeating structures and calculated output columns survive administrator overlays. Labels, inputs and custom fields remain configurable. Disabling an input retains its underlying definition. Custom fields append to the official schema. The old 150-field / 40-column truncations are removed; invalid structures return validation errors instead. Nested groups have an explicit eight-level validation limit, not silent truncation. Calculations accept only earlier numeric operands, never arbitrary executable expressions.

Cycle saves retain trusted full definitions, revision metadata and previous configurations. Clients cannot supply authoritative history or definitions. The administration page shows saved configuration history. Already submitted request definitions remain frozen. Native entries capture their schema when saved and reopen against it. Preexisting unversioned configurations are identified honestly; missing historical definitions cannot be reconstructed retroactively.

Main files, relative to `dost-bms-web/`:

- `src/bp_forms/form_schema.js`, `bp_form_configuration.js`, `official_form_schema.js`, `official_workbook_manifest.js`, `bp_form_fields.js`, `bp_form_catalog.js`
- `src/pages/budget_cycles/schema_fields_editor.jsx`, `form_configuration_editor.jsx`, `budget_cycles_page.jsx`
- `mock/server/routes/settings.mjs`, `forms.mjs`, `services/requestFormConfiguration.mjs`

Test: edit a form in an open fiscal year, set a label, field type, options, validation and section guidance; save, reload and reopen. Select Yes/No answer checkboxes with ANY, then ALL, and exercise those same answers in requester Step 2. Switch years and confirm isolation. Save a second change and inspect configuration history. Existing tests cover real API persistence, access restrictions and captured submission definitions.

Remaining: contributor names are planning metadata, not new authenticated HR/Finance task queues. DOST has not confirmed those workflows. History is viewable; there is no automatic historical-configuration restore operation.

## Stage 2: guided entry and saving

Requester fields render individually in collapsible sections using existing Bootstrap/BMS controls. Repeatable sections render labelled cards; the first blank entry is visible immediately, with Add another and Remove entry controls. Financial inputs show PHP; output values are read-only. Grouped input replaces editable government-style grids in the unified wizard and the newly generated official native schemas.

The existing draft/autosave services retain raw entered values. Changing applicability hides a form without discarding its saved responses. Read-only submitted summaries support both table and group types and evaluate visibility using captured proposal answers. Legacy native tables are preserved rather than destructively rewritten. Existing nonempty administrator native schemas are not overwritten by seeding.

Main files:

- `src/components/form/guided_field_input.jsx`, `guided_form_sections.jsx`, `structured_field.jsx`, `unified_request_forms_summary.jsx`
- `src/pages/unified_request/step_prefilled_forms.jsx`, `unified_request_page.jsx`
- `src/forms/components/form_renderer.jsx`, `schemas/default_schemas.js`, `utils/form_object.js`, `utils/seed_default_schemas.js`
- `src/pages/forms/entry_page.jsx`

Test: open BP B, enter two indicator cards and both NEP tiers, navigate away, save and reopen. Check keyboard operation, required errors and smaller-screen wrapping. The React/JSDOM integration test checks the first visible card, absence of editable spreadsheet tables, saving/reopening, admin condition changes and export payload. This is not a claim of a full browser or assistive-technology certification pass.

Remaining: the standalone legacy form engine remains available for previously configured nonempty schemas. It is not silently converted to the new native schema. Attachments use the mock application's existing data-URL storage model; this does not introduce a production document store.

## Stage 3: comprehensive mappings and reuse

All 21 workbook form tabs have generated inventories, editable runtime definitions and matching native defaults. Financial amounts stay in pesos in storage. BP 204 **and BP 205** print pesos; other financial schedules print thousands, with sufficient fractional precision to retain centavos. Performance and physical targets retain indicator units and are never aggregated as money.

Shared headers reuse named request/institution sources. Database/request IDs are not treated as UACS/PREXC values. BP A supports actual/current/proposed periods, tier, OG/P/T status, GAS/STO/Operations, class totals and historical rows. Proposed item-derived rows reuse actual budget data. BP B retains organisational outcomes, programs, subprograms, outcome/output indicators, historical targets/accomplishments and separate NEP tiers. Its NBM 2025 GAA target remains enterable and is printed as additional NBM information alongside the workbook variant; an old unassigned NEP target is never assigned to a tier.

BP 202 P/A/P allocations prefill from the four supported expenditure classes and the known Step 2 tier. BP 207 prefill uses only explicit climate subsets of MOOE/CO; TAG is excluded. Saved arrays, including an intentional empty array, override prefill. Missing history, future appropriations, unknown tiers and unconfirmed benefit factors remain blank. BP 204 compensation and BP 205 leave calculations use explicit inputs only. BP 203 financial rollups use disjoint cash/non-cash/GOP operands; physical targets allow office-supplied totals because their indicator units are not universal numeric sums.

NBM 156 page 69 confirms **nine** BP 201-C columns: UACS, cost structure/PAP, management supervision/trusteeship fees, nonresident interest, guarantee fees, bank charges, commitment fees, other financial charges and total. The runtime adds this verified schedule. The workbook's six-column ASSUMED reconstruction remains a separate legacy/internal structure; its values are never automatically allocated among the verified fee columns. BP 201 A–D also expose the original reporting-period selection.

Main files: `scripts/audit-bp-workbook.mjs`, `src/bp_forms/official_form_schema.js`, `official_form_values.js`, `bp_form_fields.js`, `bp_form_b.js`, `structured_fields.js`, and the generated mapping/inventory files under root `docs/`.

Test: enter PS 100.01 and CO 50 with an explicit climate component of 20 and choose Tier 2. BP 202 prefills 150.01 of requirements; BP 207 shows only 20. An unrelated historical TAG amount changes neither schedule. Clear and save a repeatable group and confirm it stays empty after reopening/exporting. Change FY to 2028 and verify report-year labels shift once while literal project names do not change.

Remaining: mapping a genuine official object code, allocating broad FinEx amounts to individual fee types, supplying historical actuals and selecting verified climate codes require explicit office data. Nothing derives these from descriptions or sample records. BP 206's printed 2024/2025/2026 physical-target sequence is retained and flagged; its treatment needs confirmation.

## Stage 4: independent government-style PDF rendering

`mock/server/services/bpFormPdf.mjs` renders fresh PDFKit pages from the same resolved definitions and entered values. It supplies form titles, grouped headers, period labels, financial/indicator units, institution identity, repeating records, totals, column continuations and blank signature lines. User-provided names and dates are shown; no signature or approval is generated. Custom and preserved legacy data are kept in explicitly internal supporting sections. The Forms entry export and captured request-version export use this renderer for new official definitions; older captured definitions keep the legacy path.

The wizard calls authenticated `POST /bp-form-exports`. Server-side configuration and recalculated line-item totals are authoritative; forged definitions are rejected. Exporting a preview does not submit or modify a request. Download links are tied to the current form content. Native entries must be saved before using their generated artifact. Each new draft/native artifact has a unique filename, so it does not overwrite another artifact.

Main files:

- `mock/server/services/bpFormPdf.mjs`, `formEntryPdf.mjs`, `budgetRequestVersionPdf.mjs`
- `mock/server/routes/bpFormExports.mjs`, `mock/sqlite-api-server.mjs`
- `src/pages/unified_request/step_prefilled_forms.jsx`, `src/pages/forms/entry_page.jsx`
- `scripts/preview-bp-forms.mjs`

All 21 synthetic PDFs were generated without reading/writing submission data. Each output and the corresponding original NBM form page was rasterized for visual comparison. BP A/B/202/207 were also compared with the supplied DBM example PDFs. The comparison exposed and corrected generic section-as-title exports, unmerged heading groups, landscape treatment of portrait schedules, signature placement, missing financial subtotal formulas and a reporting-year double-rebase risk. The table below records the remaining limits instead of claiming pixel-identical or accepted forms.

| Form | Original NBM page(s), 1-based | Implemented structure and remaining layout verification |
| --- | --- | --- |
| A | 45 | Separate actual/current/proposed schedules, UACS/PAP/status, GAS/STO/Operations grouping, subtotals and total. Supplied example is landscape; NBM blank is portrait. Fixed hierarchy/checkbox positioning still differs. |
| B | 47 | Outcome/program/indicator grouping and both NEP tiers. Workbook has Data Source/Remarks; NBM adds historical GAA. Additional NBM/legacy targets are preserved separately. Final source variant selection is unresolved. |
| C | 49 | RDC/ACO columns and monetary totals. Prescribed printed hierarchy and notes need final typography review. |
| D | 51 | CSO/activity/location, included amounts and explanations. Fixed printed hierarchy and notes need review. |
| 100 | 54 | Revenue columns and all reporting years. Dynamic rows differ from the blank template's fixed hierarchy. |
| 100-A | 56 | All 17 earmarked revenue/expenditure columns; readable continuation sets. Wider than the original single-page arrangement. |
| 100-B | 58 | All 13 other-receipt/expenditure columns. Continuation arrangement and printed notes need acceptance. |
| 100-C | 61 | All 13 donation/grant columns. Continuation arrangement and printed notes need acceptance. |
| 200 | 63 | Portrait appropriation/obligation schedule. Fixed legal appropriation rows must come from office data, not sample rows. |
| 201-A | 67 | All 25 personnel-service columns, report period, region/tier, totals. Multiple column sets replace the compressed original width. |
| 201-B | 68 | All 60 workbook MOOE columns, report period, repeated identifiers, continuation headings. Workbook/object-code correspondence still needs office acceptance. |
| 201-C | 69 | Verified nine-column NBM schedule plus separate preserved assumed workbook records. No automatic fee classification. Pixel fidelity remains draft. |
| 201-D | 70 | All 17 CO columns and reporting period. Wide continuation layout and hierarchy need acceptance. |
| 201-E | 72 | All 24 outyear/tier columns and disjoint class totals. Continuation sets differ from the original compressed page. |
| 202 | 75–76 | Numbered portrait profile, P/A/P funding, physical targets, total project costs, infrastructure operating costs, components and locations. Dynamic rows/long narrative pages differ from fixed source boxes. |
| 203 | 79–80 | Numbered foreign-assisted profile; five structured financial/physical schedules. Printed column bands and page breaks need acceptance. |
| 204 | 83 | All 25 staffing columns, tier/classification and peso compensation calculations. Final official signature designations remain unverified; printed sign-off is explicitly internal. |
| 205 | 86 | Retiree identity/dates, salary, fractional leave credits and benefits in pesos. HR factor/rates must be explicit; no sample statutory factor is defaulted. |
| 206 | 88 | Portrait convergence profile, implementing agencies, funding, physical targets and strategies; item 9 added from NBM. Workbook/NBM year and certification variants remain unresolved. |
| 207 | 92–94 | Separate actual/current/proposed reports with period-specific summaries and sign-off blocks, all 12 proposed columns and tier/class totals. NBM-sourced additional current-year table and separate historical summaries retain both reporting periods without copying workbook actuals between years. |
| 300 | 97 | Provisions, proposal and justification. Fixed special/general hierarchy is supplied as records rather than fabricated sample rows. |

Test: generate the draft from Step 4, open every continuation page and compare with the indicated original. The synthetic gallery can be recreated with `node scripts/preview-bp-forms.mjs --synthetic`. Files are under root `.tmp/bp-previews/`, excluded from Git. Synthetic records are explicitly labelled and never saved into the mock database. The script also creates ignored server artifacts to exercise the actual renderer.

Remaining: the PDFs are structurally improved government-style drafts, not certified substitutes for all official DBM forms. Exact fixed-row hierarchy, some source variants and final DOST certification remain explicit follow-up work. The application does not claim that uploading a file proves its signature/CCC approval is authentic.

## Stage 5: regression, history and responsibility checks

The complete suite passes **89 tests, zero failures, zero skips** on this Windows workspace, including PDF text extraction with the installed Poppler utility. It covers workbook coverage, all-form mapped defaults, additive configuration, >150 fields/>40 columns, nested cards, input validation, numeric calculations, explicit prefill, saved empty sections, report years, all 21 PDF exports retaining two distinct records in each applicable schedule, 80 MOOE rows across every column set, API authentication, tampered definitions/totals, draft persistence, answer changes, configuration revisions, signed-copy invalidation, role restrictions, consolidation and immutable submitted snapshots. Browser-like integration uses React/JSDOM with API adapters; it is not a full deployed-browser run.

`npm.cmd run lint` passes with zero errors and 15 preexisting warnings. `npm.cmd run build` succeeds with the existing large-bundle advisory. No dependency installation or lockfile update was required.

Added/updated tests: `mock/tests/officialBpForms.test.mjs`, `budgetCycles.test.mjs`, `budgetCyclesPage.test.mjs`, `bpWorkflow.test.mjs`, `bpPerformancePdf.test.mjs`.

Run from `dost-bms-web/`:

```powershell
npm.cmd test
npm.cmd run lint
npm.cmd run build
node scripts/audit-bp-workbook.mjs
node scripts/preview-bp-forms.mjs --synthetic
npm.cmd run dev:mock
```

Do not run `mock:reset` to review these changes: the implementation does not need a database reset. The existing seeded schema upgrade fills missing/empty defaults; it preserves nonempty configured schemas. Review with an open fiscal year and existing administrator/requester accounts. Draft preview generation itself leaves requests unchanged; saving a cycle or draft in the running UI is a real local edit.

## Ownership, consolidation and unresolved DOST decisions

Individual requesting-institution forms, signed-form uploads, request approval history and Central Office consolidation remain supported. Per-year level/completing-office metadata are configurable. Agency-level labels do not force exclusive Central Office ownership of every form. No new mandatory HR/Finance role workflow was introduced. Source institution submissions remain linked to fiscal year and their captured request versions.

Existing consolidation retains classified financial totals, climate subsets and source institution/version links. This change does **not** invent an automatic rule for merging institutions' narrative/performance/staffing schedules into 21 certified agency forms. Final responsibility, duplication rules and narrative/indicator consolidation semantics need DOST confirmation. Central offices can prepare their own schedules in the Forms module while retaining institution source records.

Open questions for DOST/reference acceptance:

1. Confirm completing, contributing and certifying offices separately for each form; identify which individual schedules and consolidated schedules are required at each workflow stage.
2. Confirm the authoritative BP B output variant and how its additional NBM historical GAA column should appear beside DBM-OSEC Data Source/Remarks.
3. Confirm the accounting meaning and treatment of historical TAG entries. They remain unchanged and included in historical totals; they are neither climate tags nor automatically reclassified expenditure.
4. Confirm verified UACS/PREXC/object-code catalogues and whether all institution schedules follow the same hierarchy.
5. Confirm BP 206 physical-report years and certification variant; confirm responsible sources for the separate BP 207 historical reports.
6. Confirm benefit factors, compensation rules and signature designations from the responsible office before final payroll/retirement or official certification use.
7. Accept the continuation-page approach or approve larger paper sizes for wide official schedules; complete final per-form layout acceptance before removing draft labels.

These are documented decisions, not implied DOST requirements. No historical TAG value, submitted form, existing signature upload or approval rule was silently converted.
