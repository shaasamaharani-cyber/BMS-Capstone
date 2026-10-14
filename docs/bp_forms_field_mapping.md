# FY2027 BP workbook field mapping

Principal reference: `docs/reference/DBM BP Forms FY2027 - Consolidated.xlsx`. SHA-256: `d5ce80db9b1eda59ed67b94e0640627ca0c317d78286fa38fc142af7064364ae`. Read **22 worksheets / 21 form tabs**. Blue-font example values are excluded from the inventory and runtime definitions. Static headings, notes, numbering, sample hierarchy rows and totals are not requester inputs. All source locations below are stable worksheet references; government object codes are not inferred from examples.

The workbook is a transcription of DBM-OSEC submissions, not a DOST responsibility specification. NBM 156 remains the instruction reference. `workbook-transcription` is evidence of a heading, not certification of PDF fidelity. BP 201-C is explicitly ASSUMED. BP B differs from the NBM blank template (Data Source/Remarks versus its additional 2025 GAA column). BP 206 retains an older printed target-year sequence; it must not silently be rebased. BP 204 and BP 205 use pesos. Sample signatory titles and benefit rates are not DOST defaults.

| Form | Sections | Columns | Units | Export verification |
| --- | --- | ---: | --- | --- |
| BP FORM A | Program budget matrix | 8 | thousand-pesos | workbook-transcription-pdf-comparison-pending |
| BP FORM B | Organisational outcomes and performance indicators | 8 | indicator/text | workbook-transcription-pdf-comparison-pending |
| BP FORM C | RDC inputs and agency feedback | 8 | thousand-pesos | workbook-transcription-pdf-comparison-pending |
| BP FORM D | CSO inputs and agency feedback | 8 | thousand-pesos | workbook-transcription-pdf-comparison-pending |
| BP FORM 100 | General fund revenues | 11 | thousand-pesos | workbook-transcription-pdf-comparison-pending |
| BP FORM 100-A | Earmarked revenues and expenditure | 17 | thousand-pesos | workbook-transcription-pdf-comparison-pending |
| BP FORM 100-B | Off-budgetary and custodial funds | 13 | thousand-pesos | workbook-transcription-pdf-comparison-pending |
| BP FORM 100-C | Donations and grants | 13 | thousand-pesos | workbook-transcription-pdf-comparison-pending |
| BP FORM 200 | Appropriations and obligations | 4 | thousand-pesos | workbook-transcription-pdf-comparison-pending |
| BP FORM 201-A | Personnel services by object | 25 | thousand-pesos | workbook-transcription-pdf-comparison-pending |
| BP FORM 201-B | MOOE by object | 60 | thousand-pesos | workbook-transcription-pdf-comparison-pending |
| BP FORM 201-C | Financial expenses — layout pending verification | 6 | thousand-pesos | assumed-layout-pending |
| BP FORM 201-D | Capital outlays by object | 17 | thousand-pesos | workbook-transcription-pdf-comparison-pending |
| BP FORM 201-E | Outyear requirements by year and tier | 24 | thousand-pesos | workbook-transcription-pdf-comparison-pending |
| BP FORM 202 | 13.1 P/A/P attribution by expense class; 13.3 Total project cost; 13.4 Operating costs of infrastructure projects; 13.5 Costing by components; 13.6 Location of implementation | 23 | thousand-pesos | workbook-transcription-pdf-comparison-pending |
| BP FORM 203 | 10.1 Project implementation schedule; 12.1 Total project cost; 12.1.a Comparative budget levels; 12.2 Costing by components; 12.3 Physical targets | 56 | thousand-pesos | workbook-transcription-pdf-comparison-pending |
| BP FORM 204 | Staffing positions by tier and classification | 25 | pesos | workbook-transcription-pdf-comparison-pending |
| BP FORM 205 | Retiree details and benefits | 13 | pesos | workbook-transcription-pdf-comparison-pending |
| BP FORM 206 | 4 Implementing agencies; 6 Funding requirements; 7 Physical targets and accomplishments | 17 | thousand-pesos | workbook-transcription-pdf-comparison-pending |
| BP FORM 207 | Proposed climate expenditure by tier; Actual climate expenditure; Summary by adaptation and mitigation | 22 | thousand-pesos | workbook-transcription-pdf-comparison-pending |
| BP FORM 300 | Special provisions and justification | 3 | indicator/text | workbook-transcription-pdf-comparison-pending |

## BP FORM A — Program Budget Matrix


### Program budget matrix

Reference: `BP A!A17:H19`. Repeatable records; headings are output labels.

| Stable column ID | Heading path | Type | Treatment |
| --- | --- | --- | --- |
| `bp-a.matrix.col_A` | UACS Code | text | Input or mapped existing data; office responsibility configurable |
| `bp-a.matrix.col_B` | P/A/P | text | Input or mapped existing data; office responsibility configurable |
| `bp-a.matrix.col_C` | Status (OG) (P) (T) | text | Input or mapped existing data; office responsibility configurable |
| `bp-a.matrix.col_D` | AMOUNT (in thousand) / PS | currency | Input or mapped existing data; office responsibility configurable |
| `bp-a.matrix.col_E` | AMOUNT (in thousand) / MOOE | currency | Input or mapped existing data; office responsibility configurable |
| `bp-a.matrix.col_F` | AMOUNT (in thousand) / FINEX | currency | Input or mapped existing data; office responsibility configurable |
| `bp-a.matrix.col_G` | AMOUNT (in thousand) / CO | currency | Input or mapped existing data; office responsibility configurable |
| `bp-a.matrix.col_H` | AMOUNT (in thousand) / TOTAL | currency | Calculated/output only; formula needs a verified operand mapping |

Reference notes and unresolved details:

- `BP A!A35` (workbook-reference): Prepared separately for each of: 2025 Actual Obligations, 2026 Current Program, 2027 Total Proposed Program (Tier 1 / Tier 2) - tick the matching box.
- `BP A!A36` (workbook-reference): Sub-total rows follow each cost structure (GAS, STO, Operations); Project(s) / Locally-Funded Project(s) appear as group rows.
- `BP A!A37` (workbook-reference): Sample rows are from DBM's 2025 Actual Obligations matrix (amounts in thousand pesos).
- `BP A!A38` (workbook-reference): This report was generated using the Online Submission of Budget Proposal (OSBP).

## BP FORM B — Agency Performance Measures


### Organisational outcomes and performance indicators

Reference: `BP B!A10:H12`. Repeatable records; headings are output labels.

| Stable column ID | Heading path | Type | Treatment |
| --- | --- | --- | --- |
| `bp-b.performance.col_A` | ORGANIZATIONAL OUTCOMES / PERFORMANCE INDICATORS | text | Input or mapped existing data; office responsibility configurable |
| `bp-b.performance.col_B` | DATA SOURCE | text | Input or mapped existing data; office responsibility configurable |
| `bp-b.performance.col_C` | ACTUAL (2025) | text | Input or mapped existing data; office responsibility configurable |
| `bp-b.performance.col_D` | GAA (2026) | text | Input or mapped existing data; office responsibility configurable |
| `bp-b.performance.col_E` | BASELINE | text | Input or mapped existing data; office responsibility configurable |
| `bp-b.performance.col_F` | NEP TARGETS (2027) / TIER 1 | text | Input or mapped existing data; office responsibility configurable |
| `bp-b.performance.col_G` | NEP TARGETS (2027) / TIER 2 | text | Input or mapped existing data; office responsibility configurable |
| `bp-b.performance.col_H` | Remarks | textarea | Input or mapped existing data; office responsibility configurable |

Reference notes and unresolved details:

- `BP B!A27` (workbook-reference): Grouped by Organizational Outcome (OO) > Program > Outcome Indicators / Output Indicators.

## BP FORM C — Summary of RDC Inputs and Recommendations on Agency New and Expanded Programs and Projects


### RDC inputs and agency feedback

Reference: `BP C!A13:H16`. Repeatable records; headings are output labels.

| Stable column ID | Heading path | Type | Treatment |
| --- | --- | --- | --- |
| `bp-c.rdcInputs.col_A` | PROGRAMS / ACTIVITIES / PROJECTS | text | Input or mapped existing data; office responsibility configurable |
| `bp-c.rdcInputs.col_B` | BUDGET ALLOCATION / TIER 1 | currency | Input or mapped existing data; office responsibility configurable |
| `bp-c.rdcInputs.col_C` | BUDGET ALLOCATION / TIER 2 | currency | Input or mapped existing data; office responsibility configurable |
| `bp-c.rdcInputs.col_D` | BUDGET ALLOCATION / Agency Central Office / Included in the Budget Proposal | currency | Input or mapped existing data; office responsibility configurable |
| `bp-c.rdcInputs.col_E` | BUDGET ALLOCATION / Agency Central Office / Not Included in the Budget Proposal | currency | Input or mapped existing data; office responsibility configurable |
| `bp-c.rdcInputs.col_F` | BUDGET ALLOCATION / Agency Central Office / Total | currency | Calculated/output only; formula needs a verified operand mapping |
| `bp-c.rdcInputs.col_G` | RDC INPUT / RECOMMENDATION | currency | Input or mapped existing data; office responsibility configurable |
| `bp-c.rdcInputs.col_H` | ACO / SUC FEEDBACK | textarea | Input or mapped existing data; office responsibility configurable |

Reference notes and unresolved details:

- `BP C!A34` (workbook-reference): DBM-OSEC submitted this form with no entries (status NOT APPLICABLE), so there are no sample rows.

## BP FORM D — Report of CSOs' Inputs on Ongoing and New Spending Projects and Activities


### CSO inputs and agency feedback

Reference: `BP D!A13:H15`. Repeatable records; headings are output labels.

| Stable column ID | Heading path | Type | Treatment |
| --- | --- | --- | --- |
| `bp-d.csoInputs.col_A` | PREXC UACS for Projects/Activities | text | Input or mapped existing data; office responsibility configurable |
| `bp-d.csoInputs.col_B` | Projects and Activities | text | Input or mapped existing data; office responsibility configurable |
| `bp-d.csoInputs.col_C` | Account Code for Location | text | Input or mapped existing data; office responsibility configurable |
| `bp-d.csoInputs.col_D` | Statement of Inputs from CSOs / On-going | text | Input or mapped existing data; office responsibility configurable |
| `bp-d.csoInputs.col_E` | Statement of Inputs from CSOs / New Spending / Expansion | text | Input or mapped existing data; office responsibility configurable |
| `bp-d.csoInputs.col_F` | Amount Included in the Agency Budget | currency | Input or mapped existing data; office responsibility configurable |
| `bp-d.csoInputs.col_G` | Explanations | textarea | Input or mapped existing data; office responsibility configurable |
| `bp-d.csoInputs.col_H` | Remarks/ACO/ SUC Feedback | textarea | Input or mapped existing data; office responsibility configurable |

Reference notes and unresolved details:

- `BP D!A33` (workbook-reference): DBM-OSEC submitted this form with no entries (status NOT APPLICABLE), so there are no sample rows.

## BP FORM 100 — Statement of Revenues (General Fund)


### General fund revenues

Reference: `BP 100!A14:K17`. Repeatable records; headings are output labels.

| Stable column ID | Heading path | Type | Treatment |
| --- | --- | --- | --- |
| `bp-100.revenues.col_A` | SOURCE OF REVENUE | text | Input or mapped existing data; office responsibility configurable |
| `bp-100.revenues.col_B` | DESCRIPTION SOURCE OF REVENUE | text | Input or mapped existing data; office responsibility configurable |
| `bp-100.revenues.col_C` | OBJECT CODE | text | Input or mapped existing data; office responsibility configurable |
| `bp-100.revenues.col_D` | LEGAL BASIS | text | Input or mapped existing data; office responsibility configurable |
| `bp-100.revenues.col_E` | AMOUNT IN P'000 / 2025 / ESTIMATE | currency | Input or mapped existing data; office responsibility configurable |
| `bp-100.revenues.col_F` | AMOUNT IN P'000 / 2025 / ACTUAL | currency | Input or mapped existing data; office responsibility configurable |
| `bp-100.revenues.col_G` | AMOUNT IN P'000 / 2026 / PROGRAM | currency | Input or mapped existing data; office responsibility configurable |
| `bp-100.revenues.col_H` | AMOUNT IN P'000 / 2027 / PROPOSED | currency | Input or mapped existing data; office responsibility configurable |
| `bp-100.revenues.col_I` | AMOUNT IN P'000 / 2028 / PROJECTIONS | currency | Input or mapped existing data; office responsibility configurable |
| `bp-100.revenues.col_J` | AMOUNT IN P'000 / 2029 / PROJECTIONS | currency | Input or mapped existing data; office responsibility configurable |
| `bp-100.revenues.col_K` | REMARKS | textarea | Input or mapped existing data; office responsibility configurable |

Reference notes and unresolved details:

- `BP 100!A37` (workbook-reference): NOTE: The information reflected in this table shall be evaluated by the DBM for inclusion in Table C of the BESF.
- `BP 100!A38` (workbook-reference): Rows grouped Free Portion / Earmarked Portion > Tax Revenue / Non-Tax Revenue > individual revenue items.

## BP FORM 100-A — Statement of Revenues and Expenditures (Earmarked Revenues)


### Earmarked revenues and expenditure

Reference: `BP 100-A!A14:Q17`. Repeatable records; headings are output labels.

| Stable column ID | Heading path | Type | Treatment |
| --- | --- | --- | --- |
| `bp-100-a.earmarked.col_A` | CATEGORY | text | Input or mapped existing data; office responsibility configurable |
| `bp-100-a.earmarked.col_B` | DESCRIPTION SOURCE OF REVENUE | text | Input or mapped existing data; office responsibility configurable |
| `bp-100-a.earmarked.col_C` | UACS OBJECT CODE | text | Input or mapped existing data; office responsibility configurable |
| `bp-100-a.earmarked.col_D` | LEGAL BASIS | text | Input or mapped existing data; office responsibility configurable |
| `bp-100-a.earmarked.col_E` | NATURE OF EXPENDITURES | text | Input or mapped existing data; office responsibility configurable |
| `bp-100-a.earmarked.col_F` | FUND BALANCE as of DEC. 31, 2025 | currency | Input or mapped existing data; office responsibility configurable |
| `bp-100-a.earmarked.col_G` | AMOUNT IN P'000 / 2025 ACTUAL / Revenue | currency | Input or mapped existing data; office responsibility configurable |
| `bp-100-a.earmarked.col_H` | AMOUNT IN P'000 / 2025 ACTUAL / Expenditure | currency | Input or mapped existing data; office responsibility configurable |
| `bp-100-a.earmarked.col_I` | AMOUNT IN P'000 / 2026 PROGRAM / Revenue | currency | Input or mapped existing data; office responsibility configurable |
| `bp-100-a.earmarked.col_J` | AMOUNT IN P'000 / 2026 PROGRAM / Expenditure | currency | Input or mapped existing data; office responsibility configurable |
| `bp-100-a.earmarked.col_K` | AMOUNT IN P'000 / 2027 PROPOSED / Revenue | currency | Input or mapped existing data; office responsibility configurable |
| `bp-100-a.earmarked.col_L` | AMOUNT IN P'000 / 2027 PROPOSED / Expenditure | currency | Input or mapped existing data; office responsibility configurable |
| `bp-100-a.earmarked.col_M` | AMOUNT IN P'000 / 2028 PROJECTIONS / Revenue | currency | Input or mapped existing data; office responsibility configurable |
| `bp-100-a.earmarked.col_N` | AMOUNT IN P'000 / 2028 PROJECTIONS / Expenditure | currency | Input or mapped existing data; office responsibility configurable |
| `bp-100-a.earmarked.col_O` | AMOUNT IN P'000 / 2029 PROJECTIONS / Revenue | currency | Input or mapped existing data; office responsibility configurable |
| `bp-100-a.earmarked.col_P` | AMOUNT IN P'000 / 2029 PROJECTIONS / Expenditure | currency | Input or mapped existing data; office responsibility configurable |
| `bp-100-a.earmarked.col_Q` | REMARKS | textarea | Input or mapped existing data; office responsibility configurable |

Reference notes and unresolved details:

- `BP 100-A!A35` (workbook-reference): NOTE: The information reflected in this table shall be evaluated by the DBM for inclusion in Table C of the BESF.

## BP FORM 100-B — Statement of Other Receipts/Expenditures (Off-Budgetary and Custodial Funds)


### Off-budgetary and custodial funds

Reference: `BP 100-B!A14:M17`. Repeatable records; headings are output labels.

| Stable column ID | Heading path | Type | Treatment |
| --- | --- | --- | --- |
| `bp-100-b.receipts.col_A` | NATURE OF RECEIPTS | text | Input or mapped existing data; office responsibility configurable |
| `bp-100-b.receipts.col_B` | FUNDING SOURCE CODE | text | Input or mapped existing data; office responsibility configurable |
| `bp-100-b.receipts.col_C` | SOURCE OF REVENUE | text | Input or mapped existing data; office responsibility configurable |
| `bp-100-b.receipts.col_D` | LEGAL BASIS | text | Input or mapped existing data; office responsibility configurable |
| `bp-100-b.receipts.col_E` | NATURE OF EXPENDITURES | text | Input or mapped existing data; office responsibility configurable |
| `bp-100-b.receipts.col_F` | CASH BALANCE as of Dec. 31, 2025 * | currency | Input or mapped existing data; office responsibility configurable |
| `bp-100-b.receipts.col_G` | AMOUNT IN P'000 / 2025 ACTUAL / Receipt | currency | Input or mapped existing data; office responsibility configurable |
| `bp-100-b.receipts.col_H` | AMOUNT IN P'000 / 2025 ACTUAL / Expenditure | currency | Input or mapped existing data; office responsibility configurable |
| `bp-100-b.receipts.col_I` | AMOUNT IN P'000 / 2026 PROGRAM / Receipt | currency | Input or mapped existing data; office responsibility configurable |
| `bp-100-b.receipts.col_J` | AMOUNT IN P'000 / 2026 PROGRAM / Expenditure | currency | Input or mapped existing data; office responsibility configurable |
| `bp-100-b.receipts.col_K` | AMOUNT IN P'000 / 2027 PROPOSED / Receipt | currency | Input or mapped existing data; office responsibility configurable |
| `bp-100-b.receipts.col_L` | AMOUNT IN P'000 / 2027 PROPOSED / Expenditure | currency | Input or mapped existing data; office responsibility configurable |
| `bp-100-b.receipts.col_M` | REMARKS | textarea | Input or mapped existing data; office responsibility configurable |

Reference notes and unresolved details:

- `BP 100-B!A33` (workbook-reference): NOTE: The information reflected in this table shall be evaluated and consolidated by the DBM for inclusion in Table B of the BESF.
- `BP 100-B!A34` (workbook-reference): * Cash Balance as of Dec. 31, 2025 shall be equivalent to the Cash Balance as of December 31, 2024 plus 2025 Actual Receipt minus 2025 Actual Expenditure.
- `BP 100-B!A35` (workbook-reference): The Remarks column is numbered (17) on the official form (it follows (12)); this is kept as printed.
- `BP 100-B!A36` (workbook-reference): DBM-OSEC submitted this form with zero totals (status NOT APPLICABLE), so there are no sample rows.

## BP FORM 100-C — Statement of Donations and Grants (In Cash or In Kind)


### Donations and grants

Reference: `BP 100-C!A13:M16`. Repeatable records; headings are output labels.

| Stable column ID | Heading path | Type | Treatment |
| --- | --- | --- | --- |
| `bp-100-c.donations.col_A` | NATURE OF RECEIPTS | text | Input or mapped existing data; office responsibility configurable |
| `bp-100-c.donations.col_B` | UACS FUNDING SOURCE CODE | text | Input or mapped existing data; office responsibility configurable |
| `bp-100-c.donations.col_C` | TERM (i.e. implementation period in years) | text | Input or mapped existing data; office responsibility configurable |
| `bp-100-c.donations.col_D` | LEGAL BASIS | text | Input or mapped existing data; office responsibility configurable |
| `bp-100-c.donations.col_E` | NATURE OF EXPENDITURES | text | Input or mapped existing data; office responsibility configurable |
| `bp-100-c.donations.col_F` | CASH BALANCE as of DEC. 31, 2025 * | currency | Input or mapped existing data; office responsibility configurable |
| `bp-100-c.donations.col_G` | AMOUNT IN P'000 / 2025 ACTUAL / Receipt | currency | Input or mapped existing data; office responsibility configurable |
| `bp-100-c.donations.col_H` | AMOUNT IN P'000 / 2025 ACTUAL / Expenditure | currency | Input or mapped existing data; office responsibility configurable |
| `bp-100-c.donations.col_I` | AMOUNT IN P'000 / 2026 PROGRAM / Receipt | currency | Input or mapped existing data; office responsibility configurable |
| `bp-100-c.donations.col_J` | AMOUNT IN P'000 / 2026 PROGRAM / Expenditure | currency | Input or mapped existing data; office responsibility configurable |
| `bp-100-c.donations.col_K` | AMOUNT IN P'000 / 2027 PROPOSED / Receipt | currency | Input or mapped existing data; office responsibility configurable |
| `bp-100-c.donations.col_L` | AMOUNT IN P'000 / 2027 PROPOSED / Expenditure | currency | Input or mapped existing data; office responsibility configurable |
| `bp-100-c.donations.col_M` | REMARKS | textarea | Input or mapped existing data; office responsibility configurable |

Reference notes and unresolved details:

- `BP 100-C!A32` (workbook-reference): NOTE: The information reflected in this table shall be evaluated and consolidated by the DBM for inclusion in Table B of the BESF.
- `BP 100-C!A33` (workbook-reference): * Cash Balance as of Dec. 31, 2025 shall be equivalent to the Cash Balance as of December 31, 2024 plus 2025 Actual Receipt minus 2025 Actual Expenditure.
- `BP 100-C!A34` (workbook-reference): DBM-OSEC submitted this form with no entries (status NOT APPLICABLE), so there are no sample rows.

## BP FORM 200 — Comparison of Appropriations and Obligations


### Appropriations and obligations

Reference: `BP 200!A12:D14`. Repeatable records; headings are output labels.

| Stable column ID | Heading path | Type | Treatment |
| --- | --- | --- | --- |
| `bp-200.appropriations.col_A` | PARTICULARS | text | Input or mapped existing data; office responsibility configurable |
| `bp-200.appropriations.col_B` | AMOUNT IN P'000 / 2025 ACTUAL | currency | Input or mapped existing data; office responsibility configurable |
| `bp-200.appropriations.col_C` | AMOUNT IN P'000 / 2026 CURRENT | currency | Input or mapped existing data; office responsibility configurable |
| `bp-200.appropriations.col_D` | AMOUNT IN P'000 / 2027 PROPOSED | currency | Input or mapped existing data; office responsibility configurable |

Reference notes and unresolved details:

- `BP 200!A44` (workbook-reference): Rows are grouped by appropriation type (New General, Continuing, Automatic, Unprogrammed), then budget item, then region, then operating unit.
- `BP 200!A45` (workbook-reference): Sample rows are from DBM-OSEC's submission (DBM-OSEC TOTAL OBLIGATION: 2,969,424 / 3,382,943 / 5,485,918). The '...' row marks regions left out here.
- `BP 200!A46` (workbook-reference): This report was generated using the Online Submission of Budget Proposal (OSBP).

## BP FORM 201-A — Obligations for Personnel Services (PS)


### Personnel services by object

Reference: `BP 201-A!A15:Y16`. Repeatable records; headings are output labels.

| Stable column ID | Heading path | Type | Treatment |
| --- | --- | --- | --- |
| `bp-201-a.personnel.col_A` | Cost Structure/Programs/Activities/Projects / Appropriation | text | Input or mapped existing data; office responsibility configurable |
| `bp-201-a.personnel.col_B` | Cost Structure/Programs/Activities/Projects / UACS Code | text | Input or mapped existing data; office responsibility configurable |
| `bp-201-a.personnel.col_C` | Cost Structure/Programs/Activities/Projects / Cost Structure / P/A/P | text | Input or mapped existing data; office responsibility configurable |
| `bp-201-a.personnel.col_D` | Operating Unit | text | Input or mapped existing data; office responsibility configurable |
| `bp-201-a.personnel.col_E` | Salaries and Wages - Regular / Basic Salary - Civilian | currency | Input or mapped existing data; office responsibility configurable |
| `bp-201-a.personnel.col_F` | Salaries and Wages - Casual/ Contractual | currency | Input or mapped existing data; office responsibility configurable |
| `bp-201-a.personnel.col_G` | Personal Economic Relief Allowance (PERA) / PERA - Civilian | currency | Input or mapped existing data; office responsibility configurable |
| `bp-201-a.personnel.col_H` | Representation Allowance (RA) | currency | Input or mapped existing data; office responsibility configurable |
| `bp-201-a.personnel.col_I` | Transportation Allowance (TA) | currency | Input or mapped existing data; office responsibility configurable |
| `bp-201-a.personnel.col_J` | Clothing/ Uniform Allowance / Clothing/ Uniform Allowance - Civilian | currency | Input or mapped existing data; office responsibility configurable |
| `bp-201-a.personnel.col_K` | Honoraria / Honoraria - Civilian | currency | Input or mapped existing data; office responsibility configurable |
| `bp-201-a.personnel.col_L` | Year End Bonus / Bonus - Civilian | currency | Input or mapped existing data; office responsibility configurable |
| `bp-201-a.personnel.col_M` | Cash Gift / Cash Gift - Civilian | currency | Input or mapped existing data; office responsibility configurable |
| `bp-201-a.personnel.col_N` | Mid-Year Bonus - Civilian | currency | Input or mapped existing data; office responsibility configurable |
| `bp-201-a.personnel.col_O` | Other Bonuses and Allowances / Productivity Enhancement Incentive - Civilian | currency | Input or mapped existing data; office responsibility configurable |
| `bp-201-a.personnel.col_P` | Other Bonuses and Allowances / Medical Allowance | currency | Input or mapped existing data; office responsibility configurable |
| `bp-201-a.personnel.col_Q` | Retirement and Life Insurance Premiums | currency | Input or mapped existing data; office responsibility configurable |
| `bp-201-a.personnel.col_R` | Pag-IBIG Contributions / Pag-IBIG - Civilian | currency | Input or mapped existing data; office responsibility configurable |
| `bp-201-a.personnel.col_S` | PhilHealth Contributions / PhilHealth - Civilian | currency | Input or mapped existing data; office responsibility configurable |
| `bp-201-a.personnel.col_T` | Employees Compensation Insurance Premiums (ECIP) / ECIP - Civilian | currency | Input or mapped existing data; office responsibility configurable |
| `bp-201-a.personnel.col_U` | Terminal Leave Benefits / Terminal Leave Benefits - Civilian | currency | Input or mapped existing data; office responsibility configurable |
| `bp-201-a.personnel.col_V` | Other Personnel Benefits / Lump-sum for Step Increments - Length of Service | currency | Input or mapped existing data; office responsibility configurable |
| `bp-201-a.personnel.col_W` | Other Personnel Benefits / Loyalty Award - Civilian | currency | Input or mapped existing data; office responsibility configurable |
| `bp-201-a.personnel.col_X` | Other Personnel Benefits | currency | Input or mapped existing data; office responsibility configurable |
| `bp-201-a.personnel.col_Y` | TOTAL | currency | Calculated/output only; formula needs a verified operand mapping |

Reference notes and unresolved details:

- `BP 201-A!A29` (workbook-reference): DBM's FY2027 PDF prints this as 'BP Form 201 - Agency Request - PS'. A separate set is prepared for each Tier (Tier 1 / Tier 2).
- `BP 201-A!A30` (workbook-reference): Rows: appropriation type > cost structure / program / activity / project (with UACS code) > one row per operating unit.
- `BP 201-A!A31` (workbook-reference): The two header rows are the object-of-expenditure group and the detailed object code, as printed. TOTAL is a SUM formula.
- `BP 201-A!A32` (requires-confirmation): The object-code columns are the ones in DBM-OSEC's submission. Another agency's OSBP print-out may show a different set.

## BP FORM 201-B — Obligations for Maintenance and Other Operating Expenses (MOOE)


### MOOE by object

Reference: `BP 201-B!A15:BH16`. Repeatable records; headings are output labels.

| Stable column ID | Heading path | Type | Treatment |
| --- | --- | --- | --- |
| `bp-201-b.maintenance.col_A` | Cost Structure/Programs/Activities/Projects / Appropriation | text | Input or mapped existing data; office responsibility configurable |
| `bp-201-b.maintenance.col_B` | Cost Structure/Programs/Activities/Projects / Cost Structure / P/A/P | text | Input or mapped existing data; office responsibility configurable |
| `bp-201-b.maintenance.col_C` | Region | text | Input or mapped existing data; office responsibility configurable |
| `bp-201-b.maintenance.col_D` | Traveling Expenses - Local | currency | Input or mapped existing data; office responsibility configurable |
| `bp-201-b.maintenance.col_E` | Traveling Expenses - Foreign | currency | Input or mapped existing data; office responsibility configurable |
| `bp-201-b.maintenance.col_F` | Training Expenses | currency | Input or mapped existing data; office responsibility configurable |
| `bp-201-b.maintenance.col_G` | Scholarship Grants/ Expenses | currency | Input or mapped existing data; office responsibility configurable |
| `bp-201-b.maintenance.col_H` | Office Supplies Expenses | currency | Input or mapped existing data; office responsibility configurable |
| `bp-201-b.maintenance.col_I` | Accountable Forms Expenses | currency | Input or mapped existing data; office responsibility configurable |
| `bp-201-b.maintenance.col_J` | Fuel, Oil and Lubricants Expenses | currency | Input or mapped existing data; office responsibility configurable |
| `bp-201-b.maintenance.col_K` | Semi-Expendable Machinery and Equipment Expenses / Office Equipment | currency | Input or mapped existing data; office responsibility configurable |
| `bp-201-b.maintenance.col_L` | Semi-Expendable Machinery and Equipment Expenses / Information and Communications Technology Equipment | currency | Input or mapped existing data; office responsibility configurable |
| `bp-201-b.maintenance.col_M` | Semi-Expendable Machinery and Equipment Expenses / Communications Equipment | currency | Input or mapped existing data; office responsibility configurable |
| `bp-201-b.maintenance.col_N` | Semi-Expendable Machinery and Equipment Expenses / Sports Equipment | currency | Input or mapped existing data; office responsibility configurable |
| `bp-201-b.maintenance.col_O` | Semi-Expendable Machinery and Equipment Expenses / Other Machinery and Equipment | currency | Input or mapped existing data; office responsibility configurable |
| `bp-201-b.maintenance.col_P` | Semi-Expendable Furniture, Fixtures and Books Expenses / Furniture and Fixtures | currency | Input or mapped existing data; office responsibility configurable |
| `bp-201-b.maintenance.col_Q` | Semi-Expendable Furniture, Fixtures and Books Expenses / Books | currency | Input or mapped existing data; office responsibility configurable |
| `bp-201-b.maintenance.col_R` | Other Supplies and Materials Expenses | currency | Input or mapped existing data; office responsibility configurable |
| `bp-201-b.maintenance.col_S` | Water Expenses | currency | Input or mapped existing data; office responsibility configurable |
| `bp-201-b.maintenance.col_T` | Electricity Expenses | currency | Input or mapped existing data; office responsibility configurable |
| `bp-201-b.maintenance.col_U` | Postage and Courier Services | currency | Input or mapped existing data; office responsibility configurable |
| `bp-201-b.maintenance.col_V` | Telephone Expenses / Mobile | currency | Input or mapped existing data; office responsibility configurable |
| `bp-201-b.maintenance.col_W` | Telephone Expenses / Landline | currency | Input or mapped existing data; office responsibility configurable |
| `bp-201-b.maintenance.col_X` | Internet Subscription Expenses | currency | Input or mapped existing data; office responsibility configurable |
| `bp-201-b.maintenance.col_Y` | Cable, Satellite, Telegraph and Radio Expenses | currency | Input or mapped existing data; office responsibility configurable |
| `bp-201-b.maintenance.col_Z` | Extraordinary and Miscellaneous Expenses | currency | Input or mapped existing data; office responsibility configurable |
| `bp-201-b.maintenance.col_AA` | Legal Services | currency | Input or mapped existing data; office responsibility configurable |
| `bp-201-b.maintenance.col_AB` | Auditing Services | currency | Input or mapped existing data; office responsibility configurable |
| `bp-201-b.maintenance.col_AC` | Consultancy Services / ICT Consultancy Services | currency | Input or mapped existing data; office responsibility configurable |
| `bp-201-b.maintenance.col_AD` | Consultancy Services | currency | Input or mapped existing data; office responsibility configurable |
| `bp-201-b.maintenance.col_AE` | Other Professional Services | currency | Input or mapped existing data; office responsibility configurable |
| `bp-201-b.maintenance.col_AF` | Janitorial Services | currency | Input or mapped existing data; office responsibility configurable |
| `bp-201-b.maintenance.col_AG` | Security Services | currency | Input or mapped existing data; office responsibility configurable |
| `bp-201-b.maintenance.col_AH` | Other General Services | currency | Input or mapped existing data; office responsibility configurable |
| `bp-201-b.maintenance.col_AI` | Repairs and Maintenance - Land Improvements / Other Land Improvements | currency | Input or mapped existing data; office responsibility configurable |
| `bp-201-b.maintenance.col_AJ` | Repairs and Maintenance - Buildings and Other Structures / Buildings | currency | Input or mapped existing data; office responsibility configurable |
| `bp-201-b.maintenance.col_AK` | Repairs and Maintenance - Machinery and Equipment / Office Equipment | currency | Input or mapped existing data; office responsibility configurable |
| `bp-201-b.maintenance.col_AL` | Repairs and Maintenance - Machinery and Equipment / Information and Communication Technology Equipment | currency | Input or mapped existing data; office responsibility configurable |
| `bp-201-b.maintenance.col_AM` | Repairs and Maintenance - Machinery and Equipment / Disaster Response and Rescue Equipment | currency | Input or mapped existing data; office responsibility configurable |
| `bp-201-b.maintenance.col_AN` | Repairs and Maintenance - Machinery and Equipment / Military, Police and Security Equipment | currency | Input or mapped existing data; office responsibility configurable |
| `bp-201-b.maintenance.col_AO` | Repairs and Maintenance - Machinery and Equipment / Other Machinery and Equipment | currency | Input or mapped existing data; office responsibility configurable |
| `bp-201-b.maintenance.col_AP` | Repairs and Maintenance - Transportation Equipment / Motor Vehicles | currency | Input or mapped existing data; office responsibility configurable |
| `bp-201-b.maintenance.col_AQ` | Repairs and Maintenance - Furniture and Fixtures | currency | Input or mapped existing data; office responsibility configurable |
| `bp-201-b.maintenance.col_AR` | Repairs and Maintenance - Other Property, Plant and Equipment / Other Property, Plant and Equipment | currency | Input or mapped existing data; office responsibility configurable |
| `bp-201-b.maintenance.col_AS` | Taxes, Duties and Licenses | currency | Input or mapped existing data; office responsibility configurable |
| `bp-201-b.maintenance.col_AT` | Fidelity Bond Premiums | currency | Input or mapped existing data; office responsibility configurable |
| `bp-201-b.maintenance.col_AU` | Insurance Expenses | currency | Input or mapped existing data; office responsibility configurable |
| `bp-201-b.maintenance.col_AV` | Advertising Expenses | currency | Input or mapped existing data; office responsibility configurable |
| `bp-201-b.maintenance.col_AW` | Printing and Publication Expenses | currency | Input or mapped existing data; office responsibility configurable |
| `bp-201-b.maintenance.col_AX` | Representation Expenses | currency | Input or mapped existing data; office responsibility configurable |
| `bp-201-b.maintenance.col_AY` | Transportation and Delivery Expenses | currency | Input or mapped existing data; office responsibility configurable |
| `bp-201-b.maintenance.col_AZ` | Rent/Lease Expenses / Rents - Building and Structures | currency | Input or mapped existing data; office responsibility configurable |
| `bp-201-b.maintenance.col_BA` | Rent/Lease Expenses / Rents - Equipment | currency | Input or mapped existing data; office responsibility configurable |
| `bp-201-b.maintenance.col_BB` | Membership Dues and Contributions to Organizations | currency | Input or mapped existing data; office responsibility configurable |
| `bp-201-b.maintenance.col_BC` | Subscription Expenses / ICT Software Subscription | currency | Input or mapped existing data; office responsibility configurable |
| `bp-201-b.maintenance.col_BD` | Subscription Expenses / Library and Other Reading Materials Subscription Expenses | currency | Input or mapped existing data; office responsibility configurable |
| `bp-201-b.maintenance.col_BE` | Subscription Expenses / Other Subscription Expenses | currency | Input or mapped existing data; office responsibility configurable |
| `bp-201-b.maintenance.col_BF` | Bank Transaction Fee | currency | Input or mapped existing data; office responsibility configurable |
| `bp-201-b.maintenance.col_BG` | Other Maintenance and Operating Expenses | currency | Input or mapped existing data; office responsibility configurable |
| `bp-201-b.maintenance.col_BH` | TOTAL | currency | Calculated/output only; formula needs a verified operand mapping |

Reference notes and unresolved details:

- `BP 201-B!A29` (workbook-reference): DBM's FY2027 PDF prints this as 'BP Form 201 - Agency Request - MOOE'. Because it is so wide it is printed in 5 column sets (Page x of 20, then Continuation I-IV). Here they are joined into one row.
- `BP 201-B!A30` (workbook-reference): Sample values cover only the first 11 object columns (column set 1); the other columns and TOTAL are left blank because they come from the continuation pages.
- `BP 201-B!A31` (requires-confirmation): The object-code columns are the ones in DBM-OSEC's submission. Another agency's OSBP print-out may show a different set.

## BP FORM 201-C — Obligations for Financial Expenses (FinEx)


### Financial expenses — layout pending verification

Reference: `BP 201-C!A13:F14`. Repeatable records; headings are output labels.

| Stable column ID | Heading path | Type | Treatment |
| --- | --- | --- | --- |
| `bp-201-c.financial.col_A` | Cost Structure/Programs/Activities/Projects / Appropriation | text | Input or mapped existing data; office responsibility configurable |
| `bp-201-c.financial.col_B` | Cost Structure/Programs/Activities/Projects / UACS Code | text | Input or mapped existing data; office responsibility configurable |
| `bp-201-c.financial.col_C` | Cost Structure/Programs/Activities/Projects / Cost Structure / P/A/P | text | Input or mapped existing data; office responsibility configurable |
| `bp-201-c.financial.col_D` | Region / Operating Unit | text | Input or mapped existing data; office responsibility configurable |
| `bp-201-c.financial.col_E` | Financial Expenses (one column per FinEx object code) | currency | Input or mapped existing data; office responsibility configurable |
| `bp-201-c.financial.col_F` | TOTAL | currency | Calculated/output only; formula needs a verified operand mapping |

Reference notes and unresolved details:

- `BP 201-C!A34` (workbook-reference): DBM's FY2027 PDF prints this as 'BP Form 201 - Agency Request - FinEx'. DBM-OSEC has no FinEx, so its copy shows only Tier 1 / Tier 2 / Total sections marked NOT APPLICABLE.
- `BP 201-C!A35` (requires-confirmation): ASSUMED LAYOUT: the column layout is not shown in DBM's copy. The columns here copy the other BP 201 forms (rows by P/A/P and operating unit, one column per object code, then TOTAL). Check this against a filled-in FinEx form.

## BP FORM 201-D — Obligations for Capital Outlays (CO)


### Capital outlays by object

Reference: `BP 201-D!A15:Q16`. Repeatable records; headings are output labels.

| Stable column ID | Heading path | Type | Treatment |
| --- | --- | --- | --- |
| `bp-201-d.capital.col_A` | Cost Structure/Programs/Activities/Projects / Appropriation | text | Input or mapped existing data; office responsibility configurable |
| `bp-201-d.capital.col_B` | Cost Structure/Programs/Activities/Projects / UACS Code | text | Input or mapped existing data; office responsibility configurable |
| `bp-201-d.capital.col_C` | Cost Structure/Programs/Activities/Projects / Cost Structure / P/A/P | text | Input or mapped existing data; office responsibility configurable |
| `bp-201-d.capital.col_D` | Region | text | Input or mapped existing data; office responsibility configurable |
| `bp-201-d.capital.col_E` | Infrastructure Outlay / Power Supply Systems | currency | Input or mapped existing data; office responsibility configurable |
| `bp-201-d.capital.col_F` | Buildings and Other Structures / Buildings | currency | Input or mapped existing data; office responsibility configurable |
| `bp-201-d.capital.col_G` | Buildings and Other Structures / Other Structures | currency | Input or mapped existing data; office responsibility configurable |
| `bp-201-d.capital.col_H` | Machinery and Equipment Outlay / Office Equipment | currency | Input or mapped existing data; office responsibility configurable |
| `bp-201-d.capital.col_I` | Machinery and Equipment Outlay / Information and Communication Technology Equipment | currency | Input or mapped existing data; office responsibility configurable |
| `bp-201-d.capital.col_J` | Machinery and Equipment Outlay / Communication Equipment | currency | Input or mapped existing data; office responsibility configurable |
| `bp-201-d.capital.col_K` | Machinery and Equipment Outlay / Sports Equipment | currency | Input or mapped existing data; office responsibility configurable |
| `bp-201-d.capital.col_L` | Machinery and Equipment Outlay / Other Machinery and Equipment | currency | Input or mapped existing data; office responsibility configurable |
| `bp-201-d.capital.col_M` | Transportation Equipment Outlay / Motor Vehicles | currency | Input or mapped existing data; office responsibility configurable |
| `bp-201-d.capital.col_N` | Furniture, Fixtures and Books Outlay / Furniture and Fixtures | currency | Input or mapped existing data; office responsibility configurable |
| `bp-201-d.capital.col_O` | Other Property Plant and Equipment Outlay / Other Property, Plant and Equipment | currency | Input or mapped existing data; office responsibility configurable |
| `bp-201-d.capital.col_P` | Computer Software | currency | Input or mapped existing data; office responsibility configurable |
| `bp-201-d.capital.col_Q` | TOTAL | currency | Calculated/output only; formula needs a verified operand mapping |

Reference notes and unresolved details:

- `BP 201-D!A30` (workbook-reference): DBM's FY2027 PDF prints this as 'BP Form 201 - Agency Request - CO'. It is printed in 2 column sets (Infrastructure to Machinery, then Transportation to TOTAL). Here they are joined into one row. A separate set is prepared for each Tier.
- `BP 201-D!A31` (workbook-reference): Sample rows are from DBM-OSEC's Tier 2 request (DBM-OSEC Tier 2 Grand Total: 625,864). TOTAL is a SUM formula.
- `BP 201-D!A32` (requires-confirmation): The object-code columns are the ones in DBM-OSEC's submission. Another agency's OSBP print-out may show a different set.

## BP FORM 201-E — Summary of Outyear Requirements


### Outyear requirements by year and tier

Reference: `BP 201-E!A13:X17`. Repeatable records; headings are output labels.

| Stable column ID | Heading path | Type | Treatment |
| --- | --- | --- | --- |
| `bp-201-e.outyears.col_A` | Code Structure/Programs/ Activities/Projects | text | Input or mapped existing data; office responsibility configurable |
| `bp-201-e.outyears.col_B` | Key Program Code(s) | text | Input or mapped existing data; office responsibility configurable |
| `bp-201-e.outyears.col_C` | Multi-Year Requirements For FY 2027 Proposals / 2028 / Tier 1 / PS | currency | Input or mapped existing data; office responsibility configurable |
| `bp-201-e.outyears.col_D` | Multi-Year Requirements For FY 2027 Proposals / 2028 / Tier 1 / MOOE | currency | Input or mapped existing data; office responsibility configurable |
| `bp-201-e.outyears.col_E` | Multi-Year Requirements For FY 2027 Proposals / 2028 / Tier 1 / FINEX | currency | Input or mapped existing data; office responsibility configurable |
| `bp-201-e.outyears.col_F` | Multi-Year Requirements For FY 2027 Proposals / 2028 / Tier 1 / CO | currency | Input or mapped existing data; office responsibility configurable |
| `bp-201-e.outyears.col_G` | Multi-Year Requirements For FY 2027 Proposals / 2028 / Tier 1 / TOTAL | currency | Calculated/output only; formula needs a verified operand mapping |
| `bp-201-e.outyears.col_H` | Multi-Year Requirements For FY 2027 Proposals / 2028 / Impact of 2027 Tier 2 / PS | currency | Input or mapped existing data; office responsibility configurable |
| `bp-201-e.outyears.col_I` | Multi-Year Requirements For FY 2027 Proposals / 2028 / Impact of 2027 Tier 2 / MOOE | currency | Input or mapped existing data; office responsibility configurable |
| `bp-201-e.outyears.col_J` | Multi-Year Requirements For FY 2027 Proposals / 2028 / Impact of 2027 Tier 2 / FINEX | currency | Input or mapped existing data; office responsibility configurable |
| `bp-201-e.outyears.col_K` | Multi-Year Requirements For FY 2027 Proposals / 2028 / Impact of 2027 Tier 2 / CO | currency | Input or mapped existing data; office responsibility configurable |
| `bp-201-e.outyears.col_L` | Multi-Year Requirements For FY 2027 Proposals / 2028 / Impact of 2027 Tier 2 / TOTAL | currency | Calculated/output only; formula needs a verified operand mapping |
| `bp-201-e.outyears.col_M` | Multi-Year Requirements For FY 2027 Proposals / 2028 / TOTAL 2028 Requirements | currency | Calculated/output only; formula needs a verified operand mapping |
| `bp-201-e.outyears.col_N` | Multi-Year Requirements For FY 2027 Proposals / 2029 / Tier 1 / PS | currency | Input or mapped existing data; office responsibility configurable |
| `bp-201-e.outyears.col_O` | Multi-Year Requirements For FY 2027 Proposals / 2029 / Tier 1 / MOOE | currency | Input or mapped existing data; office responsibility configurable |
| `bp-201-e.outyears.col_P` | Multi-Year Requirements For FY 2027 Proposals / 2029 / Tier 1 / FINEX | currency | Input or mapped existing data; office responsibility configurable |
| `bp-201-e.outyears.col_Q` | Multi-Year Requirements For FY 2027 Proposals / 2029 / Tier 1 / CO | currency | Input or mapped existing data; office responsibility configurable |
| `bp-201-e.outyears.col_R` | Multi-Year Requirements For FY 2027 Proposals / 2029 / Tier 1 / TOTAL | currency | Calculated/output only; formula needs a verified operand mapping |
| `bp-201-e.outyears.col_S` | Multi-Year Requirements For FY 2027 Proposals / 2029 / Impact of 2027 Tier 2 / PS | currency | Input or mapped existing data; office responsibility configurable |
| `bp-201-e.outyears.col_T` | Multi-Year Requirements For FY 2027 Proposals / 2029 / Impact of 2027 Tier 2 / MOOE | currency | Input or mapped existing data; office responsibility configurable |
| `bp-201-e.outyears.col_U` | Multi-Year Requirements For FY 2027 Proposals / 2029 / Impact of 2027 Tier 2 / FINEX | currency | Input or mapped existing data; office responsibility configurable |
| `bp-201-e.outyears.col_V` | Multi-Year Requirements For FY 2027 Proposals / 2029 / Impact of 2027 Tier 2 / CO | currency | Input or mapped existing data; office responsibility configurable |
| `bp-201-e.outyears.col_W` | Multi-Year Requirements For FY 2027 Proposals / 2029 / Impact of 2027 Tier 2 / TOTAL | currency | Calculated/output only; formula needs a verified operand mapping |
| `bp-201-e.outyears.col_X` | Multi-Year Requirements For FY 2027 Proposals / 2029 / TOTAL 2029 Requirements | currency | Calculated/output only; formula needs a verified operand mapping |

Reference notes and unresolved details:

- `BP 201-E!A35` (workbook-reference): Columns (7), (12), (18) and (23) are subtotals; (13) = (7) + (12) and (24) = (18) + (23).
- `BP 201-E!A36` (workbook-reference): This report was generated using the Online Submission of Budget Proposal (OSBP).

## BP FORM 202 — Profile for Tier 2 Budget Proposals


### 13.1 P/A/P attribution by expense class

Reference: `BP 202!A36:F37`. Repeatable records; headings are output labels.

| Stable column ID | Heading path | Type | Treatment |
| --- | --- | --- | --- |
| `bp-202.papFunding.col_A` | PAP (A) | text | Input or mapped existing data; office responsibility configurable |
| `bp-202.papFunding.col_B` | FY 2027 (B) / TIER 1 | currency | Input or mapped existing data; office responsibility configurable |
| `bp-202.papFunding.col_C` | FY 2027 (B) / TIER 2 | currency | Input or mapped existing data; office responsibility configurable |
| `bp-202.papFunding.col_D` | FY 2027 (B) / TOTAL | currency | Calculated/output only; formula needs a verified operand mapping |
| `bp-202.papFunding.col_E` | FY 2028 TIER 1 (C) | currency | Input or mapped existing data; office responsibility configurable |
| `bp-202.papFunding.col_F` | FY 2029 TIER 1 (D) | currency | Input or mapped existing data; office responsibility configurable |

### 13.3 Total project cost

Reference: `BP 202!A56:B56`. Repeatable records; headings are output labels.

| Stable column ID | Heading path | Type | Treatment |
| --- | --- | --- | --- |
| `bp-202.projectCost.col_A` | Expense Class | text | Input or mapped existing data; office responsibility configurable |
| `bp-202.projectCost.col_B` | Total Project Cost | currency | Input or mapped existing data; office responsibility configurable |

### 13.4 Operating costs of infrastructure projects

Reference: `BP 202!A61:C61`. Repeatable records; headings are output labels.

| Stable column ID | Heading path | Type | Treatment |
| --- | --- | --- | --- |
| `bp-202.operatingCosts.col_A` | PAP (A) | text | Input or mapped existing data; office responsibility configurable |
| `bp-202.operatingCosts.col_B` | 2028 (B) | currency | Input or mapped existing data; office responsibility configurable |
| `bp-202.operatingCosts.col_C` | 2029 (C) | currency | Input or mapped existing data; office responsibility configurable |

### 13.5 Costing by components

Reference: `BP 202!A67:F67`. Repeatable records; headings are output labels.

| Stable column ID | Heading path | Type | Treatment |
| --- | --- | --- | --- |
| `bp-202.components.col_A` | Components (A) | text | Input or mapped existing data; office responsibility configurable |
| `bp-202.components.col_B` | PS (B) | currency | Input or mapped existing data; office responsibility configurable |
| `bp-202.components.col_C` | MOOE (C) | currency | Input or mapped existing data; office responsibility configurable |
| `bp-202.components.col_D` | CO (D) | currency | Input or mapped existing data; office responsibility configurable |
| `bp-202.components.col_E` | FINEX (E) | currency | Input or mapped existing data; office responsibility configurable |
| `bp-202.components.col_F` | TOTAL (F) | currency | Input or mapped existing data; office responsibility configurable |

### 13.6 Location of implementation

Reference: `BP 202!A72:F72`. Repeatable records; headings are output labels.

| Stable column ID | Heading path | Type | Treatment |
| --- | --- | --- | --- |
| `bp-202.locations.col_A` | Location (A) | text | Input or mapped existing data; office responsibility configurable |
| `bp-202.locations.col_B` | PS (B) | currency | Input or mapped existing data; office responsibility configurable |
| `bp-202.locations.col_C` | MOOE (C) | currency | Input or mapped existing data; office responsibility configurable |
| `bp-202.locations.col_D` | CO (D) | currency | Input or mapped existing data; office responsibility configurable |
| `bp-202.locations.col_E` | FINEX (E) | currency | Input or mapped existing data; office responsibility configurable |
| `bp-202.locations.col_F` | TOTAL (F) | currency | Input or mapped existing data; office responsibility configurable |

Profile inputs: `BP 202!A11` 1. Proposal/Project Name; `BP 202!A12` 2. Implementing Department / Agency; `BP 202!A13` 3. Priority Ranking No.; `BP 202!A14` 4. Categorization; `BP 202!A20` 5. DEPDev PIP Code:; `BP 202!A21` 6. Total Project Cost:; `BP 202!A24` 7. Total Proposal Cost:; `BP 202!A25` 8. Description:; `BP 202!A26` 9. Purpose:; `BP 202!A27` 10. Beneficiaries:; `BP 202!A28` 11. Implementation Period:.

Reference notes and unresolved details:

- `BP 202!A82` (workbook-reference): One profile is completed for each Tier 2 proposal. DBM's PDF has 110 pages of these, about 2 pages per proposal.
- `BP 202!A83` (workbook-reference): Item 12 is skipped in the official numbering (it goes from 11 to 13); this is kept as printed.
- `BP 202!A84` (workbook-reference): This report was generated using the Online Submission of Budget Proposal (OSBP).

## BP FORM 203 — Profile for Foreign-Assisted Projects


### 10.1 Project implementation schedule

Reference: `BP 203!A28:E29`. Repeatable records; headings are output labels.

| Stable column ID | Heading path | Type | Treatment |
| --- | --- | --- | --- |
| `bp-203.implementation.col_A` | Financial Target | text | Input or mapped existing data; office responsibility configurable |
| `bp-203.implementation.col_B` | LP / Imprest/Special Account/Working Fund | currency | Input or mapped existing data; office responsibility configurable |
| `bp-203.implementation.col_C` | Grant | currency | Input or mapped existing data; office responsibility configurable |
| `bp-203.implementation.col_D` | GOP | currency | Input or mapped existing data; office responsibility configurable |
| `bp-203.implementation.col_E` | TOTAL | currency | Calculated/output only; formula needs a verified operand mapping |

### 12.1 Total project cost

Reference: `BP 203!A35:E37`. Repeatable records; headings are output labels.

| Stable column ID | Heading path | Type | Treatment |
| --- | --- | --- | --- |
| `bp-203.projectCost.col_A` | Expense Class | text | Input or mapped existing data; office responsibility configurable |
| `bp-203.projectCost.col_B` | Total Project Cost / LP / Cash | currency | Input or mapped existing data; office responsibility configurable |
| `bp-203.projectCost.col_C` | Total Project Cost / LP / Non-Cash | currency | Input or mapped existing data; office responsibility configurable |
| `bp-203.projectCost.col_D` | Total Project Cost / GOP | currency | Input or mapped existing data; office responsibility configurable |
| `bp-203.projectCost.col_E` | Total Project Cost / TOTAL | currency | Calculated/output only; formula needs a verified operand mapping |

### 12.1.a Comparative budget levels

Reference: `BP 203!A42:H43`. Repeatable records; headings are output labels.

| Stable column ID | Heading path | Type | Treatment |
| --- | --- | --- | --- |
| `bp-203.comparative.col_A` | Expense Class | text | Input or mapped existing data; office responsibility configurable |
| `bp-203.comparative.col_B` | FY 2025 (ACTUAL) | currency | Input or mapped existing data; office responsibility configurable |
| `bp-203.comparative.col_C` | FY 2026 (GAA) | currency | Input or mapped existing data; office responsibility configurable |
| `bp-203.comparative.col_D` | FY 2027 (Proposed Year) / TIER 1 | currency | Input or mapped existing data; office responsibility configurable |
| `bp-203.comparative.col_E` | FY 2027 (Proposed Year) / TIER 2 | currency | Input or mapped existing data; office responsibility configurable |
| `bp-203.comparative.col_F` | FY 2027 (Proposed Year) / TOTAL | currency | Calculated/output only; formula needs a verified operand mapping |
| `bp-203.comparative.col_G` | FY 2028 | currency | Input or mapped existing data; office responsibility configurable |
| `bp-203.comparative.col_H` | FY 2029 | currency | Input or mapped existing data; office responsibility configurable |

### 12.2 Costing by components

Reference: `BP 203!A47:S49`. Repeatable records; headings are output labels.

| Stable column ID | Heading path | Type | Treatment |
| --- | --- | --- | --- |
| `bp-203.components.col_A` | Components | text | Input or mapped existing data; office responsibility configurable |
| `bp-203.components.col_B` | PS / LP / Cash | currency | Input or mapped existing data; office responsibility configurable |
| `bp-203.components.col_C` | PS / LP / Non-Cash | currency | Input or mapped existing data; office responsibility configurable |
| `bp-203.components.col_D` | PS / GOP | currency | Input or mapped existing data; office responsibility configurable |
| `bp-203.components.col_E` | PS / TOTAL | currency | Calculated/output only; formula needs a verified operand mapping |
| `bp-203.components.col_F` | MOOE / LP / Cash | currency | Input or mapped existing data; office responsibility configurable |
| `bp-203.components.col_G` | MOOE / LP / Non-Cash | currency | Input or mapped existing data; office responsibility configurable |
| `bp-203.components.col_H` | MOOE / GOP | currency | Input or mapped existing data; office responsibility configurable |
| `bp-203.components.col_I` | MOOE / TOTAL | currency | Calculated/output only; formula needs a verified operand mapping |
| `bp-203.components.col_J` | FINEX / LP / Cash | currency | Input or mapped existing data; office responsibility configurable |
| `bp-203.components.col_K` | FINEX / LP / Non-Cash | currency | Input or mapped existing data; office responsibility configurable |
| `bp-203.components.col_L` | CO / LP / Cash | currency | Input or mapped existing data; office responsibility configurable |
| `bp-203.components.col_M` | CO / LP / Non-Cash | currency | Input or mapped existing data; office responsibility configurable |
| `bp-203.components.col_N` | CO / GOP | currency | Input or mapped existing data; office responsibility configurable |
| `bp-203.components.col_O` | CO / TOTAL | currency | Calculated/output only; formula needs a verified operand mapping |
| `bp-203.components.col_P` | TOTAL / LP / Cash | currency | Input or mapped existing data; office responsibility configurable |
| `bp-203.components.col_Q` | TOTAL / LP / Non-Cash | currency | Input or mapped existing data; office responsibility configurable |
| `bp-203.components.col_R` | TOTAL / GOP | currency | Input or mapped existing data; office responsibility configurable |
| `bp-203.components.col_S` | TOTAL | currency | Calculated/output only; formula needs a verified operand mapping |

### 12.3 Physical targets

Reference: `BP 203!A54:S57`. Repeatable records; headings are output labels.

| Stable column ID | Heading path | Type | Treatment |
| --- | --- | --- | --- |
| `bp-203.physical.col_A` | Components | text | Input or mapped existing data; office responsibility configurable |
| `bp-203.physical.col_B` | Targets / PS / LP / Cash | text | Input or mapped existing data; office responsibility configurable |
| `bp-203.physical.col_C` | Targets / PS / LP / Non-Cash | text | Input or mapped existing data; office responsibility configurable |
| `bp-203.physical.col_D` | Targets / PS / GOP | text | Input or mapped existing data; office responsibility configurable |
| `bp-203.physical.col_E` | Targets / PS / TOTAL | text | Calculated/output only; formula needs a verified operand mapping |
| `bp-203.physical.col_F` | Targets / MOOE / LP / Cash | text | Input or mapped existing data; office responsibility configurable |
| `bp-203.physical.col_G` | Targets / MOOE / LP / Non-Cash | text | Input or mapped existing data; office responsibility configurable |
| `bp-203.physical.col_H` | Targets / MOOE / GOP | text | Input or mapped existing data; office responsibility configurable |
| `bp-203.physical.col_I` | Targets / MOOE / TOTAL | text | Calculated/output only; formula needs a verified operand mapping |
| `bp-203.physical.col_J` | Targets / FINEX / LP / Cash | text | Input or mapped existing data; office responsibility configurable |
| `bp-203.physical.col_K` | Targets / FINEX / LP / Non-Cash | text | Input or mapped existing data; office responsibility configurable |
| `bp-203.physical.col_L` | Targets / CO / LP / Cash | text | Input or mapped existing data; office responsibility configurable |
| `bp-203.physical.col_M` | Targets / CO / LP / Non-Cash | text | Input or mapped existing data; office responsibility configurable |
| `bp-203.physical.col_N` | Targets / CO / GOP | text | Input or mapped existing data; office responsibility configurable |
| `bp-203.physical.col_O` | Targets / CO / TOTAL | text | Calculated/output only; formula needs a verified operand mapping |
| `bp-203.physical.col_P` | Targets / Total / LP / Cash | text | Input or mapped existing data; office responsibility configurable |
| `bp-203.physical.col_Q` | Targets / Total / LP / Non-Cash | text | Input or mapped existing data; office responsibility configurable |
| `bp-203.physical.col_R` | Targets / Total / GOP | text | Input or mapped existing data; office responsibility configurable |
| `bp-203.physical.col_S` | Targets / Total / TOTAL | text | Calculated/output only; formula needs a verified operand mapping |

Profile inputs: `BP 203!A11` 1. Proposal/Project Name; `BP 203!A12` 2. Implementing Department / Agency; `BP 203!A13` 3. Priority Ranking No.; `BP 203!A14` 4. Categorization; `BP 203!A16` 5. DEPDev PIP Code:; `BP 203!A17` 6. Total Proposal Cost:; `BP 203!A18` 7. Description:; `BP 203!A19` 8. Purpose:; `BP 203!A20` 9. Beneficiaries:; `BP 203!A21` 10. Implementation Period:.

Reference notes and unresolved details:

- `BP 203!A62` (workbook-reference): Item 11 is skipped in the official numbering (it goes from 10.1 to 12); this is kept as printed.
- `BP 203!A63` (workbook-reference): In 12.2 and 12.3, DBM's print-out shows only LP Cash / Non-Cash under FINEX (no GOP or TOTAL columns); this is kept as printed.
- `BP 203!A64` (workbook-reference): LP = Loan Proceeds; GOP = Government of the Philippines (counterpart funding).
- `BP 203!A65` (workbook-reference): Signatories: Certified Correct (Chief Administrative Officer, Budget Division), Certified Correct (Accountant IV, Accounting Division), Recommending Approval (Chief Accountant), Approved by (Assistant Secretary, Internal Management Group).
- `BP 203!A66` (workbook-reference): This report was generated using the Online Submission of Budget Proposal (OSBP).

## BP FORM 204 — Staffing Summary of Non-Permanent Positions


### Staffing positions by tier and classification

Reference: `BP 204!A14:Y16`. Repeatable records; headings are output labels.

| Stable column ID | Heading path | Type | Treatment |
| --- | --- | --- | --- |
| `bp-204.positions.col_A` | PAP Attributions | text | Input or mapped existing data; office responsibility configurable |
| `bp-204.positions.col_B` | Organizational Unit | text | Input or mapped existing data; office responsibility configurable |
| `bp-204.positions.col_C` | Position Title | text | Input or mapped existing data; office responsibility configurable |
| `bp-204.positions.col_D` | Salary Grade | number | Input or mapped existing data; office responsibility configurable |
| `bp-204.positions.col_E` | No. of Positions | number | Input or mapped existing data; office responsibility configurable |
| `bp-204.positions.col_F` | No. of Months Employed/ To be Employed Per Position | number | Input or mapped existing data; office responsibility configurable |
| `bp-204.positions.col_G` | Total No. of Months Employed/ To be Employed | number | Calculated/output only; formula needs a verified operand mapping |
| `bp-204.positions.col_H` | Monthly Salary | currency | Input or mapped existing data; office responsibility configurable |
| `bp-204.positions.col_I` | Monthly Salary Floor and Ceiling | text | Input or mapped existing data; office responsibility configurable |
| `bp-204.positions.col_J` | Total Salary Based on Months Employed/ To be Employed | currency | Calculated/output only; formula needs a verified operand mapping |
| `bp-204.positions.col_K` | Other Compensation / PERA | currency | Input or mapped existing data; office responsibility configurable |
| `bp-204.positions.col_L` | Other Compensation / RATA | currency | Input or mapped existing data; office responsibility configurable |
| `bp-204.positions.col_M` | Other Compensation / Clothing/ Uniform Allowance | currency | Input or mapped existing data; office responsibility configurable |
| `bp-204.positions.col_N` | Other Compensation / Mid-Year Bonus | currency | Input or mapped existing data; office responsibility configurable |
| `bp-204.positions.col_O` | Other Compensation / Year-End Bonus | currency | Input or mapped existing data; office responsibility configurable |
| `bp-204.positions.col_P` | Other Compensation / Cash Gift | currency | Input or mapped existing data; office responsibility configurable |
| `bp-204.positions.col_Q` | Other Compensation / PEI | currency | Input or mapped existing data; office responsibility configurable |
| `bp-204.positions.col_R` | Other Compensation / RLIP | currency | Input or mapped existing data; office responsibility configurable |
| `bp-204.positions.col_S` | Other Compensation / Pag-IBIG | currency | Input or mapped existing data; office responsibility configurable |
| `bp-204.positions.col_T` | Other Compensation / ECIP | currency | Input or mapped existing data; office responsibility configurable |
| `bp-204.positions.col_U` | Other Compensation / PHIC | currency | Input or mapped existing data; office responsibility configurable |
| `bp-204.positions.col_V` | Other Compensation / Medical Allowance | currency | Input or mapped existing data; office responsibility configurable |
| `bp-204.positions.col_W` | Other Compensation / Compensation-Related Magna Carta Benefits | currency | Input or mapped existing data; office responsibility configurable |
| `bp-204.positions.col_X` | Other Compensation / Total Other Compensation (Total of Columns 9-21) | currency | Calculated/output only; formula needs a verified operand mapping |
| `bp-204.positions.col_Y` | Total Compensation | currency | Calculated/output only; formula needs a verified operand mapping |

Reference notes and unresolved details:

- `BP 204!A37` (workbook-reference): Amounts are in pesos, not thousands. Sections: TIER 1 / TIER 2, each with A. Casual and B. Contractual, plus sub-totals.
- `BP 204!A38` (requires-confirmation): Formulas: (8) = Monthly Salary x (7); (22) = SUM of (9)-(21); (23) = (8) + (22). In DBM's figures RLIP = 12% of (8) and PHIC = 2.5% of (8), capped.
- `BP 204!A39` (workbook-reference): Sample rows are the first contractual positions in DBM-OSEC's FY2027 staffing summary.

## BP FORM 205 — List of Retirees


### Retiree details and benefits

Reference: `BP 205!A14:M17`. Repeatable records; headings are output labels.

| Stable column ID | Heading path | Type | Treatment |
| --- | --- | --- | --- |
| `bp-205.retirees.col_A` | NAME OF RETIREES | text | Input or mapped existing data; office responsibility configurable |
| `bp-205.retirees.col_B` | Office/Bureau/ Service | text | Input or mapped existing data; office responsibility configurable |
| `bp-205.retirees.col_C` | Position at Retirement Date | text | Input or mapped existing data; office responsibility configurable |
| `bp-205.retirees.col_D` | Date (Mo/Day/Year) / Birth | date | Input or mapped existing data; office responsibility configurable |
| `bp-205.retirees.col_E` | Date (Mo/Day/Year) / Original Appointment | date | Input or mapped existing data; office responsibility configurable |
| `bp-205.retirees.col_F` | Date (Mo/Day/Year) / Retirement | date | Input or mapped existing data; office responsibility configurable |
| `bp-205.retirees.col_G` | Highest Monthly Salary (per NOSA) | currency | Input or mapped existing data; office responsibility configurable |
| `bp-205.retirees.col_H` | TERMINAL LEAVE / Number of Leave Credits Earned / VL | number | Input or mapped existing data; office responsibility configurable |
| `bp-205.retirees.col_I` | TERMINAL LEAVE / Number of Leave Credits Earned / SL | number | Input or mapped existing data; office responsibility configurable |
| `bp-205.retirees.col_J` | TERMINAL LEAVE / Amount | currency | Input or mapped existing data; office responsibility configurable |
| `bp-205.retirees.col_K` | RETIREMENT GRATUITY / Total Creditable Service | number | Input or mapped existing data; office responsibility configurable |
| `bp-205.retirees.col_L` | RETIREMENT GRATUITY / No. of Gratuity in Months | number | Input or mapped existing data; office responsibility configurable |
| `bp-205.retirees.col_M` | RETIREMENT GRATUITY / Amount | currency | Input or mapped existing data; office responsibility configurable |

Reference notes and unresolved details:

- `BP 205!A38` (workbook-reference): Amounts are in pesos. DBM redacted the retirees' names in its published copy. The personal dates (birth, appointment, retirement) are also left out of these sample rows.
- `BP 205!A39` (requires-confirmation): Terminal leave Amount (9) = Highest Monthly Salary (6) x [VL (7) + SL (8)] x 0.0481927 (the daily-rate factor). This reproduces DBM's figures, e.g. 19,106 x 96.367 x 0.0481927 = 88,731.82.
- `BP 205!A40` (workbook-reference): Sign-off: PREPARED BY (Chief Administrative Officer, AS-HRMD) / APPROVED BY (Assistant Director, AS) / DAY/MO/YR.

## BP FORM 206 — Convergence Programs and Projects


### 4 Implementing agencies

Reference: `BP 206!A16:D16`. Repeatable records; headings are output labels.

| Stable column ID | Heading path | Type | Treatment |
| --- | --- | --- | --- |
| `bp-206.agencies.col_A` | Department | text | Input or mapped existing data; office responsibility configurable |
| `bp-206.agencies.col_B` | Agency | text | Input or mapped existing data; office responsibility configurable |
| `bp-206.agencies.col_C` | Operating Unit | text | Input or mapped existing data; office responsibility configurable |
| `bp-206.agencies.col_D` | UACS Code | text | Input or mapped existing data; office responsibility configurable |

### 6 Funding requirements

Reference: `BP 206!A25:F26`. Repeatable records; headings are output labels.

| Stable column ID | Heading path | Type | Treatment |
| --- | --- | --- | --- |
| `bp-206.funding.col_A` | PAP | text | Input or mapped existing data; office responsibility configurable |
| `bp-206.funding.col_B` | UACS Code | text | Input or mapped existing data; office responsibility configurable |
| `bp-206.funding.col_C` | 2025 | currency | Input or mapped existing data; office responsibility configurable |
| `bp-206.funding.col_D` | 2026 | currency | Input or mapped existing data; office responsibility configurable |
| `bp-206.funding.col_E` | 2027 / Tier 1 | currency | Input or mapped existing data; office responsibility configurable |
| `bp-206.funding.col_F` | 2027 / Tier 2 | currency | Input or mapped existing data; office responsibility configurable |

### 7 Physical targets and accomplishments

Reference: `BP 206!A37:G39`. Repeatable records; headings are output labels.

| Stable column ID | Heading path | Type | Treatment |
| --- | --- | --- | --- |
| `bp-206.physical.col_A` | Performance Indicator | text | Input or mapped existing data; office responsibility configurable |
| `bp-206.physical.col_B` | Target / 2024 | text | Input or mapped existing data; office responsibility configurable |
| `bp-206.physical.col_C` | Target / 2025 | text | Input or mapped existing data; office responsibility configurable |
| `bp-206.physical.col_D` | Target / 2026 / Tier 1 | text | Input or mapped existing data; office responsibility configurable |
| `bp-206.physical.col_E` | Target / 2026 / Tier 2 | text | Input or mapped existing data; office responsibility configurable |
| `bp-206.physical.col_F` | Target / 2026 / Total | text | Calculated/output only; formula needs a verified operand mapping |
| `bp-206.physical.col_G` | Accomplishment / 2024 | text | Input or mapped existing data; office responsibility configurable |

Reference notes and unresolved details:

- `BP 206!A51` (workbook-reference): Prepared for each convergence program. Each participating agency lists its own PAPs under 6. Funding Requirements, with group rows for each agency and expense class.
- `BP 206!A52` (requires-confirmation): In section 7, DBM's FY2027 print-out still has the year headings 2024 / 2025 / 2026; they are kept as printed.
- `BP 206!A53` (requires-confirmation): The column labels in section 4 (Department / Agency / Operating Unit / UACS Code) were added here; the official form leaves those columns unlabelled.
- `BP 206!A54` (workbook-reference): '-' amounts in DBM's copy are left blank here.

## BP FORM 207 — Climate Change Expenditures


### Proposed climate expenditure by tier

Reference: `BP 207!A13:L16`. Repeatable records; headings are output labels.

| Stable column ID | Heading path | Type | Treatment |
| --- | --- | --- | --- |
| `bp-207.climateProposed.col_A` | Cost Structure / Activities / Projects | text | Input or mapped existing data; office responsibility configurable |
| `bp-207.climateProposed.col_B` | Key Program Code(s) | text | Input or mapped existing data; office responsibility configurable |
| `bp-207.climateProposed.col_C` | Climate Change Typology/ies | text | Input or mapped existing data; office responsibility configurable |
| `bp-207.climateProposed.col_D` | 2027 Proposed / TIER 1 / MOOE | currency | Input or mapped existing data; office responsibility configurable |
| `bp-207.climateProposed.col_E` | 2027 Proposed / TIER 1 / CO | currency | Input or mapped existing data; office responsibility configurable |
| `bp-207.climateProposed.col_F` | 2027 Proposed / TIER 1 / TOTAL | currency | Calculated/output only; formula needs a verified operand mapping |
| `bp-207.climateProposed.col_G` | 2027 Proposed / TIER 2 / MOOE | currency | Input or mapped existing data; office responsibility configurable |
| `bp-207.climateProposed.col_H` | 2027 Proposed / TIER 2 / CO | currency | Input or mapped existing data; office responsibility configurable |
| `bp-207.climateProposed.col_I` | 2027 Proposed / TIER 2 / TOTAL | currency | Calculated/output only; formula needs a verified operand mapping |
| `bp-207.climateProposed.col_J` | 2027 Proposed / TOTAL PROPOSED / MOOE | currency | Input or mapped existing data; office responsibility configurable |
| `bp-207.climateProposed.col_K` | 2027 Proposed / TOTAL PROPOSED / CO | currency | Input or mapped existing data; office responsibility configurable |
| `bp-207.climateProposed.col_L` | 2027 Proposed / TOTAL PROPOSED / TOTAL | currency | Calculated/output only; formula needs a verified operand mapping |

### Actual climate expenditure

Reference: `BP 207!A24:F26`. Repeatable records; headings are output labels.

| Stable column ID | Heading path | Type | Treatment |
| --- | --- | --- | --- |
| `bp-207.climateActual.col_A` | Cost Structure / Activities / Projects | text | Input or mapped existing data; office responsibility configurable |
| `bp-207.climateActual.col_B` | Key Program Code(s) | text | Input or mapped existing data; office responsibility configurable |
| `bp-207.climateActual.col_C` | Climate Change Typology/ies | text | Input or mapped existing data; office responsibility configurable |
| `bp-207.climateActual.col_D` | 2025 Actual / MOOE | currency | Input or mapped existing data; office responsibility configurable |
| `bp-207.climateActual.col_E` | 2025 Actual / CO | currency | Input or mapped existing data; office responsibility configurable |
| `bp-207.climateActual.col_F` | 2025 Actual / TOTAL | currency | Calculated/output only; formula needs a verified operand mapping |

### Summary by adaptation and mitigation

Reference: `BP 207!A41:D41`. Repeatable records; headings are output labels.

| Stable column ID | Heading path | Type | Treatment |
| --- | --- | --- | --- |
| `bp-207.climateSummary.col_A` | CLIMATE CHANGE TYPOLOGY | text | Input or mapped existing data; office responsibility configurable |
| `bp-207.climateSummary.col_B` | MOOE | currency | Input or mapped existing data; office responsibility configurable |
| `bp-207.climateSummary.col_C` | CO | currency | Input or mapped existing data; office responsibility configurable |
| `bp-207.climateSummary.col_D` | TOTAL | currency | Calculated/output only; formula needs a verified operand mapping |

Reference notes and unresolved details:

- `BP 207!A57` (workbook-reference): Prepared twice: for 2025 - Actual Obligations (MOOE / CO / TOTAL) and for 2027 - Total Proposed Program (Tier 1 / Tier 2 / Total Proposed). Each ends with a SUMMARY by typology (Adaptation / Mitigation).
- `BP 207!A58` (workbook-reference): The 2027 table is left blank here. Sample rows are in the 2025 table below it, from DBM-OSEC's submission. Typology codes such as M614-02 or A614-01 come from the Climate Change Expenditure Tagging typology.
- `BP 207!A59` (workbook-reference): TOTAL columns in the sample tables are formulas (MOOE + CO).
- `BP 207!A60` (workbook-reference): This report was generated using the Online Submission of Budget Proposal (OSBP).

## BP FORM 300 — FY 2027 Proposed Provisions


### Special provisions and justification

Reference: `BP 300!A11:C12`. Repeatable records; headings are output labels.

| Stable column ID | Heading path | Type | Treatment |
| --- | --- | --- | --- |
| `bp-300.provisions.col_A` | AUTHORIZED FOR 2026 (Provisions in the FY 2026 NEP) | text | Input or mapped existing data; office responsibility configurable |
| `bp-300.provisions.col_B` | PROPOSAL FOR FY 2027 | text | Input or mapped existing data; office responsibility configurable |
| `bp-300.provisions.col_C` | JUSTIFICATION (Proposal should include both legal and practical considerations/justification) | textarea | Input or mapped existing data; office responsibility configurable |

Reference notes and unresolved details:

- `BP 300!A28` (workbook-reference): Column (1) holds the current special provisions word for word. Columns (2) and (3) hold the proposed new, amended or deleted wording and the reason for it. DBM-OSEC proposed no changes (status NOT APPLICABLE), so (2) and (3) are empty.

## Initial BMS gaps and staged mapping

The existing BMS has shared headers and partial dynamic schedules, with native schema flattening for other forms. Native flattening loses repeatable hierarchy. Validation caps definitions at 150 fields and 40 columns, while BP 201-B alone has 60 columns. Tables, formula cells and output labels require separate treatment. The new official registry will preserve source references while cycle configuration supplies overlays and custom additions. Existing values/definitions stay in submitted snapshots. Stage reports in `bp_forms_excel_implementation.md` record implementation status and actual tests; this inventory alone does not claim implementation.

## Implemented runtime mapping

The workbook paths above describe source locations. The following are the actual persisted BMS keys, including preserved aliases. Blank references mean shared/internal/supporting data, not a newly asserted official requirement. Column order is independent of these stable keys. Versioned defaults only use real request data; historical periods and unconfirmed factors remain blank. All exports remain draft pending layout acceptance.

### BP FORM A runtime fields

| Stored field path | Type / source | Reference | Calculation / prefill |
| --- | --- | --- | --- |
| `bp-a.department` | undefined / canonical | Shared/internal | department |
| `bp-a.agency` | undefined / canonical | Shared/internal | agency |
| `bp-a.fiscalYear` | undefined / canonical | Shared/internal | fiscalYear |
| `bp-a.operatingUnit` | undefined / canonical | Shared/internal | operatingUnit |
| `bp-a.appropriationSource` | undefined / canonical | Shared/internal | appropriationSource |
| `bp-a.prexcCode` | undefined / canonical | Shared/internal | prexcCode |
| `bp-a.programPap` | undefined / canonical | Shared/internal | programPap |
| `bp-a.performanceMeasure` | textarea / user | Shared/internal | Explicit office input |
| `bp-a.remarks` | textarea / user | Shared/internal | Explicit office input |
| `bp-a.programHistory` | table / user | BP A!A17:H19 | Explicit office input |
| `bp-a.programHistory[].period` | radio / user | Shared/internal | Explicit office input |
| `bp-a.programHistory[].tier` | select / user | Shared/internal | Explicit office input |
| `bp-a.programHistory[].costStructure` | select / user | Shared/internal | Explicit office input |
| `bp-a.programHistory[].prexcCode` | text / user | Shared/internal | Explicit office input |
| `bp-a.programHistory[].pap` | text / user | Shared/internal | Explicit office input |
| `bp-a.programHistory[].status` | select / user | Shared/internal | Explicit office input |
| `bp-a.programHistory[].ps` | currency / user | Shared/internal | Explicit office input |
| `bp-a.programHistory[].mooe` | currency / user | Shared/internal | Explicit office input |
| `bp-a.programHistory[].finex` | currency / user | Shared/internal | Explicit office input |
| `bp-a.programHistory[].co` | currency / user | Shared/internal | Explicit office input |
| `bp-a.programHistory[].total` | currency / user | Shared/internal | sum(ps, mooe, finex, co) |
| `bp-a.preparedBy` | text / user | Shared/internal | Explicit office input |
| `bp-a.preparedTitle` | text / user | Shared/internal | Explicit office input |
| `bp-a.preparedBy2` | text / user | Shared/internal | Explicit office input |
| `bp-a.preparedTitle2` | text / user | Shared/internal | Explicit office input |
| `bp-a.certifiedBy` | text / user | Shared/internal | Explicit office input |
| `bp-a.certifiedTitle` | text / user | Shared/internal | Explicit office input |
| `bp-a.certifiedBy2` | text / user | Shared/internal | Explicit office input |
| `bp-a.certifiedTitle2` | text / user | Shared/internal | Explicit office input |
| `bp-a.approvedBy` | text / user | Shared/internal | Explicit office input |
| `bp-a.approvedTitle` | text / user | Shared/internal | Explicit office input |
| `bp-a.reportDate` | date / user | Shared/internal | Explicit office input |

### BP FORM B runtime fields

| Stored field path | Type / source | Reference | Calculation / prefill |
| --- | --- | --- | --- |
| `bp-b.department` | undefined / canonical | Shared/internal | department |
| `bp-b.agency` | undefined / canonical | Shared/internal | agency |
| `bp-b.fiscalYear` | undefined / canonical | Shared/internal | fiscalYear |
| `bp-b.operatingUnit` | undefined / canonical | Shared/internal | operatingUnit |
| `bp-b.appropriationSource` | undefined / canonical | Shared/internal | appropriationSource |
| `bp-b.prexcCode` | undefined / canonical | Shared/internal | prexcCode |
| `bp-b.performance` | table / user | BP B!A10:H12 | Explicit office input |
| `bp-b.performance[].outcome` | text / user | Shared/internal | Explicit office input |
| `bp-b.performance[].program` | text / user | Shared/internal | Explicit office input |
| `bp-b.performance[].subprogram` | text / user | Shared/internal | Explicit office input |
| `bp-b.performance[].indicatorType` | select / user | Shared/internal | Explicit office input |
| `bp-b.performance[].indicator` | text / user | BP B!A10:A12 | Explicit office input |
| `bp-b.performance[].actualTarget` | text / user | Shared/internal | Explicit office input |
| `bp-b.performance[].actualAccomplishment` | text / user | BP B!C10:C12 | Explicit office input |
| `bp-b.performance[].currentTarget` | text / user | BP B!D10:D12 | Explicit office input |
| `bp-b.performance[].baseline` | text / user | BP B!E10:E12 | Explicit office input |
| `bp-b.performance[].proposedTier1` | text / user | BP B!F10:F12 | Explicit office input |
| `bp-b.performance[].proposedTier2` | text / user | BP B!G10:G12 | Explicit office input |
| `bp-b.performance[].proposedTarget` | text / user (legacy/internal) | Shared/internal | Explicit office input |
| `bp-b.performance[].outyearOne` | text / user (legacy/internal) | Shared/internal | Explicit office input |
| `bp-b.performance[].outyearTwo` | text / user (legacy/internal) | Shared/internal | Explicit office input |
| `bp-b.performance[].dataSource` | text / user | BP B!B10:B12 | Explicit office input |
| `bp-b.performance[].remarks` | textarea / user | BP B!H10:H12 | Explicit office input |
| `bp-b.budgetOfficer` | text / user | Shared/internal | Explicit office input |
| `bp-b.planningOfficer` | text / user | Shared/internal | Explicit office input |
| `bp-b.agencyHead` | text / user | Shared/internal | Explicit office input |
| `bp-b.approvalDate` | date / user | Shared/internal | Explicit office input |

### BP FORM C runtime fields

| Stored field path | Type / source | Reference | Calculation / prefill |
| --- | --- | --- | --- |
| `bp-c.prexcCode` | text / canonical | Shared/internal | prexcCode |
| `bp-c.appropriationSource` | text / canonical | Shared/internal | appropriationSource |
| `bp-c.operatingUnit` | text / canonical | Shared/internal | operatingUnit |
| `bp-c.department` | undefined / canonical | Shared/internal | department |
| `bp-c.agency` | undefined / canonical | Shared/internal | agency |
| `bp-c.fiscalYear` | undefined / canonical | Shared/internal | fiscalYear |
| `bp-c.rdcInputs` | table / user | BP C!A13:H16 | Explicit office input |
| `bp-c.rdcInputs[].pap` | text / user | BP C!A13:A16 | Explicit office input |
| `bp-c.rdcInputs[].region` | text / user | Shared/internal | Explicit office input |
| `bp-c.rdcInputs[].tierOne` | currency / user | BP C!B13:B16 | Explicit office input |
| `bp-c.rdcInputs[].rdcTierTwo` | currency / user | BP C!C13:C16 | Explicit office input |
| `bp-c.rdcInputs[].included` | currency / user | BP C!D13:D16 | Explicit office input |
| `bp-c.rdcInputs[].excluded` | currency / user | BP C!E13:E16 | Explicit office input |
| `bp-c.rdcInputs[].total` | currency / user | BP C!F13:F16 | sum(included, excluded) |
| `bp-c.rdcInputs[].rationale` | currency / user | BP C!G13:G16 | Explicit office input |
| `bp-c.rdcInputs[].feedback` | text / user | BP C!H13:H16 | Explicit office input |
| `bp-c.preparedBy` | text / user | Shared/internal | Explicit office input |
| `bp-c.preparedTitle` | text / user | Shared/internal | Explicit office input |
| `bp-c.preparedBy2` | text / user | Shared/internal | Explicit office input |
| `bp-c.preparedTitle2` | text / user | Shared/internal | Explicit office input |
| `bp-c.certifiedBy` | text / user | Shared/internal | Explicit office input |
| `bp-c.certifiedTitle` | text / user | Shared/internal | Explicit office input |
| `bp-c.certifiedBy2` | text / user | Shared/internal | Explicit office input |
| `bp-c.certifiedTitle2` | text / user | Shared/internal | Explicit office input |
| `bp-c.approvedBy` | text / user | Shared/internal | Explicit office input |
| `bp-c.approvedTitle` | text / user | Shared/internal | Explicit office input |
| `bp-c.reportDate` | date / user | Shared/internal | Explicit office input |

### BP FORM D runtime fields

| Stored field path | Type / source | Reference | Calculation / prefill |
| --- | --- | --- | --- |
| `bp-d.prexcCode` | text / canonical | Shared/internal | prexcCode |
| `bp-d.appropriationSource` | text / canonical | Shared/internal | appropriationSource |
| `bp-d.operatingUnit` | text / canonical | Shared/internal | operatingUnit |
| `bp-d.department` | undefined / canonical | Shared/internal | department |
| `bp-d.agency` | undefined / canonical | Shared/internal | agency |
| `bp-d.fiscalYear` | undefined / canonical | Shared/internal | fiscalYear |
| `bp-d.csoInputs` | table / user | BP D!A13:H15 | Explicit office input |
| `bp-d.csoInputs[].pap` | text / user | BP D!B13:B15 | Explicit office input |
| `bp-d.csoInputs[].prexc` | text / user | BP D!A13:A15 | Explicit office input |
| `bp-d.csoInputs[].locationCode` | text / user | BP D!C13:C15 | Explicit office input |
| `bp-d.csoInputs[].ongoing` | text / user | BP D!D13:D15 | Explicit office input |
| `bp-d.csoInputs[].newSpending` | text / user | BP D!E13:E15 | Explicit office input |
| `bp-d.csoInputs[].amount` | currency / user | BP D!F13:F15 | Explicit office input |
| `bp-d.csoInputs[].basis` | text / user | BP D!G13:G15 | Explicit office input |
| `bp-d.csoInputs[].feedback` | text / user | BP D!H13:H15 | Explicit office input |
| `bp-d.preparedBy` | text / user | Shared/internal | Explicit office input |
| `bp-d.preparedTitle` | text / user | Shared/internal | Explicit office input |
| `bp-d.preparedBy2` | text / user | Shared/internal | Explicit office input |
| `bp-d.preparedTitle2` | text / user | Shared/internal | Explicit office input |
| `bp-d.certifiedBy` | text / user | Shared/internal | Explicit office input |
| `bp-d.certifiedTitle` | text / user | Shared/internal | Explicit office input |
| `bp-d.certifiedBy2` | text / user | Shared/internal | Explicit office input |
| `bp-d.certifiedTitle2` | text / user | Shared/internal | Explicit office input |
| `bp-d.approvedBy` | text / user | Shared/internal | Explicit office input |
| `bp-d.approvedTitle` | text / user | Shared/internal | Explicit office input |
| `bp-d.reportDate` | date / user | Shared/internal | Explicit office input |

### BP FORM 100 runtime fields

| Stored field path | Type / source | Reference | Calculation / prefill |
| --- | --- | --- | --- |
| `bp-100.prexcCode` | text / canonical | Shared/internal | prexcCode |
| `bp-100.appropriationSource` | text / canonical | Shared/internal | appropriationSource |
| `bp-100.operatingUnit` | text / canonical | Shared/internal | operatingUnit |
| `bp-100.fiscalYear` | text / canonical | Shared/internal | fiscalYear |
| `bp-100.agency` | text / canonical | Shared/internal | agency |
| `bp-100.department` | text / canonical | Shared/internal | department |
| `bp-100.official_revenues` | table / user | BP 100!A14:K17 | Explicit office input |
| `bp-100.official_revenues[].col_A` | text / user | BP 100!A14:A17 | Explicit office input |
| `bp-100.official_revenues[].col_B` | text / user | BP 100!B14:B17 | Explicit office input |
| `bp-100.official_revenues[].col_C` | text / user | BP 100!C14:C17 | Explicit office input |
| `bp-100.official_revenues[].col_D` | text / user | BP 100!D14:D17 | Explicit office input |
| `bp-100.official_revenues[].col_E` | currency / user | BP 100!E14:E17 | Explicit office input |
| `bp-100.official_revenues[].col_F` | currency / user | BP 100!F14:F17 | Explicit office input |
| `bp-100.official_revenues[].col_G` | currency / user | BP 100!G14:G17 | Explicit office input |
| `bp-100.official_revenues[].col_H` | currency / user | BP 100!H14:H17 | Explicit office input |
| `bp-100.official_revenues[].col_I` | currency / user | BP 100!I14:I17 | Explicit office input |
| `bp-100.official_revenues[].col_J` | currency / user | BP 100!J14:J17 | Explicit office input |
| `bp-100.official_revenues[].col_K` | textarea / user | BP 100!K14:K17 | Explicit office input |
| `bp-100.preparedBy` | text / user | Shared/internal | Explicit office input |
| `bp-100.preparedTitle` | text / user | Shared/internal | Explicit office input |
| `bp-100.preparedBy2` | text / user | Shared/internal | Explicit office input |
| `bp-100.preparedTitle2` | text / user | Shared/internal | Explicit office input |
| `bp-100.certifiedBy` | text / user | Shared/internal | Explicit office input |
| `bp-100.certifiedTitle` | text / user | Shared/internal | Explicit office input |
| `bp-100.certifiedBy2` | text / user | Shared/internal | Explicit office input |
| `bp-100.certifiedTitle2` | text / user | Shared/internal | Explicit office input |
| `bp-100.approvedBy` | text / user | Shared/internal | Explicit office input |
| `bp-100.approvedTitle` | text / user | Shared/internal | Explicit office input |
| `bp-100.reportDate` | date / user | Shared/internal | Explicit office input |

### BP FORM 100-A runtime fields

| Stored field path | Type / source | Reference | Calculation / prefill |
| --- | --- | --- | --- |
| `bp-100-a.prexcCode` | text / canonical | Shared/internal | prexcCode |
| `bp-100-a.appropriationSource` | text / canonical | Shared/internal | appropriationSource |
| `bp-100-a.operatingUnit` | text / canonical | Shared/internal | operatingUnit |
| `bp-100-a.fiscalYear` | text / canonical | Shared/internal | fiscalYear |
| `bp-100-a.agency` | text / canonical | Shared/internal | agency |
| `bp-100-a.department` | text / canonical | Shared/internal | department |
| `bp-100-a.official_earmarked` | table / user | BP 100-A!A14:Q17 | Explicit office input |
| `bp-100-a.official_earmarked[].col_A` | text / user | BP 100-A!A14:A17 | Explicit office input |
| `bp-100-a.official_earmarked[].col_B` | text / user | BP 100-A!B14:B17 | Explicit office input |
| `bp-100-a.official_earmarked[].col_C` | text / user | BP 100-A!C14:C17 | Explicit office input |
| `bp-100-a.official_earmarked[].col_D` | text / user | BP 100-A!D14:D17 | Explicit office input |
| `bp-100-a.official_earmarked[].col_E` | text / user | BP 100-A!E14:E17 | Explicit office input |
| `bp-100-a.official_earmarked[].col_F` | currency / user | BP 100-A!F14:F17 | Explicit office input |
| `bp-100-a.official_earmarked[].col_G` | currency / user | BP 100-A!G14:G17 | Explicit office input |
| `bp-100-a.official_earmarked[].col_H` | currency / user | BP 100-A!H14:H17 | Explicit office input |
| `bp-100-a.official_earmarked[].col_I` | currency / user | BP 100-A!I14:I17 | Explicit office input |
| `bp-100-a.official_earmarked[].col_J` | currency / user | BP 100-A!J14:J17 | Explicit office input |
| `bp-100-a.official_earmarked[].col_K` | currency / user | BP 100-A!K14:K17 | Explicit office input |
| `bp-100-a.official_earmarked[].col_L` | currency / user | BP 100-A!L14:L17 | Explicit office input |
| `bp-100-a.official_earmarked[].col_M` | currency / user | BP 100-A!M14:M17 | Explicit office input |
| `bp-100-a.official_earmarked[].col_N` | currency / user | BP 100-A!N14:N17 | Explicit office input |
| `bp-100-a.official_earmarked[].col_O` | currency / user | BP 100-A!O14:O17 | Explicit office input |
| `bp-100-a.official_earmarked[].col_P` | currency / user | BP 100-A!P14:P17 | Explicit office input |
| `bp-100-a.official_earmarked[].col_Q` | textarea / user | BP 100-A!Q14:Q17 | Explicit office input |
| `bp-100-a.preparedBy` | text / user | Shared/internal | Explicit office input |
| `bp-100-a.preparedTitle` | text / user | Shared/internal | Explicit office input |
| `bp-100-a.preparedBy2` | text / user | Shared/internal | Explicit office input |
| `bp-100-a.preparedTitle2` | text / user | Shared/internal | Explicit office input |
| `bp-100-a.certifiedBy` | text / user | Shared/internal | Explicit office input |
| `bp-100-a.certifiedTitle` | text / user | Shared/internal | Explicit office input |
| `bp-100-a.certifiedBy2` | text / user | Shared/internal | Explicit office input |
| `bp-100-a.certifiedTitle2` | text / user | Shared/internal | Explicit office input |
| `bp-100-a.approvedBy` | text / user | Shared/internal | Explicit office input |
| `bp-100-a.approvedTitle` | text / user | Shared/internal | Explicit office input |
| `bp-100-a.reportDate` | date / user | Shared/internal | Explicit office input |

### BP FORM 100-B runtime fields

| Stored field path | Type / source | Reference | Calculation / prefill |
| --- | --- | --- | --- |
| `bp-100-b.prexcCode` | text / canonical | Shared/internal | prexcCode |
| `bp-100-b.appropriationSource` | text / canonical | Shared/internal | appropriationSource |
| `bp-100-b.operatingUnit` | text / canonical | Shared/internal | operatingUnit |
| `bp-100-b.fiscalYear` | text / canonical | Shared/internal | fiscalYear |
| `bp-100-b.agency` | text / canonical | Shared/internal | agency |
| `bp-100-b.department` | text / canonical | Shared/internal | department |
| `bp-100-b.official_receipts` | table / user | BP 100-B!A14:M17 | Explicit office input |
| `bp-100-b.official_receipts[].col_A` | text / user | BP 100-B!A14:A17 | Explicit office input |
| `bp-100-b.official_receipts[].col_B` | text / user | BP 100-B!B14:B17 | Explicit office input |
| `bp-100-b.official_receipts[].col_C` | text / user | BP 100-B!C14:C17 | Explicit office input |
| `bp-100-b.official_receipts[].col_D` | text / user | BP 100-B!D14:D17 | Explicit office input |
| `bp-100-b.official_receipts[].col_E` | text / user | BP 100-B!E14:E17 | Explicit office input |
| `bp-100-b.official_receipts[].col_F` | currency / user | BP 100-B!F14:F17 | Explicit office input |
| `bp-100-b.official_receipts[].col_G` | currency / user | BP 100-B!G14:G17 | Explicit office input |
| `bp-100-b.official_receipts[].col_H` | currency / user | BP 100-B!H14:H17 | Explicit office input |
| `bp-100-b.official_receipts[].col_I` | currency / user | BP 100-B!I14:I17 | Explicit office input |
| `bp-100-b.official_receipts[].col_J` | currency / user | BP 100-B!J14:J17 | Explicit office input |
| `bp-100-b.official_receipts[].col_K` | currency / user | BP 100-B!K14:K17 | Explicit office input |
| `bp-100-b.official_receipts[].col_L` | currency / user | BP 100-B!L14:L17 | Explicit office input |
| `bp-100-b.official_receipts[].col_M` | textarea / user | BP 100-B!M14:M17 | Explicit office input |
| `bp-100-b.preparedBy` | text / user | Shared/internal | Explicit office input |
| `bp-100-b.preparedTitle` | text / user | Shared/internal | Explicit office input |
| `bp-100-b.preparedBy2` | text / user | Shared/internal | Explicit office input |
| `bp-100-b.preparedTitle2` | text / user | Shared/internal | Explicit office input |
| `bp-100-b.certifiedBy` | text / user | Shared/internal | Explicit office input |
| `bp-100-b.certifiedTitle` | text / user | Shared/internal | Explicit office input |
| `bp-100-b.certifiedBy2` | text / user | Shared/internal | Explicit office input |
| `bp-100-b.certifiedTitle2` | text / user | Shared/internal | Explicit office input |
| `bp-100-b.approvedBy` | text / user | Shared/internal | Explicit office input |
| `bp-100-b.approvedTitle` | text / user | Shared/internal | Explicit office input |
| `bp-100-b.reportDate` | date / user | Shared/internal | Explicit office input |

### BP FORM 100-C runtime fields

| Stored field path | Type / source | Reference | Calculation / prefill |
| --- | --- | --- | --- |
| `bp-100-c.prexcCode` | text / canonical | Shared/internal | prexcCode |
| `bp-100-c.appropriationSource` | text / canonical | Shared/internal | appropriationSource |
| `bp-100-c.operatingUnit` | text / canonical | Shared/internal | operatingUnit |
| `bp-100-c.fiscalYear` | text / canonical | Shared/internal | fiscalYear |
| `bp-100-c.agency` | text / canonical | Shared/internal | agency |
| `bp-100-c.department` | text / canonical | Shared/internal | department |
| `bp-100-c.official_donations` | table / user | BP 100-C!A13:M16 | Explicit office input |
| `bp-100-c.official_donations[].col_A` | text / user | BP 100-C!A13:A16 | Explicit office input |
| `bp-100-c.official_donations[].col_B` | text / user | BP 100-C!B13:B16 | Explicit office input |
| `bp-100-c.official_donations[].col_C` | text / user | BP 100-C!C13:C16 | Explicit office input |
| `bp-100-c.official_donations[].col_D` | text / user | BP 100-C!D13:D16 | Explicit office input |
| `bp-100-c.official_donations[].col_E` | text / user | BP 100-C!E13:E16 | Explicit office input |
| `bp-100-c.official_donations[].col_F` | currency / user | BP 100-C!F13:F16 | Explicit office input |
| `bp-100-c.official_donations[].col_G` | currency / user | BP 100-C!G13:G16 | Explicit office input |
| `bp-100-c.official_donations[].col_H` | currency / user | BP 100-C!H13:H16 | Explicit office input |
| `bp-100-c.official_donations[].col_I` | currency / user | BP 100-C!I13:I16 | Explicit office input |
| `bp-100-c.official_donations[].col_J` | currency / user | BP 100-C!J13:J16 | Explicit office input |
| `bp-100-c.official_donations[].col_K` | currency / user | BP 100-C!K13:K16 | Explicit office input |
| `bp-100-c.official_donations[].col_L` | currency / user | BP 100-C!L13:L16 | Explicit office input |
| `bp-100-c.official_donations[].col_M` | textarea / user | BP 100-C!M13:M16 | Explicit office input |
| `bp-100-c.preparedBy` | text / user | Shared/internal | Explicit office input |
| `bp-100-c.preparedTitle` | text / user | Shared/internal | Explicit office input |
| `bp-100-c.preparedBy2` | text / user | Shared/internal | Explicit office input |
| `bp-100-c.preparedTitle2` | text / user | Shared/internal | Explicit office input |
| `bp-100-c.certifiedBy` | text / user | Shared/internal | Explicit office input |
| `bp-100-c.certifiedTitle` | text / user | Shared/internal | Explicit office input |
| `bp-100-c.certifiedBy2` | text / user | Shared/internal | Explicit office input |
| `bp-100-c.certifiedTitle2` | text / user | Shared/internal | Explicit office input |
| `bp-100-c.approvedBy` | text / user | Shared/internal | Explicit office input |
| `bp-100-c.approvedTitle` | text / user | Shared/internal | Explicit office input |
| `bp-100-c.reportDate` | date / user | Shared/internal | Explicit office input |

### BP FORM 200 runtime fields

| Stored field path | Type / source | Reference | Calculation / prefill |
| --- | --- | --- | --- |
| `bp-200.prexcCode` | text / canonical | Shared/internal | prexcCode |
| `bp-200.appropriationSource` | text / canonical | Shared/internal | appropriationSource |
| `bp-200.operatingUnit` | text / canonical | Shared/internal | operatingUnit |
| `bp-200.fiscalYear` | text / canonical | Shared/internal | fiscalYear |
| `bp-200.agency` | text / canonical | Shared/internal | agency |
| `bp-200.department` | text / canonical | Shared/internal | department |
| `bp-200.official_appropriations` | table / user | BP 200!A12:D14 | Explicit office input |
| `bp-200.official_appropriations[].col_A` | text / user | BP 200!A12:A14 | Explicit office input |
| `bp-200.official_appropriations[].col_B` | currency / user | BP 200!B12:B14 | Explicit office input |
| `bp-200.official_appropriations[].col_C` | currency / user | BP 200!C12:C14 | Explicit office input |
| `bp-200.official_appropriations[].col_D` | currency / user | BP 200!D12:D14 | Explicit office input |
| `bp-200.preparedBy` | text / user | Shared/internal | Explicit office input |
| `bp-200.preparedTitle` | text / user | Shared/internal | Explicit office input |
| `bp-200.preparedBy2` | text / user | Shared/internal | Explicit office input |
| `bp-200.preparedTitle2` | text / user | Shared/internal | Explicit office input |
| `bp-200.certifiedBy` | text / user | Shared/internal | Explicit office input |
| `bp-200.certifiedTitle` | text / user | Shared/internal | Explicit office input |
| `bp-200.certifiedBy2` | text / user | Shared/internal | Explicit office input |
| `bp-200.certifiedTitle2` | text / user | Shared/internal | Explicit office input |
| `bp-200.approvedBy` | text / user | Shared/internal | Explicit office input |
| `bp-200.approvedTitle` | text / user | Shared/internal | Explicit office input |
| `bp-200.reportDate` | date / user | Shared/internal | Explicit office input |

### BP FORM 201-A runtime fields

| Stored field path | Type / source | Reference | Calculation / prefill |
| --- | --- | --- | --- |
| `bp-201-a.department` | undefined / canonical | Shared/internal | department |
| `bp-201-a.agency` | undefined / canonical | Shared/internal | agency |
| `bp-201-a.fiscalYear` | undefined / canonical | Shared/internal | fiscalYear |
| `bp-201-a.operatingUnit` | undefined / canonical | Shared/internal | operatingUnit |
| `bp-201-a.appropriationSource` | undefined / canonical | Shared/internal | appropriationSource |
| `bp-201-a.prexcCode` | undefined / canonical | Shared/internal | prexcCode |
| `bp-201-a.programPap` | undefined / canonical | Shared/internal | programPap |
| `bp-201-a.proposedPs` | number / derived | Shared/internal | psTotal |
| `bp-201-a.numberOfPositions` | number / user (legacy/internal) | Shared/internal | Explicit office input |
| `bp-201-a.actualPs` | number / user (legacy/internal) | Shared/internal | Explicit office input |
| `bp-201-a.currentPs` | number / user (legacy/internal) | Shared/internal | Explicit office input |
| `bp-201-a.remarks` | textarea / user (legacy/internal) | Shared/internal | Explicit office input |
| `bp-201-a.official_personnel` | table / user | BP 201-A!A15:Y16 | Explicit office input |
| `bp-201-a.official_personnel[].col_A` | text / user | BP 201-A!A15:A16 | Explicit office input |
| `bp-201-a.official_personnel[].col_B` | text / user | BP 201-A!B15:B16 | Explicit office input |
| `bp-201-a.official_personnel[].col_C` | text / user | BP 201-A!C15:C16 | Explicit office input |
| `bp-201-a.official_personnel[].col_D` | text / user | BP 201-A!D15:D16 | Explicit office input |
| `bp-201-a.official_personnel[].col_E` | currency / user | BP 201-A!E15:E16 | Explicit office input |
| `bp-201-a.official_personnel[].col_F` | currency / user | BP 201-A!F15:F16 | Explicit office input |
| `bp-201-a.official_personnel[].col_G` | currency / user | BP 201-A!G15:G16 | Explicit office input |
| `bp-201-a.official_personnel[].col_H` | currency / user | BP 201-A!H15:H16 | Explicit office input |
| `bp-201-a.official_personnel[].col_I` | currency / user | BP 201-A!I15:I16 | Explicit office input |
| `bp-201-a.official_personnel[].col_J` | currency / user | BP 201-A!J15:J16 | Explicit office input |
| `bp-201-a.official_personnel[].col_K` | currency / user | BP 201-A!K15:K16 | Explicit office input |
| `bp-201-a.official_personnel[].col_L` | currency / user | BP 201-A!L15:L16 | Explicit office input |
| `bp-201-a.official_personnel[].col_M` | currency / user | BP 201-A!M15:M16 | Explicit office input |
| `bp-201-a.official_personnel[].col_N` | currency / user | BP 201-A!N15:N16 | Explicit office input |
| `bp-201-a.official_personnel[].col_O` | currency / user | BP 201-A!O15:O16 | Explicit office input |
| `bp-201-a.official_personnel[].col_P` | currency / user | BP 201-A!P15:P16 | Explicit office input |
| `bp-201-a.official_personnel[].col_Q` | currency / user | BP 201-A!Q15:Q16 | Explicit office input |
| `bp-201-a.official_personnel[].col_R` | currency / user | BP 201-A!R15:R16 | Explicit office input |
| `bp-201-a.official_personnel[].col_S` | currency / user | BP 201-A!S15:S16 | Explicit office input |
| `bp-201-a.official_personnel[].col_T` | currency / user | BP 201-A!T15:T16 | Explicit office input |
| `bp-201-a.official_personnel[].col_U` | currency / user | BP 201-A!U15:U16 | Explicit office input |
| `bp-201-a.official_personnel[].col_V` | currency / user | BP 201-A!V15:V16 | Explicit office input |
| `bp-201-a.official_personnel[].col_W` | currency / user | BP 201-A!W15:W16 | Explicit office input |
| `bp-201-a.official_personnel[].col_X` | currency / user | BP 201-A!X15:X16 | Explicit office input |
| `bp-201-a.official_personnel[].col_Y` | currency / user | BP 201-A!Y15:Y16 | sum(col_E, col_F, col_G, col_H, col_I, col_J, col_K, col_L, col_M, col_N, col_O, col_P, col_Q, col_R, col_S, col_T, col_U, col_V, col_W, col_X) |
| `bp-201-a.reportRegion` | text / user | Shared/internal | Explicit office input |
| `bp-201-a.reportTier` | text / canonical | Shared/internal | proposalTier |
| `bp-201-a.preparedBy` | text / user | Shared/internal | Explicit office input |
| `bp-201-a.preparedTitle` | text / user | Shared/internal | Explicit office input |
| `bp-201-a.preparedBy2` | text / user | Shared/internal | Explicit office input |
| `bp-201-a.preparedTitle2` | text / user | Shared/internal | Explicit office input |
| `bp-201-a.certifiedBy` | text / user | Shared/internal | Explicit office input |
| `bp-201-a.certifiedTitle` | text / user | Shared/internal | Explicit office input |
| `bp-201-a.certifiedBy2` | text / user | Shared/internal | Explicit office input |
| `bp-201-a.certifiedTitle2` | text / user | Shared/internal | Explicit office input |
| `bp-201-a.approvedBy` | text / user | Shared/internal | Explicit office input |
| `bp-201-a.approvedTitle` | text / user | Shared/internal | Explicit office input |
| `bp-201-a.reportDate` | date / user | Shared/internal | Explicit office input |
| `bp-201-a.reportPeriod` | radio / user | NBM 156 pp.67–70, year check mark | Explicit office input |

### BP FORM 201-B runtime fields

| Stored field path | Type / source | Reference | Calculation / prefill |
| --- | --- | --- | --- |
| `bp-201-b.department` | undefined / canonical | Shared/internal | department |
| `bp-201-b.agency` | undefined / canonical | Shared/internal | agency |
| `bp-201-b.fiscalYear` | undefined / canonical | Shared/internal | fiscalYear |
| `bp-201-b.operatingUnit` | undefined / canonical | Shared/internal | operatingUnit |
| `bp-201-b.appropriationSource` | undefined / canonical | Shared/internal | appropriationSource |
| `bp-201-b.prexcCode` | undefined / canonical | Shared/internal | prexcCode |
| `bp-201-b.programPap` | undefined / canonical | Shared/internal | programPap |
| `bp-201-b.proposedMooe` | number / derived | Shared/internal | mooeTotal |
| `bp-201-b.actualMooe` | number / user (legacy/internal) | Shared/internal | Explicit office input |
| `bp-201-b.currentMooe` | number / user (legacy/internal) | Shared/internal | Explicit office input |
| `bp-201-b.remarks` | textarea / user (legacy/internal) | Shared/internal | Explicit office input |
| `bp-201-b.official_maintenance` | table / user | BP 201-B!A15:BH16 | Explicit office input |
| `bp-201-b.official_maintenance[].col_A` | text / user | BP 201-B!A15:A16 | Explicit office input |
| `bp-201-b.official_maintenance[].col_B` | text / user | BP 201-B!B15:B16 | Explicit office input |
| `bp-201-b.official_maintenance[].col_C` | text / user | BP 201-B!C15:C16 | Explicit office input |
| `bp-201-b.official_maintenance[].col_D` | currency / user | BP 201-B!D15:D16 | Explicit office input |
| `bp-201-b.official_maintenance[].col_E` | currency / user | BP 201-B!E15:E16 | Explicit office input |
| `bp-201-b.official_maintenance[].col_F` | currency / user | BP 201-B!F15:F16 | Explicit office input |
| `bp-201-b.official_maintenance[].col_G` | currency / user | BP 201-B!G15:G16 | Explicit office input |
| `bp-201-b.official_maintenance[].col_H` | currency / user | BP 201-B!H15:H16 | Explicit office input |
| `bp-201-b.official_maintenance[].col_I` | currency / user | BP 201-B!I15:I16 | Explicit office input |
| `bp-201-b.official_maintenance[].col_J` | currency / user | BP 201-B!J15:J16 | Explicit office input |
| `bp-201-b.official_maintenance[].col_K` | currency / user | BP 201-B!K15:K16 | Explicit office input |
| `bp-201-b.official_maintenance[].col_L` | currency / user | BP 201-B!L15:L16 | Explicit office input |
| `bp-201-b.official_maintenance[].col_M` | currency / user | BP 201-B!M15:M16 | Explicit office input |
| `bp-201-b.official_maintenance[].col_N` | currency / user | BP 201-B!N15:N16 | Explicit office input |
| `bp-201-b.official_maintenance[].col_O` | currency / user | BP 201-B!O15:O16 | Explicit office input |
| `bp-201-b.official_maintenance[].col_P` | currency / user | BP 201-B!P15:P16 | Explicit office input |
| `bp-201-b.official_maintenance[].col_Q` | currency / user | BP 201-B!Q15:Q16 | Explicit office input |
| `bp-201-b.official_maintenance[].col_R` | currency / user | BP 201-B!R15:R16 | Explicit office input |
| `bp-201-b.official_maintenance[].col_S` | currency / user | BP 201-B!S15:S16 | Explicit office input |
| `bp-201-b.official_maintenance[].col_T` | currency / user | BP 201-B!T15:T16 | Explicit office input |
| `bp-201-b.official_maintenance[].col_U` | currency / user | BP 201-B!U15:U16 | Explicit office input |
| `bp-201-b.official_maintenance[].col_V` | currency / user | BP 201-B!V15:V16 | Explicit office input |
| `bp-201-b.official_maintenance[].col_W` | currency / user | BP 201-B!W15:W16 | Explicit office input |
| `bp-201-b.official_maintenance[].col_X` | currency / user | BP 201-B!X15:X16 | Explicit office input |
| `bp-201-b.official_maintenance[].col_Y` | currency / user | BP 201-B!Y15:Y16 | Explicit office input |
| `bp-201-b.official_maintenance[].col_Z` | currency / user | BP 201-B!Z15:Z16 | Explicit office input |
| `bp-201-b.official_maintenance[].col_AA` | currency / user | BP 201-B!AA15:AA16 | Explicit office input |
| `bp-201-b.official_maintenance[].col_AB` | currency / user | BP 201-B!AB15:AB16 | Explicit office input |
| `bp-201-b.official_maintenance[].col_AC` | currency / user | BP 201-B!AC15:AC16 | Explicit office input |
| `bp-201-b.official_maintenance[].col_AD` | currency / user | BP 201-B!AD15:AD16 | Explicit office input |
| `bp-201-b.official_maintenance[].col_AE` | currency / user | BP 201-B!AE15:AE16 | Explicit office input |
| `bp-201-b.official_maintenance[].col_AF` | currency / user | BP 201-B!AF15:AF16 | Explicit office input |
| `bp-201-b.official_maintenance[].col_AG` | currency / user | BP 201-B!AG15:AG16 | Explicit office input |
| `bp-201-b.official_maintenance[].col_AH` | currency / user | BP 201-B!AH15:AH16 | Explicit office input |
| `bp-201-b.official_maintenance[].col_AI` | currency / user | BP 201-B!AI15:AI16 | Explicit office input |
| `bp-201-b.official_maintenance[].col_AJ` | currency / user | BP 201-B!AJ15:AJ16 | Explicit office input |
| `bp-201-b.official_maintenance[].col_AK` | currency / user | BP 201-B!AK15:AK16 | Explicit office input |
| `bp-201-b.official_maintenance[].col_AL` | currency / user | BP 201-B!AL15:AL16 | Explicit office input |
| `bp-201-b.official_maintenance[].col_AM` | currency / user | BP 201-B!AM15:AM16 | Explicit office input |
| `bp-201-b.official_maintenance[].col_AN` | currency / user | BP 201-B!AN15:AN16 | Explicit office input |
| `bp-201-b.official_maintenance[].col_AO` | currency / user | BP 201-B!AO15:AO16 | Explicit office input |
| `bp-201-b.official_maintenance[].col_AP` | currency / user | BP 201-B!AP15:AP16 | Explicit office input |
| `bp-201-b.official_maintenance[].col_AQ` | currency / user | BP 201-B!AQ15:AQ16 | Explicit office input |
| `bp-201-b.official_maintenance[].col_AR` | currency / user | BP 201-B!AR15:AR16 | Explicit office input |
| `bp-201-b.official_maintenance[].col_AS` | currency / user | BP 201-B!AS15:AS16 | Explicit office input |
| `bp-201-b.official_maintenance[].col_AT` | currency / user | BP 201-B!AT15:AT16 | Explicit office input |
| `bp-201-b.official_maintenance[].col_AU` | currency / user | BP 201-B!AU15:AU16 | Explicit office input |
| `bp-201-b.official_maintenance[].col_AV` | currency / user | BP 201-B!AV15:AV16 | Explicit office input |
| `bp-201-b.official_maintenance[].col_AW` | currency / user | BP 201-B!AW15:AW16 | Explicit office input |
| `bp-201-b.official_maintenance[].col_AX` | currency / user | BP 201-B!AX15:AX16 | Explicit office input |
| `bp-201-b.official_maintenance[].col_AY` | currency / user | BP 201-B!AY15:AY16 | Explicit office input |
| `bp-201-b.official_maintenance[].col_AZ` | currency / user | BP 201-B!AZ15:AZ16 | Explicit office input |
| `bp-201-b.official_maintenance[].col_BA` | currency / user | BP 201-B!BA15:BA16 | Explicit office input |
| `bp-201-b.official_maintenance[].col_BB` | currency / user | BP 201-B!BB15:BB16 | Explicit office input |
| `bp-201-b.official_maintenance[].col_BC` | currency / user | BP 201-B!BC15:BC16 | Explicit office input |
| `bp-201-b.official_maintenance[].col_BD` | currency / user | BP 201-B!BD15:BD16 | Explicit office input |
| `bp-201-b.official_maintenance[].col_BE` | currency / user | BP 201-B!BE15:BE16 | Explicit office input |
| `bp-201-b.official_maintenance[].col_BF` | currency / user | BP 201-B!BF15:BF16 | Explicit office input |
| `bp-201-b.official_maintenance[].col_BG` | currency / user | BP 201-B!BG15:BG16 | Explicit office input |
| `bp-201-b.official_maintenance[].col_BH` | currency / user | BP 201-B!BH15:BH16 | sum(col_D, col_E, col_F, col_G, col_H, col_I, col_J, col_K, col_L, col_M, col_N, col_O, col_P, col_Q, col_R, col_S, col_T, col_U, col_V, col_W, col_X, col_Y, col_Z, col_AA, col_AB, col_AC, col_AD, col_AE, col_AF, col_AG, col_AH, col_AI, col_AJ, col_AK, col_AL, col_AM, col_AN, col_AO, col_AP, col_AQ, col_AR, col_AS, col_AT, col_AU, col_AV, col_AW, col_AX, col_AY, col_AZ, col_BA, col_BB, col_BC, col_BD, col_BE, col_BF, col_BG) |
| `bp-201-b.reportRegion` | text / user | Shared/internal | Explicit office input |
| `bp-201-b.reportTier` | text / canonical | Shared/internal | proposalTier |
| `bp-201-b.preparedBy` | text / user | Shared/internal | Explicit office input |
| `bp-201-b.preparedTitle` | text / user | Shared/internal | Explicit office input |
| `bp-201-b.preparedBy2` | text / user | Shared/internal | Explicit office input |
| `bp-201-b.preparedTitle2` | text / user | Shared/internal | Explicit office input |
| `bp-201-b.certifiedBy` | text / user | Shared/internal | Explicit office input |
| `bp-201-b.certifiedTitle` | text / user | Shared/internal | Explicit office input |
| `bp-201-b.certifiedBy2` | text / user | Shared/internal | Explicit office input |
| `bp-201-b.certifiedTitle2` | text / user | Shared/internal | Explicit office input |
| `bp-201-b.approvedBy` | text / user | Shared/internal | Explicit office input |
| `bp-201-b.approvedTitle` | text / user | Shared/internal | Explicit office input |
| `bp-201-b.reportDate` | date / user | Shared/internal | Explicit office input |
| `bp-201-b.reportPeriod` | radio / user | NBM 156 pp.67–70, year check mark | Explicit office input |

### BP FORM 201-C runtime fields

| Stored field path | Type / source | Reference | Calculation / prefill |
| --- | --- | --- | --- |
| `bp-201-c.department` | undefined / canonical | Shared/internal | department |
| `bp-201-c.agency` | undefined / canonical | Shared/internal | agency |
| `bp-201-c.fiscalYear` | undefined / canonical | Shared/internal | fiscalYear |
| `bp-201-c.operatingUnit` | undefined / canonical | Shared/internal | operatingUnit |
| `bp-201-c.appropriationSource` | undefined / canonical | Shared/internal | appropriationSource |
| `bp-201-c.prexcCode` | undefined / canonical | Shared/internal | prexcCode |
| `bp-201-c.programPap` | undefined / canonical | Shared/internal | programPap |
| `bp-201-c.finexCategory` | text / user (legacy/internal) | Shared/internal | Explicit office input |
| `bp-201-c.actualFinex` | number / user (legacy/internal) | Shared/internal | Explicit office input |
| `bp-201-c.currentFinex` | number / user (legacy/internal) | Shared/internal | Explicit office input |
| `bp-201-c.proposedFinex` | number / derived | Shared/internal | finexTotal |
| `bp-201-c.official_financial` | table / user (legacy/internal) | BP 201-C!A13:F14 | Explicit office input |
| `bp-201-c.official_financial[].col_A` | text / user | BP 201-C!A13:A14 | Explicit office input |
| `bp-201-c.official_financial[].col_B` | text / user | BP 201-C!B13:B14 | Explicit office input |
| `bp-201-c.official_financial[].col_C` | text / user | BP 201-C!C13:C14 | Explicit office input |
| `bp-201-c.official_financial[].col_D` | text / user | BP 201-C!D13:D14 | Explicit office input |
| `bp-201-c.official_financial[].col_E` | currency / user | BP 201-C!E13:E14 | Explicit office input |
| `bp-201-c.official_financial[].col_F` | currency / user | BP 201-C!F13:F14 | sum(col_E) |
| `bp-201-c.reportRegion` | text / user | Shared/internal | Explicit office input |
| `bp-201-c.reportTier` | text / canonical | Shared/internal | proposalTier |
| `bp-201-c.preparedBy` | text / user | Shared/internal | Explicit office input |
| `bp-201-c.preparedTitle` | text / user | Shared/internal | Explicit office input |
| `bp-201-c.preparedBy2` | text / user | Shared/internal | Explicit office input |
| `bp-201-c.preparedTitle2` | text / user | Shared/internal | Explicit office input |
| `bp-201-c.certifiedBy` | text / user | Shared/internal | Explicit office input |
| `bp-201-c.certifiedTitle` | text / user | Shared/internal | Explicit office input |
| `bp-201-c.certifiedBy2` | text / user | Shared/internal | Explicit office input |
| `bp-201-c.certifiedTitle2` | text / user | Shared/internal | Explicit office input |
| `bp-201-c.approvedBy` | text / user | Shared/internal | Explicit office input |
| `bp-201-c.approvedTitle` | text / user | Shared/internal | Explicit office input |
| `bp-201-c.reportDate` | date / user | Shared/internal | Explicit office input |
| `bp-201-c.reportPeriod` | radio / user | NBM 156 pp.67–70, year check mark | Explicit office input |
| `bp-201-c.official_verifiedFinancial` | table / user | NBM 156 p.69, BP 201-C columns 1-9 | Explicit office input |
| `bp-201-c.official_verifiedFinancial[].uacsCode` | text / user | NBM 156 p.69 column 1 | Explicit office input |
| `bp-201-c.official_verifiedFinancial[].pap` | text / user | NBM 156 p.69 column 2 | Explicit office input |
| `bp-201-c.official_verifiedFinancial[].managementFees` | currency / user | NBM 156 p.69 column 3 | Explicit office input |
| `bp-201-c.official_verifiedFinancial[].interestNonResidents` | currency / user | NBM 156 p.69 column 4 | Explicit office input |
| `bp-201-c.official_verifiedFinancial[].guaranteeFees` | currency / user | NBM 156 p.69 column 5 | Explicit office input |
| `bp-201-c.official_verifiedFinancial[].bankCharges` | currency / user | NBM 156 p.69 column 6 | Explicit office input |
| `bp-201-c.official_verifiedFinancial[].commitmentFees` | currency / user | NBM 156 p.69 column 7 | Explicit office input |
| `bp-201-c.official_verifiedFinancial[].otherFinancialCharges` | currency / user | NBM 156 p.69 column 8 | Explicit office input |
| `bp-201-c.official_verifiedFinancial[].total` | currency / user | NBM 156 p.69 column 9 | sum(managementFees, interestNonResidents, guaranteeFees, bankCharges, commitmentFees, otherFinancialCharges) |

### BP FORM 201-D runtime fields

| Stored field path | Type / source | Reference | Calculation / prefill |
| --- | --- | --- | --- |
| `bp-201-d.department` | undefined / canonical | Shared/internal | department |
| `bp-201-d.agency` | undefined / canonical | Shared/internal | agency |
| `bp-201-d.fiscalYear` | undefined / canonical | Shared/internal | fiscalYear |
| `bp-201-d.operatingUnit` | undefined / canonical | Shared/internal | operatingUnit |
| `bp-201-d.appropriationSource` | undefined / canonical | Shared/internal | appropriationSource |
| `bp-201-d.prexcCode` | undefined / canonical | Shared/internal | prexcCode |
| `bp-201-d.programPap` | undefined / canonical | Shared/internal | programPap |
| `bp-201-d.proposedCo` | number / derived | Shared/internal | coTotal |
| `bp-201-d.actualCo` | number / user (legacy/internal) | Shared/internal | Explicit office input |
| `bp-201-d.currentCo` | number / user (legacy/internal) | Shared/internal | Explicit office input |
| `bp-201-d.assetDescription` | textarea / user (legacy/internal) | Shared/internal | Explicit office input |
| `bp-201-d.official_capital` | table / user | BP 201-D!A15:Q16 | Explicit office input |
| `bp-201-d.official_capital[].col_A` | text / user | BP 201-D!A15:A16 | Explicit office input |
| `bp-201-d.official_capital[].col_B` | text / user | BP 201-D!B15:B16 | Explicit office input |
| `bp-201-d.official_capital[].col_C` | text / user | BP 201-D!C15:C16 | Explicit office input |
| `bp-201-d.official_capital[].col_D` | text / user | BP 201-D!D15:D16 | Explicit office input |
| `bp-201-d.official_capital[].col_E` | currency / user | BP 201-D!E15:E16 | Explicit office input |
| `bp-201-d.official_capital[].col_F` | currency / user | BP 201-D!F15:F16 | Explicit office input |
| `bp-201-d.official_capital[].col_G` | currency / user | BP 201-D!G15:G16 | Explicit office input |
| `bp-201-d.official_capital[].col_H` | currency / user | BP 201-D!H15:H16 | Explicit office input |
| `bp-201-d.official_capital[].col_I` | currency / user | BP 201-D!I15:I16 | Explicit office input |
| `bp-201-d.official_capital[].col_J` | currency / user | BP 201-D!J15:J16 | Explicit office input |
| `bp-201-d.official_capital[].col_K` | currency / user | BP 201-D!K15:K16 | Explicit office input |
| `bp-201-d.official_capital[].col_L` | currency / user | BP 201-D!L15:L16 | Explicit office input |
| `bp-201-d.official_capital[].col_M` | currency / user | BP 201-D!M15:M16 | Explicit office input |
| `bp-201-d.official_capital[].col_N` | currency / user | BP 201-D!N15:N16 | Explicit office input |
| `bp-201-d.official_capital[].col_O` | currency / user | BP 201-D!O15:O16 | Explicit office input |
| `bp-201-d.official_capital[].col_P` | currency / user | BP 201-D!P15:P16 | Explicit office input |
| `bp-201-d.official_capital[].col_Q` | currency / user | BP 201-D!Q15:Q16 | sum(col_E, col_F, col_G, col_H, col_I, col_J, col_K, col_L, col_M, col_N, col_O, col_P) |
| `bp-201-d.reportRegion` | text / user | Shared/internal | Explicit office input |
| `bp-201-d.reportTier` | text / canonical | Shared/internal | proposalTier |
| `bp-201-d.preparedBy` | text / user | Shared/internal | Explicit office input |
| `bp-201-d.preparedTitle` | text / user | Shared/internal | Explicit office input |
| `bp-201-d.preparedBy2` | text / user | Shared/internal | Explicit office input |
| `bp-201-d.preparedTitle2` | text / user | Shared/internal | Explicit office input |
| `bp-201-d.certifiedBy` | text / user | Shared/internal | Explicit office input |
| `bp-201-d.certifiedTitle` | text / user | Shared/internal | Explicit office input |
| `bp-201-d.certifiedBy2` | text / user | Shared/internal | Explicit office input |
| `bp-201-d.certifiedTitle2` | text / user | Shared/internal | Explicit office input |
| `bp-201-d.approvedBy` | text / user | Shared/internal | Explicit office input |
| `bp-201-d.approvedTitle` | text / user | Shared/internal | Explicit office input |
| `bp-201-d.reportDate` | date / user | Shared/internal | Explicit office input |
| `bp-201-d.reportPeriod` | radio / user | NBM 156 pp.67–70, year check mark | Explicit office input |

### BP FORM 201-E runtime fields

| Stored field path | Type / source | Reference | Calculation / prefill |
| --- | --- | --- | --- |
| `bp-201-e.department` | undefined / canonical | Shared/internal | department |
| `bp-201-e.agency` | undefined / canonical | Shared/internal | agency |
| `bp-201-e.fiscalYear` | undefined / canonical | Shared/internal | fiscalYear |
| `bp-201-e.operatingUnit` | undefined / canonical | Shared/internal | operatingUnit |
| `bp-201-e.appropriationSource` | undefined / canonical | Shared/internal | appropriationSource |
| `bp-201-e.prexcCode` | undefined / canonical | Shared/internal | prexcCode |
| `bp-201-e.programPap` | undefined / canonical | Shared/internal | programPap |
| `bp-201-e.implementationStart` | undefined / canonical | Shared/internal | implementationStart |
| `bp-201-e.implementationEnd` | undefined / canonical | Shared/internal | implementationEnd |
| `bp-201-e.fundingSource` | undefined / canonical | Shared/internal | fundingSource |
| `bp-201-e.requirementFy` | number / derived | Shared/internal | expenseTotal |
| `bp-201-e.totalProjectCost` | number / user (legacy/internal) | Shared/internal | Explicit office input |
| `bp-201-e.outyearOne` | number / user (legacy/internal) | Shared/internal | Explicit office input |
| `bp-201-e.outyearTwo` | number / user (legacy/internal) | Shared/internal | Explicit office input |
| `bp-201-e.furtherOutyears` | number / user (legacy/internal) | Shared/internal | Explicit office input |
| `bp-201-e.official_outyears` | table / user | BP 201-E!A13:X17 | Explicit office input |
| `bp-201-e.official_outyears[].col_A` | text / user | BP 201-E!A13:A17 | Explicit office input |
| `bp-201-e.official_outyears[].col_B` | text / user | BP 201-E!B13:B17 | Explicit office input |
| `bp-201-e.official_outyears[].col_C` | currency / user | BP 201-E!C13:C17 | Explicit office input |
| `bp-201-e.official_outyears[].col_D` | currency / user | BP 201-E!D13:D17 | Explicit office input |
| `bp-201-e.official_outyears[].col_E` | currency / user | BP 201-E!E13:E17 | Explicit office input |
| `bp-201-e.official_outyears[].col_F` | currency / user | BP 201-E!F13:F17 | Explicit office input |
| `bp-201-e.official_outyears[].col_G` | currency / user | BP 201-E!G13:G17 | sum(col_C, col_D, col_E, col_F) |
| `bp-201-e.official_outyears[].col_H` | currency / user | BP 201-E!H13:H17 | Explicit office input |
| `bp-201-e.official_outyears[].col_I` | currency / user | BP 201-E!I13:I17 | Explicit office input |
| `bp-201-e.official_outyears[].col_J` | currency / user | BP 201-E!J13:J17 | Explicit office input |
| `bp-201-e.official_outyears[].col_K` | currency / user | BP 201-E!K13:K17 | Explicit office input |
| `bp-201-e.official_outyears[].col_L` | currency / user | BP 201-E!L13:L17 | sum(col_H, col_I, col_J, col_K) |
| `bp-201-e.official_outyears[].col_M` | currency / user | BP 201-E!M13:M17 | sum(col_G, col_L) |
| `bp-201-e.official_outyears[].col_N` | currency / user | BP 201-E!N13:N17 | Explicit office input |
| `bp-201-e.official_outyears[].col_O` | currency / user | BP 201-E!O13:O17 | Explicit office input |
| `bp-201-e.official_outyears[].col_P` | currency / user | BP 201-E!P13:P17 | Explicit office input |
| `bp-201-e.official_outyears[].col_Q` | currency / user | BP 201-E!Q13:Q17 | Explicit office input |
| `bp-201-e.official_outyears[].col_R` | currency / user | BP 201-E!R13:R17 | sum(col_N, col_O, col_P, col_Q) |
| `bp-201-e.official_outyears[].col_S` | currency / user | BP 201-E!S13:S17 | Explicit office input |
| `bp-201-e.official_outyears[].col_T` | currency / user | BP 201-E!T13:T17 | Explicit office input |
| `bp-201-e.official_outyears[].col_U` | currency / user | BP 201-E!U13:U17 | Explicit office input |
| `bp-201-e.official_outyears[].col_V` | currency / user | BP 201-E!V13:V17 | Explicit office input |
| `bp-201-e.official_outyears[].col_W` | currency / user | BP 201-E!W13:W17 | sum(col_S, col_T, col_U, col_V) |
| `bp-201-e.official_outyears[].col_X` | currency / user | BP 201-E!X13:X17 | sum(col_R, col_W) |
| `bp-201-e.reportRegion` | text / user | Shared/internal | Explicit office input |
| `bp-201-e.reportTier` | text / canonical | Shared/internal | proposalTier |
| `bp-201-e.preparedBy` | text / user | Shared/internal | Explicit office input |
| `bp-201-e.preparedTitle` | text / user | Shared/internal | Explicit office input |
| `bp-201-e.preparedBy2` | text / user | Shared/internal | Explicit office input |
| `bp-201-e.preparedTitle2` | text / user | Shared/internal | Explicit office input |
| `bp-201-e.certifiedBy` | text / user | Shared/internal | Explicit office input |
| `bp-201-e.certifiedTitle` | text / user | Shared/internal | Explicit office input |
| `bp-201-e.certifiedBy2` | text / user | Shared/internal | Explicit office input |
| `bp-201-e.certifiedTitle2` | text / user | Shared/internal | Explicit office input |
| `bp-201-e.approvedBy` | text / user | Shared/internal | Explicit office input |
| `bp-201-e.approvedTitle` | text / user | Shared/internal | Explicit office input |
| `bp-201-e.reportDate` | date / user | Shared/internal | Explicit office input |

### BP FORM 202 runtime fields

| Stored field path | Type / source | Reference | Calculation / prefill |
| --- | --- | --- | --- |
| `bp-202.department` | undefined / canonical | Shared/internal | department |
| `bp-202.agency` | undefined / canonical | Shared/internal | agency |
| `bp-202.fiscalYear` | undefined / canonical | Shared/internal | fiscalYear |
| `bp-202.operatingUnit` | undefined / canonical | Shared/internal | operatingUnit |
| `bp-202.appropriationSource` | undefined / canonical | Shared/internal | appropriationSource |
| `bp-202.prexcCode` | undefined / canonical | Shared/internal | prexcCode |
| `bp-202.projectName` | undefined / canonical | BP 202!A11 | projectName |
| `bp-202.implementingAgency` | undefined / canonical | BP 202!A12 | implementingAgency |
| `bp-202.programPap` | undefined / canonical | Shared/internal | programPap |
| `bp-202.objectives` | undefined / canonical | BP 202!A26 | objectives |
| `bp-202.projectDescription` | undefined / canonical | BP 202!A25 | projectDescription |
| `bp-202.location` | undefined / canonical | Shared/internal | location |
| `bp-202.implementationStart` | undefined / canonical | BP 202!B29 | implementationStart |
| `bp-202.implementationEnd` | undefined / canonical | BP 202!B30 | implementationEnd |
| `bp-202.fundingSource` | undefined / canonical | Shared/internal | fundingSource |
| `bp-202.costPs` | number / derived | Shared/internal | psTotal |
| `bp-202.costMooe` | number / derived | Shared/internal | mooeTotal |
| `bp-202.costCo` | number / derived | Shared/internal | coTotal |
| `bp-202.costFinex` | number / derived | Shared/internal | finexTotal |
| `bp-202.costTotal` | number / derived | BP 202!A24 | expenseTotal |
| `bp-202.projectType` | select / user | BP 202!A14 | Explicit office input |
| `bp-202.rationale` | textarea / user (legacy/internal) | Shared/internal | Explicit office input |
| `bp-202.beneficiaries` | textarea / user | BP 202!A27 | Explicit office input |
| `bp-202.implementationStrategy` | textarea / user (legacy/internal) | Shared/internal | Explicit office input |
| `bp-202.prerequisites` | textarea / user (legacy/internal) | Shared/internal | Explicit office input |
| `bp-202.physicalTargets` | textarea / user (legacy/internal) | Shared/internal | Explicit office input |
| `bp-202.priorityRanking` | number / user | BP 202!A13 | Explicit office input |
| `bp-202.infrastructure` | select / user | BP 202!E14 | Explicit office input |
| `bp-202.ictClassification` | select / user | BP 202!E15 | Explicit office input |
| `bp-202.pipCode` | text / user | BP 202!A20 | Explicit office input |
| `bp-202.originalProjectCost` | currency / user | BP 202!A22 | Explicit office input |
| `bp-202.revisedProjectCost` | currency / user | BP 202!A23 | Explicit office input |
| `bp-202.revisedStart` | date / user | BP 202!B32 | Explicit office input |
| `bp-202.revisedEnd` | date / user | BP 202!B33 | Explicit office input |
| `bp-202.fundingRequirements` | table / user (legacy/internal) | Shared/internal | Explicit office input |
| `bp-202.fundingRequirements[].pap` | text / user | Shared/internal | Explicit office input |
| `bp-202.fundingRequirements[].year` | number / user | Shared/internal | Explicit office input |
| `bp-202.fundingRequirements[].tier` | select / user | Shared/internal | Explicit office input |
| `bp-202.fundingRequirements[].expenseClass` | select / user | Shared/internal | Explicit office input |
| `bp-202.fundingRequirements[].amount` | number / user | Shared/internal | Explicit office input |
| `bp-202.official_papFunding` | table / user | BP 202!A36:F37 | pap-requirements-v1 |
| `bp-202.official_papFunding[].col_A` | text / user | BP 202!A36:A37 | Explicit office input |
| `bp-202.official_papFunding[].col_B` | currency / user | BP 202!B36:B37 | Explicit office input |
| `bp-202.official_papFunding[].col_C` | currency / user | BP 202!C36:C37 | Explicit office input |
| `bp-202.official_papFunding[].col_D` | currency / user | BP 202!D36:D37 | sum(col_B, col_C) |
| `bp-202.official_papFunding[].col_E` | currency / user | BP 202!E36:E37 | Explicit office input |
| `bp-202.official_papFunding[].col_F` | currency / user | BP 202!F36:F37 | Explicit office input |
| `bp-202.official_projectCost` | table / user | BP 202!A56:B56 | Explicit office input |
| `bp-202.official_projectCost[].col_A` | text / user | BP 202!A56:A56 | Explicit office input |
| `bp-202.official_projectCost[].col_B` | currency / user | BP 202!B56:B56 | Explicit office input |
| `bp-202.official_operatingCosts` | table / user | BP 202!A61:C61 | Explicit office input |
| `bp-202.official_operatingCosts[].col_A` | text / user | BP 202!A61:A61 | Explicit office input |
| `bp-202.official_operatingCosts[].col_B` | currency / user | BP 202!B61:B61 | Explicit office input |
| `bp-202.official_operatingCosts[].col_C` | currency / user | BP 202!C61:C61 | Explicit office input |
| `bp-202.official_components` | table / user | BP 202!A67:F67 | Explicit office input |
| `bp-202.official_components[].col_A` | text / user | BP 202!A67:A67 | Explicit office input |
| `bp-202.official_components[].col_B` | currency / user | BP 202!B67:B67 | Explicit office input |
| `bp-202.official_components[].col_C` | currency / user | BP 202!C67:C67 | Explicit office input |
| `bp-202.official_components[].col_D` | currency / user | BP 202!D67:D67 | Explicit office input |
| `bp-202.official_components[].col_E` | currency / user | BP 202!E67:E67 | Explicit office input |
| `bp-202.official_components[].col_F` | currency / user | BP 202!F67:F67 | Explicit office input |
| `bp-202.official_locations` | table / user | BP 202!A72:F72 | Explicit office input |
| `bp-202.official_locations[].col_A` | text / user | BP 202!A72:A72 | Explicit office input |
| `bp-202.official_locations[].col_B` | currency / user | BP 202!B72:B72 | Explicit office input |
| `bp-202.official_locations[].col_C` | currency / user | BP 202!C72:C72 | Explicit office input |
| `bp-202.official_locations[].col_D` | currency / user | BP 202!D72:D72 | Explicit office input |
| `bp-202.official_locations[].col_E` | currency / user | BP 202!E72:E72 | Explicit office input |
| `bp-202.official_locations[].col_F` | currency / user | BP 202!F72:F72 | Explicit office input |
| `bp-202.myca` | checkbox / user | BP 202!B15 | Explicit office input |
| `bp-202.official_physical` | table / user | BP 202!A42:B53 | Explicit office input |
| `bp-202.official_physical[].indicator` | text / user | Shared/internal | Explicit office input |
| `bp-202.official_physical[].actual` | text / user | Shared/internal | Explicit office input |
| `bp-202.official_physical[].current` | text / user | Shared/internal | Explicit office input |
| `bp-202.official_physical[].tier1` | text / user | Shared/internal | Explicit office input |
| `bp-202.official_physical[].tier2` | text / user | Shared/internal | Explicit office input |
| `bp-202.official_physical[].total` | text / user | Shared/internal | Explicit office input |
| `bp-202.official_physical[].outyear1` | text / user | Shared/internal | Explicit office input |
| `bp-202.official_physical[].outyear2` | text / user | Shared/internal | Explicit office input |
| `bp-202.preparedBy` | text / user | Shared/internal | Explicit office input |
| `bp-202.preparedTitle` | text / user | Shared/internal | Explicit office input |
| `bp-202.preparedBy2` | text / user | Shared/internal | Explicit office input |
| `bp-202.preparedTitle2` | text / user | Shared/internal | Explicit office input |
| `bp-202.certifiedBy` | text / user | Shared/internal | Explicit office input |
| `bp-202.certifiedTitle` | text / user | Shared/internal | Explicit office input |
| `bp-202.certifiedBy2` | text / user | Shared/internal | Explicit office input |
| `bp-202.certifiedTitle2` | text / user | Shared/internal | Explicit office input |
| `bp-202.approvedBy` | text / user | Shared/internal | Explicit office input |
| `bp-202.approvedTitle` | text / user | Shared/internal | Explicit office input |
| `bp-202.reportDate` | date / user | Shared/internal | Explicit office input |

### BP FORM 203 runtime fields

| Stored field path | Type / source | Reference | Calculation / prefill |
| --- | --- | --- | --- |
| `bp-203.department` | undefined / canonical | Shared/internal | department |
| `bp-203.agency` | undefined / canonical | Shared/internal | agency |
| `bp-203.fiscalYear` | undefined / canonical | Shared/internal | fiscalYear |
| `bp-203.operatingUnit` | undefined / canonical | Shared/internal | operatingUnit |
| `bp-203.appropriationSource` | undefined / canonical | Shared/internal | appropriationSource |
| `bp-203.prexcCode` | undefined / canonical | Shared/internal | prexcCode |
| `bp-203.programPap` | undefined / canonical | Shared/internal | programPap |
| `bp-203.objectives` | undefined / canonical | BP 203!A19 | objectives |
| `bp-203.projectDescription` | undefined / canonical | BP 203!A18 | projectDescription |
| `bp-203.location` | undefined / canonical | Shared/internal | location |
| `bp-203.implementationStart` | undefined / canonical | BP 203!B22 | implementationStart |
| `bp-203.implementationEnd` | undefined / canonical | BP 203!B23 | implementationEnd |
| `bp-203.financingType` | number / derived | Shared/internal | financingType |
| `bp-203.totalProjectCost` | number / derived | Shared/internal | expenseTotal |
| `bp-203.foreignInstitution` | text / user | Shared/internal | Explicit office input |
| `bp-203.countrySource` | text / user | Shared/internal | Explicit office input |
| `bp-203.foreignAmount` | currency / user | Shared/internal | Explicit office input |
| `bp-203.counterpartFunding` | currency / user | Shared/internal | Explicit office input |
| `bp-203.projectComponents` | textarea / user (legacy/internal) | Shared/internal | Explicit office input |
| `bp-203.outputs` | textarea / user | Shared/internal | Explicit office input |
| `bp-203.projectName` | text / canonical | BP 203!A11 | projectName |
| `bp-203.implementingAgency` | text / canonical | BP 203!A12 | implementingAgency |
| `bp-203.priorityRanking` | number / user | BP 203!A13 | Explicit office input |
| `bp-203.projectType` | select / user | BP 203!A14 | Explicit office input |
| `bp-203.infrastructure` | select / user | BP 203!E14 | Explicit office input |
| `bp-203.pipCode` | text / user | BP 203!A16 | Explicit office input |
| `bp-203.beneficiaries` | textarea / user | BP 203!A20 | Explicit office input |
| `bp-203.revisedStart` | date / user | BP 203!B25 | Explicit office input |
| `bp-203.revisedEnd` | date / user | BP 203!B26 | Explicit office input |
| `bp-203.costTotal` | currency / derived | BP 203!A17 | expenseTotal |
| `bp-203.official_implementation` | table / user | BP 203!A28:E29 | Explicit office input |
| `bp-203.official_implementation[].col_A` | text / user | BP 203!A28:A29 | Explicit office input |
| `bp-203.official_implementation[].col_B` | currency / user | BP 203!B28:B29 | Explicit office input |
| `bp-203.official_implementation[].col_C` | currency / user | BP 203!C28:C29 | Explicit office input |
| `bp-203.official_implementation[].col_D` | currency / user | BP 203!D28:D29 | Explicit office input |
| `bp-203.official_implementation[].col_E` | currency / user | BP 203!E28:E29 | sum(col_B, col_C, col_D) |
| `bp-203.official_projectCost` | table / user | BP 203!A35:E37 | Explicit office input |
| `bp-203.official_projectCost[].col_A` | text / user | BP 203!A35:A37 | Explicit office input |
| `bp-203.official_projectCost[].col_B` | currency / user | BP 203!B35:B37 | Explicit office input |
| `bp-203.official_projectCost[].col_C` | currency / user | BP 203!C35:C37 | Explicit office input |
| `bp-203.official_projectCost[].col_D` | currency / user | BP 203!D35:D37 | Explicit office input |
| `bp-203.official_projectCost[].col_E` | currency / user | BP 203!E35:E37 | sum(col_B, col_C, col_D) |
| `bp-203.official_comparative` | table / user | BP 203!A42:H43 | Explicit office input |
| `bp-203.official_comparative[].col_A` | text / user | BP 203!A42:A43 | Explicit office input |
| `bp-203.official_comparative[].col_B` | currency / user | BP 203!B42:B43 | Explicit office input |
| `bp-203.official_comparative[].col_C` | currency / user | BP 203!C42:C43 | Explicit office input |
| `bp-203.official_comparative[].col_D` | currency / user | BP 203!D42:D43 | Explicit office input |
| `bp-203.official_comparative[].col_E` | currency / user | BP 203!E42:E43 | Explicit office input |
| `bp-203.official_comparative[].col_F` | currency / user | BP 203!F42:F43 | sum(col_D, col_E) |
| `bp-203.official_comparative[].col_G` | currency / user | BP 203!G42:G43 | Explicit office input |
| `bp-203.official_comparative[].col_H` | currency / user | BP 203!H42:H43 | Explicit office input |
| `bp-203.official_components` | table / user | BP 203!A47:S49 | Explicit office input |
| `bp-203.official_components[].col_A` | text / user | BP 203!A47:A49 | Explicit office input |
| `bp-203.official_components[].col_B` | currency / user | BP 203!B47:B49 | Explicit office input |
| `bp-203.official_components[].col_C` | currency / user | BP 203!C47:C49 | Explicit office input |
| `bp-203.official_components[].col_D` | currency / user | BP 203!D47:D49 | Explicit office input |
| `bp-203.official_components[].col_E` | currency / user | BP 203!E47:E49 | sum(col_B, col_C, col_D) |
| `bp-203.official_components[].col_F` | currency / user | BP 203!F47:F49 | Explicit office input |
| `bp-203.official_components[].col_G` | currency / user | BP 203!G47:G49 | Explicit office input |
| `bp-203.official_components[].col_H` | currency / user | BP 203!H47:H49 | Explicit office input |
| `bp-203.official_components[].col_I` | currency / user | BP 203!I47:I49 | sum(col_F, col_G, col_H) |
| `bp-203.official_components[].col_J` | currency / user | BP 203!J47:J49 | Explicit office input |
| `bp-203.official_components[].col_K` | currency / user | BP 203!K47:K49 | Explicit office input |
| `bp-203.official_components[].col_L` | currency / user | BP 203!L47:L49 | Explicit office input |
| `bp-203.official_components[].col_M` | currency / user | BP 203!M47:M49 | Explicit office input |
| `bp-203.official_components[].col_N` | currency / user | BP 203!N47:N49 | Explicit office input |
| `bp-203.official_components[].col_O` | currency / user | BP 203!O47:O49 | sum(col_L, col_M, col_N) |
| `bp-203.official_components[].col_P` | currency / user | BP 203!P47:P49 | sum(col_B, col_F, col_J, col_L) |
| `bp-203.official_components[].col_Q` | currency / user | BP 203!Q47:Q49 | sum(col_C, col_G, col_K, col_M) |
| `bp-203.official_components[].col_R` | currency / user | BP 203!R47:R49 | sum(col_D, col_H, col_N) |
| `bp-203.official_components[].col_S` | currency / user | BP 203!S47:S49 | sum(col_P, col_Q, col_R) |
| `bp-203.official_physical` | table / user | BP 203!A54:S57 | Explicit office input |
| `bp-203.official_physical[].col_A` | text / user | BP 203!A54:A57 | Explicit office input |
| `bp-203.official_physical[].col_B` | text / user | BP 203!B54:B57 | Explicit office input |
| `bp-203.official_physical[].col_C` | text / user | BP 203!C54:C57 | Explicit office input |
| `bp-203.official_physical[].col_D` | text / user | BP 203!D54:D57 | Explicit office input |
| `bp-203.official_physical[].col_E` | text / user | BP 203!E54:E57 | Explicit office input |
| `bp-203.official_physical[].col_F` | text / user | BP 203!F54:F57 | Explicit office input |
| `bp-203.official_physical[].col_G` | text / user | BP 203!G54:G57 | Explicit office input |
| `bp-203.official_physical[].col_H` | text / user | BP 203!H54:H57 | Explicit office input |
| `bp-203.official_physical[].col_I` | text / user | BP 203!I54:I57 | Explicit office input |
| `bp-203.official_physical[].col_J` | text / user | BP 203!J54:J57 | Explicit office input |
| `bp-203.official_physical[].col_K` | text / user | BP 203!K54:K57 | Explicit office input |
| `bp-203.official_physical[].col_L` | text / user | BP 203!L54:L57 | Explicit office input |
| `bp-203.official_physical[].col_M` | text / user | BP 203!M54:M57 | Explicit office input |
| `bp-203.official_physical[].col_N` | text / user | BP 203!N54:N57 | Explicit office input |
| `bp-203.official_physical[].col_O` | text / user | BP 203!O54:O57 | Explicit office input |
| `bp-203.official_physical[].col_P` | text / user | BP 203!P54:P57 | Explicit office input |
| `bp-203.official_physical[].col_Q` | text / user | BP 203!Q54:Q57 | Explicit office input |
| `bp-203.official_physical[].col_R` | text / user | BP 203!R54:R57 | Explicit office input |
| `bp-203.official_physical[].col_S` | text / user | BP 203!S54:S57 | Explicit office input |
| `bp-203.preparedBy` | text / user | Shared/internal | Explicit office input |
| `bp-203.preparedTitle` | text / user | Shared/internal | Explicit office input |
| `bp-203.preparedBy2` | text / user | Shared/internal | Explicit office input |
| `bp-203.preparedTitle2` | text / user | Shared/internal | Explicit office input |
| `bp-203.certifiedBy` | text / user | Shared/internal | Explicit office input |
| `bp-203.certifiedTitle` | text / user | Shared/internal | Explicit office input |
| `bp-203.certifiedBy2` | text / user | Shared/internal | Explicit office input |
| `bp-203.certifiedTitle2` | text / user | Shared/internal | Explicit office input |
| `bp-203.approvedBy` | text / user | Shared/internal | Explicit office input |
| `bp-203.approvedTitle` | text / user | Shared/internal | Explicit office input |
| `bp-203.reportDate` | date / user | Shared/internal | Explicit office input |

### BP FORM 204 runtime fields

| Stored field path | Type / source | Reference | Calculation / prefill |
| --- | --- | --- | --- |
| `bp-204.department` | undefined / canonical | Shared/internal | department |
| `bp-204.agency` | undefined / canonical | Shared/internal | agency |
| `bp-204.fiscalYear` | undefined / canonical | Shared/internal | fiscalYear |
| `bp-204.operatingUnit` | undefined / canonical | Shared/internal | operatingUnit |
| `bp-204.appropriationSource` | undefined / canonical | Shared/internal | appropriationSource |
| `bp-204.prexcCode` | undefined / canonical | Shared/internal | prexcCode |
| `bp-204.positions` | table / user (legacy/internal) | Shared/internal | Explicit office input |
| `bp-204.positions[].pap` | text / user | Shared/internal | Explicit office input |
| `bp-204.positions[].unit` | text / user | Shared/internal | Explicit office input |
| `bp-204.positions[].position` | text / user | Shared/internal | Explicit office input |
| `bp-204.positions[].classification` | select / user | Shared/internal | Explicit office input |
| `bp-204.positions[].tier` | select / user | Shared/internal | Explicit office input |
| `bp-204.positions[].salaryGrade` | number / user | Shared/internal | Explicit office input |
| `bp-204.positions[].positions` | number / user | Shared/internal | Explicit office input |
| `bp-204.positions[].months` | number / user | Shared/internal | Explicit office input |
| `bp-204.positions[].totalMonths` | number / user | Shared/internal | multiply(positions, months) |
| `bp-204.positions[].monthlyRate` | number / user | Shared/internal | Explicit office input |
| `bp-204.positions[].salary` | number / user | Shared/internal | multiply(totalMonths, monthlyRate) |
| `bp-204.positions[].pera` | number / user | Shared/internal | Explicit office input |
| `bp-204.positions[].rata` | number / user | Shared/internal | Explicit office input |
| `bp-204.positions[].clothing` | number / user | Shared/internal | Explicit office input |
| `bp-204.positions[].midYear` | number / user | Shared/internal | Explicit office input |
| `bp-204.positions[].yearEnd` | number / user | Shared/internal | Explicit office input |
| `bp-204.positions[].cashGift` | number / user | Shared/internal | Explicit office input |
| `bp-204.positions[].pei` | number / user | Shared/internal | Explicit office input |
| `bp-204.positions[].rlip` | number / user | Shared/internal | Explicit office input |
| `bp-204.positions[].pagibig` | number / user | Shared/internal | Explicit office input |
| `bp-204.positions[].ecip` | number / user | Shared/internal | Explicit office input |
| `bp-204.positions[].phic` | number / user | Shared/internal | Explicit office input |
| `bp-204.positions[].medical` | number / user | Shared/internal | Explicit office input |
| `bp-204.positions[].magnaCarta` | number / user | Shared/internal | Explicit office input |
| `bp-204.positions[].otherCompensation` | number / user | Shared/internal | sum(pera, rata, clothing, midYear, yearEnd, cashGift, pei, rlip, pagibig, ecip, phic, medical, magnaCarta) |
| `bp-204.positions[].totalCompensation` | number / user | Shared/internal | sum(salary, otherCompensation) |
| `bp-204.fundingSource` | undefined / canonical | Shared/internal | fundingSource |
| `bp-204.position` | text / user (legacy/internal) | Shared/internal | Explicit office input |
| `bp-204.employmentType` | select / user (legacy/internal) | Shared/internal | Explicit office input |
| `bp-204.numberOfPersonnel` | number / user (legacy/internal) | Shared/internal | Explicit office input |
| `bp-204.salaryRate` | number / user (legacy/internal) | Shared/internal | Explicit office input |
| `bp-204.annualRequirement` | number / user (legacy/internal) | Shared/internal | Explicit office input |
| `bp-204.justification` | textarea / user (legacy/internal) | Shared/internal | Explicit office input |
| `bp-204.official_positions` | table / user | BP 204!A14:Y16 | Explicit office input |
| `bp-204.official_positions[].tier` | select / user | Shared/internal | Explicit office input |
| `bp-204.official_positions[].classification` | select / user | Shared/internal | Explicit office input |
| `bp-204.official_positions[].col_A` | text / user | BP 204!A14:A16 | Explicit office input |
| `bp-204.official_positions[].col_B` | text / user | BP 204!B14:B16 | Explicit office input |
| `bp-204.official_positions[].col_C` | text / user | BP 204!C14:C16 | Explicit office input |
| `bp-204.official_positions[].col_D` | number / user | BP 204!D14:D16 | Explicit office input |
| `bp-204.official_positions[].col_E` | number / user | BP 204!E14:E16 | Explicit office input |
| `bp-204.official_positions[].col_F` | number / user | BP 204!F14:F16 | Explicit office input |
| `bp-204.official_positions[].col_G` | number / user | BP 204!G14:G16 | multiply(col_E, col_F) |
| `bp-204.official_positions[].col_H` | currency / user | BP 204!H14:H16 | Explicit office input |
| `bp-204.official_positions[].col_I` | text / user | BP 204!I14:I16 | Explicit office input |
| `bp-204.official_positions[].col_J` | currency / user | BP 204!J14:J16 | multiply(col_G, col_H) |
| `bp-204.official_positions[].col_K` | currency / user | BP 204!K14:K16 | Explicit office input |
| `bp-204.official_positions[].col_L` | currency / user | BP 204!L14:L16 | Explicit office input |
| `bp-204.official_positions[].col_M` | currency / user | BP 204!M14:M16 | Explicit office input |
| `bp-204.official_positions[].col_N` | currency / user | BP 204!N14:N16 | Explicit office input |
| `bp-204.official_positions[].col_O` | currency / user | BP 204!O14:O16 | Explicit office input |
| `bp-204.official_positions[].col_P` | currency / user | BP 204!P14:P16 | Explicit office input |
| `bp-204.official_positions[].col_Q` | currency / user | BP 204!Q14:Q16 | Explicit office input |
| `bp-204.official_positions[].col_R` | currency / user | BP 204!R14:R16 | Explicit office input |
| `bp-204.official_positions[].col_S` | currency / user | BP 204!S14:S16 | Explicit office input |
| `bp-204.official_positions[].col_T` | currency / user | BP 204!T14:T16 | Explicit office input |
| `bp-204.official_positions[].col_U` | currency / user | BP 204!U14:U16 | Explicit office input |
| `bp-204.official_positions[].col_V` | currency / user | BP 204!V14:V16 | Explicit office input |
| `bp-204.official_positions[].col_W` | currency / user | BP 204!W14:W16 | Explicit office input |
| `bp-204.official_positions[].col_X` | currency / user | BP 204!X14:X16 | sum(col_K, col_L, col_M, col_N, col_O, col_P, col_Q, col_R, col_S, col_T, col_U, col_V, col_W) |
| `bp-204.official_positions[].col_Y` | currency / user | BP 204!Y14:Y16 | sum(col_J, col_X) |
| `bp-204.reportRegion` | text / user | Shared/internal | Explicit office input |
| `bp-204.reportTier` | text / canonical | Shared/internal | proposalTier |
| `bp-204.preparedBy` | text / user | Shared/internal | Explicit office input |
| `bp-204.preparedTitle` | text / user | Shared/internal | Explicit office input |
| `bp-204.preparedBy2` | text / user | Shared/internal | Explicit office input |
| `bp-204.preparedTitle2` | text / user | Shared/internal | Explicit office input |
| `bp-204.certifiedBy` | text / user | Shared/internal | Explicit office input |
| `bp-204.certifiedTitle` | text / user | Shared/internal | Explicit office input |
| `bp-204.certifiedBy2` | text / user | Shared/internal | Explicit office input |
| `bp-204.certifiedTitle2` | text / user | Shared/internal | Explicit office input |
| `bp-204.approvedBy` | text / user | Shared/internal | Explicit office input |
| `bp-204.approvedTitle` | text / user | Shared/internal | Explicit office input |
| `bp-204.reportDate` | date / user | Shared/internal | Explicit office input |

### BP FORM 205 runtime fields

| Stored field path | Type / source | Reference | Calculation / prefill |
| --- | --- | --- | --- |
| `bp-205.prexcCode` | text / canonical | Shared/internal | prexcCode |
| `bp-205.appropriationSource` | text / canonical | Shared/internal | appropriationSource |
| `bp-205.operatingUnit` | text / canonical | Shared/internal | operatingUnit |
| `bp-205.fiscalYear` | text / canonical | Shared/internal | fiscalYear |
| `bp-205.department` | undefined / canonical | Shared/internal | department |
| `bp-205.agency` | undefined / canonical | Shared/internal | agency |
| `bp-205.employeeName` | text / user (legacy/internal) | Shared/internal | Explicit office input |
| `bp-205.positionTitle` | text / user (legacy/internal) | Shared/internal | Explicit office input |
| `bp-205.salaryGrade` | text / user (legacy/internal) | Shared/internal | Explicit office input |
| `bp-205.retirementDate` | date / user (legacy/internal) | Shared/internal | Explicit office input |
| `bp-205.retirementType` | select / user | Shared/internal | Explicit office input |
| `bp-205.terminalLeave` | number / user (legacy/internal) | Shared/internal | Explicit office input |
| `bp-205.gratuity` | number / user (legacy/internal) | Shared/internal | Explicit office input |
| `bp-205.official_retirees` | table / user | BP 205!A14:M17 | Explicit office input |
| `bp-205.official_retirees[].col_A` | text / user | BP 205!A14:A17 | Explicit office input |
| `bp-205.official_retirees[].col_B` | text / user | BP 205!B14:B17 | Explicit office input |
| `bp-205.official_retirees[].col_C` | text / user | BP 205!C14:C17 | Explicit office input |
| `bp-205.official_retirees[].col_D` | date / user | BP 205!D14:D17 | Explicit office input |
| `bp-205.official_retirees[].col_E` | date / user | BP 205!E14:E17 | Explicit office input |
| `bp-205.official_retirees[].col_F` | date / user | BP 205!F14:F17 | Explicit office input |
| `bp-205.official_retirees[].col_G` | currency / user | BP 205!G14:G17 | Explicit office input |
| `bp-205.official_retirees[].col_H` | number / user | BP 205!H14:H17 | Explicit office input |
| `bp-205.official_retirees[].col_I` | number / user | BP 205!I14:I17 | Explicit office input |
| `bp-205.official_retirees[].leaveCredits` | number / user | Shared/internal | sum(col_H, col_I) |
| `bp-205.official_retirees[].terminalLeaveFactor` | number / user | Shared/internal | Explicit office input |
| `bp-205.official_retirees[].col_J` | currency / user | BP 205!J14:J17 | multiply(col_G, leaveCredits, terminalLeaveFactor) |
| `bp-205.official_retirees[].col_K` | number / user | BP 205!K14:K17 | Explicit office input |
| `bp-205.official_retirees[].col_L` | number / user | BP 205!L14:L17 | Explicit office input |
| `bp-205.official_retirees[].col_M` | currency / user | BP 205!M14:M17 | Explicit office input |
| `bp-205.preparedBy` | text / user | Shared/internal | Explicit office input |
| `bp-205.preparedTitle` | text / user | Shared/internal | Explicit office input |
| `bp-205.preparedBy2` | text / user | Shared/internal | Explicit office input |
| `bp-205.preparedTitle2` | text / user | Shared/internal | Explicit office input |
| `bp-205.certifiedBy` | text / user | Shared/internal | Explicit office input |
| `bp-205.certifiedTitle` | text / user | Shared/internal | Explicit office input |
| `bp-205.certifiedBy2` | text / user | Shared/internal | Explicit office input |
| `bp-205.certifiedTitle2` | text / user | Shared/internal | Explicit office input |
| `bp-205.approvedBy` | text / user | Shared/internal | Explicit office input |
| `bp-205.approvedTitle` | text / user | Shared/internal | Explicit office input |
| `bp-205.reportDate` | date / user | Shared/internal | Explicit office input |

### BP FORM 206 runtime fields

| Stored field path | Type / source | Reference | Calculation / prefill |
| --- | --- | --- | --- |
| `bp-206.department` | undefined / canonical | Shared/internal | department |
| `bp-206.agency` | undefined / canonical | Shared/internal | agency |
| `bp-206.fiscalYear` | undefined / canonical | Shared/internal | fiscalYear |
| `bp-206.operatingUnit` | undefined / canonical | Shared/internal | operatingUnit |
| `bp-206.appropriationSource` | undefined / canonical | Shared/internal | appropriationSource |
| `bp-206.prexcCode` | undefined / canonical | Shared/internal | prexcCode |
| `bp-206.programPap` | undefined / canonical | Shared/internal | programPap |
| `bp-206.objectives` | undefined / canonical | Shared/internal | objectives |
| `bp-206.projectDescription` | undefined / canonical | Shared/internal | projectDescription |
| `bp-206.location` | undefined / canonical | Shared/internal | location |
| `bp-206.implementationStart` | undefined / canonical | Shared/internal | implementationStart |
| `bp-206.implementationEnd` | undefined / canonical | Shared/internal | implementationEnd |
| `bp-206.fundingSource` | undefined / canonical | Shared/internal | fundingSource |
| `bp-206.budgetRequirement` | number / derived | Shared/internal | convergenceTotal |
| `bp-206.convergenceProgram` | text / user | Shared/internal | Explicit office input |
| `bp-206.leadAgency` | text / user | Shared/internal | Explicit office input |
| `bp-206.participatingAgencies` | textarea / user | Shared/internal | Explicit office input |
| `bp-206.physicalTarget` | textarea / user | Shared/internal | Explicit office input |
| `bp-206.official_agencies` | table / user | BP 206!A16:D16 | Explicit office input |
| `bp-206.official_agencies[].col_A` | text / user | BP 206!A16:A16 | Explicit office input |
| `bp-206.official_agencies[].col_B` | text / user | BP 206!B16:B16 | Explicit office input |
| `bp-206.official_agencies[].col_C` | text / user | BP 206!C16:C16 | Explicit office input |
| `bp-206.official_agencies[].col_D` | text / user | BP 206!D16:D16 | Explicit office input |
| `bp-206.official_funding` | table / user | BP 206!A25:F26 | Explicit office input |
| `bp-206.official_funding[].col_A` | text / user | BP 206!A25:A26 | Explicit office input |
| `bp-206.official_funding[].col_B` | text / user | BP 206!B25:B26 | Explicit office input |
| `bp-206.official_funding[].col_C` | currency / user | BP 206!C25:C26 | Explicit office input |
| `bp-206.official_funding[].col_D` | currency / user | BP 206!D25:D26 | Explicit office input |
| `bp-206.official_funding[].col_E` | currency / user | BP 206!E25:E26 | Explicit office input |
| `bp-206.official_funding[].col_F` | currency / user | BP 206!F25:F26 | Explicit office input |
| `bp-206.official_physical` | table / user | BP 206!A37:G39 | Explicit office input |
| `bp-206.official_physical[].col_A` | text / user | BP 206!A37:A39 | Explicit office input |
| `bp-206.official_physical[].col_B` | text / user | BP 206!B37:B39 | Explicit office input |
| `bp-206.official_physical[].col_C` | text / user | BP 206!C37:C39 | Explicit office input |
| `bp-206.official_physical[].col_D` | text / user | BP 206!D37:D39 | Explicit office input |
| `bp-206.official_physical[].col_E` | text / user | BP 206!E37:E39 | Explicit office input |
| `bp-206.official_physical[].col_F` | text / user | BP 206!F37:F39 | Explicit office input |
| `bp-206.official_physical[].col_G` | text / user | BP 206!G37:G39 | Explicit office input |
| `bp-206.cabinetCluster` | text / user | BP 206!A12 | Explicit office input |
| `bp-206.strategies` | textarea / user | BP 206!A42 | Explicit office input |
| `bp-206.implementationMeasures` | textarea / user | NBM 156 p.88, BP 206 item 9 | Explicit office input |
| `bp-206.preparedBy` | text / user | Shared/internal | Explicit office input |
| `bp-206.preparedTitle` | text / user | Shared/internal | Explicit office input |
| `bp-206.preparedBy2` | text / user | Shared/internal | Explicit office input |
| `bp-206.preparedTitle2` | text / user | Shared/internal | Explicit office input |
| `bp-206.certifiedBy` | text / user | Shared/internal | Explicit office input |
| `bp-206.certifiedTitle` | text / user | Shared/internal | Explicit office input |
| `bp-206.certifiedBy2` | text / user | Shared/internal | Explicit office input |
| `bp-206.certifiedTitle2` | text / user | Shared/internal | Explicit office input |
| `bp-206.approvedBy` | text / user | Shared/internal | Explicit office input |
| `bp-206.approvedTitle` | text / user | Shared/internal | Explicit office input |
| `bp-206.reportDate` | date / user | Shared/internal | Explicit office input |

### BP FORM 207 runtime fields

| Stored field path | Type / source | Reference | Calculation / prefill |
| --- | --- | --- | --- |
| `bp-207.department` | undefined / canonical | Shared/internal | department |
| `bp-207.agency` | undefined / canonical | Shared/internal | agency |
| `bp-207.fiscalYear` | undefined / canonical | Shared/internal | fiscalYear |
| `bp-207.operatingUnit` | undefined / canonical | Shared/internal | operatingUnit |
| `bp-207.appropriationSource` | undefined / canonical | Shared/internal | appropriationSource |
| `bp-207.prexcCode` | undefined / canonical | Shared/internal | prexcCode |
| `bp-207.programPap` | undefined / canonical | Shared/internal | programPap |
| `bp-207.location` | undefined / canonical | Shared/internal | location |
| `bp-207.fundingSource` | undefined / canonical | Shared/internal | fundingSource |
| `bp-207.taggedAmount` | number / derived | Shared/internal | climateTotal |
| `bp-207.expenseTotal` | number / derived | Shared/internal | expenseTotal |
| `bp-207.typology` | number / derived | Shared/internal | climateTypologies |
| `bp-207.adaptationMitigation` | number / derived | Shared/internal | climateClassifications |
| `bp-207.climateTag` | text / user | Shared/internal | Explicit office input |
| `bp-207.physicalOutput` | textarea / user | Shared/internal | Explicit office input |
| `bp-207.official_climateProposed` | table / user | BP 207!A13:L16 | climate-proposed-v1 |
| `bp-207.official_climateProposed[].col_A` | text / user | BP 207!A13:A16 | Explicit office input |
| `bp-207.official_climateProposed[].col_B` | text / user | BP 207!B13:B16 | Explicit office input |
| `bp-207.official_climateProposed[].col_C` | text / user | BP 207!C13:C16 | Explicit office input |
| `bp-207.official_climateProposed[].col_D` | currency / user | BP 207!D13:D16 | Explicit office input |
| `bp-207.official_climateProposed[].col_E` | currency / user | BP 207!E13:E16 | Explicit office input |
| `bp-207.official_climateProposed[].col_F` | currency / user | BP 207!F13:F16 | sum(col_D, col_E) |
| `bp-207.official_climateProposed[].col_G` | currency / user | BP 207!G13:G16 | Explicit office input |
| `bp-207.official_climateProposed[].col_H` | currency / user | BP 207!H13:H16 | Explicit office input |
| `bp-207.official_climateProposed[].col_I` | currency / user | BP 207!I13:I16 | sum(col_G, col_H) |
| `bp-207.official_climateProposed[].col_J` | currency / user | BP 207!J13:J16 | sum(col_D, col_G) |
| `bp-207.official_climateProposed[].col_K` | currency / user | BP 207!K13:K16 | sum(col_E, col_H) |
| `bp-207.official_climateProposed[].col_L` | currency / user | BP 207!L13:L16 | sum(col_J, col_K) |
| `bp-207.official_climateActual` | table / user | BP 207!A24:F26 | Explicit office input |
| `bp-207.official_climateActual[].col_A` | text / user | BP 207!A24:A26 | Explicit office input |
| `bp-207.official_climateActual[].col_B` | text / user | BP 207!B24:B26 | Explicit office input |
| `bp-207.official_climateActual[].col_C` | text / user | BP 207!C24:C26 | Explicit office input |
| `bp-207.official_climateActual[].col_D` | currency / user | BP 207!D24:D26 | Explicit office input |
| `bp-207.official_climateActual[].col_E` | currency / user | BP 207!E24:E26 | Explicit office input |
| `bp-207.official_climateActual[].col_F` | currency / user | BP 207!F24:F26 | sum(col_D, col_E) |
| `bp-207.official_climateActualSummary` | table / user | NBM 156 p.92, climate summary | Explicit office input |
| `bp-207.official_climateActualSummary[].col_A` | text / user | NBM 156 p.92, climate summary column 1 | Explicit office input |
| `bp-207.official_climateActualSummary[].col_B` | currency / user | NBM 156 p.92, climate summary column 2 | Explicit office input |
| `bp-207.official_climateActualSummary[].col_C` | currency / user | NBM 156 p.92, climate summary column 3 | Explicit office input |
| `bp-207.official_climateActualSummary[].col_D` | currency / user | NBM 156 p.92, climate summary column 4 | sum(col_B, col_C) |
| `bp-207.official_climateCurrent` | table / user | NBM 156 p.93, current climate expenditure columns 1-6 | Explicit office input |
| `bp-207.official_climateCurrent[].col_A` | text / user | NBM 156 p.93 column 1 | Explicit office input |
| `bp-207.official_climateCurrent[].col_B` | text / user | NBM 156 p.93 column 2 | Explicit office input |
| `bp-207.official_climateCurrent[].col_C` | text / user | NBM 156 p.93 column 3 | Explicit office input |
| `bp-207.official_climateCurrent[].col_D` | currency / user | NBM 156 p.93 column 4 | Explicit office input |
| `bp-207.official_climateCurrent[].col_E` | currency / user | NBM 156 p.93 column 5 | Explicit office input |
| `bp-207.official_climateCurrent[].col_F` | currency / user | NBM 156 p.93 column 6 | sum(col_D, col_E) |
| `bp-207.official_climateCurrentSummary` | table / user | NBM 156 p.93, climate summary | Explicit office input |
| `bp-207.official_climateCurrentSummary[].col_A` | text / user | NBM 156 p.93, climate summary column 1 | Explicit office input |
| `bp-207.official_climateCurrentSummary[].col_B` | currency / user | NBM 156 p.93, climate summary column 2 | Explicit office input |
| `bp-207.official_climateCurrentSummary[].col_C` | currency / user | NBM 156 p.93, climate summary column 3 | Explicit office input |
| `bp-207.official_climateCurrentSummary[].col_D` | currency / user | NBM 156 p.93, climate summary column 4 | sum(col_B, col_C) |
| `bp-207.official_climateSummary` | table / user | BP 207!A41:D41 | climate-summary-v1 |
| `bp-207.official_climateSummary[].col_A` | text / user | BP 207!A41:A41 | Explicit office input |
| `bp-207.official_climateSummary[].col_B` | currency / user | BP 207!B41:B41 | Explicit office input |
| `bp-207.official_climateSummary[].col_C` | currency / user | BP 207!C41:C41 | Explicit office input |
| `bp-207.official_climateSummary[].col_D` | currency / user | BP 207!D41:D41 | sum(col_B, col_C) |
| `bp-207.preparedBy` | text / user | Shared/internal | Explicit office input |
| `bp-207.preparedTitle` | text / user | Shared/internal | Explicit office input |
| `bp-207.preparedBy2` | text / user | Shared/internal | Explicit office input |
| `bp-207.preparedTitle2` | text / user | Shared/internal | Explicit office input |
| `bp-207.certifiedBy` | text / user | Shared/internal | Explicit office input |
| `bp-207.certifiedTitle` | text / user | Shared/internal | Explicit office input |
| `bp-207.certifiedBy2` | text / user | Shared/internal | Explicit office input |
| `bp-207.certifiedTitle2` | text / user | Shared/internal | Explicit office input |
| `bp-207.approvedBy` | text / user | Shared/internal | Explicit office input |
| `bp-207.approvedTitle` | text / user | Shared/internal | Explicit office input |
| `bp-207.reportDate` | date / user | Shared/internal | Explicit office input |

### BP FORM 300 runtime fields

| Stored field path | Type / source | Reference | Calculation / prefill |
| --- | --- | --- | --- |
| `bp-300.prexcCode` | text / canonical | Shared/internal | prexcCode |
| `bp-300.appropriationSource` | text / canonical | Shared/internal | appropriationSource |
| `bp-300.operatingUnit` | text / canonical | Shared/internal | operatingUnit |
| `bp-300.fiscalYear` | text / canonical | Shared/internal | fiscalYear |
| `bp-300.agency` | text / canonical | Shared/internal | agency |
| `bp-300.department` | text / canonical | Shared/internal | department |
| `bp-300.official_provisions` | table / user | BP 300!A11:C12 | Explicit office input |
| `bp-300.official_provisions[].col_A` | text / user | BP 300!A11:A12 | Explicit office input |
| `bp-300.official_provisions[].col_B` | text / user | BP 300!B11:B12 | Explicit office input |
| `bp-300.official_provisions[].col_C` | textarea / user | BP 300!C11:C12 | Explicit office input |
| `bp-300.preparedBy` | text / user | Shared/internal | Explicit office input |
| `bp-300.preparedTitle` | text / user | Shared/internal | Explicit office input |
| `bp-300.preparedBy2` | text / user | Shared/internal | Explicit office input |
| `bp-300.preparedTitle2` | text / user | Shared/internal | Explicit office input |
| `bp-300.certifiedBy` | text / user | Shared/internal | Explicit office input |
| `bp-300.certifiedTitle` | text / user | Shared/internal | Explicit office input |
| `bp-300.certifiedBy2` | text / user | Shared/internal | Explicit office input |
| `bp-300.certifiedTitle2` | text / user | Shared/internal | Explicit office input |
| `bp-300.approvedBy` | text / user | Shared/internal | Explicit office input |
| `bp-300.approvedTitle` | text / user | Shared/internal | Explicit office input |
| `bp-300.reportDate` | date / user | Shared/internal | Explicit office input |
