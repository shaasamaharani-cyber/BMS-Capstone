/**
 * System Name: Budget Management System
 * Module Name: BP Forms Module
 *
 * Purpose of this file:
 * Catalogue of the DBM Budget Preparation (BP) forms used in FY2027 - what each form is, who completes it,
 * how much of it can be automated, and which engine renders it. Kept as data so the list can be configured
 * for each budget cycle instead of being hard-coded into pages.
 *
 * Author(s): QUT Group T214
 *
 * Copyright (C) 2026
 * by the Department of Science and Technology - Central Office
 * All rights reserved.
 */

import { OFFICIAL_WORKBOOK_FORMS } from './official_workbook_manifest.js';

export const FORM_LEVEL = {
  REQUEST: 'request',
  AGENCY: 'agency',
};

// dynamic = defined in bp_form_fields.js, schema = existing Team 27 form engine, pending = layout not built yet
export const FORM_ENGINE = {
  DYNAMIC: 'dynamic',
  SCHEMA: 'schema',
  PENDING: 'pending',
  MANUAL: 'manual',
};

export const AUTOMATION_LEVEL = {
  AUTO: 'auto',
  AUTO_PLUS: 'auto_plus',
  MANUAL: 'manual',
};

export const AUTOMATION_LABELS = {
  auto: 'Fully generated',
  auto_plus: 'Generated + extra input',
  manual: 'Manual input',
};

// Source: team research (Brandon Findlay, FY2027 BP form analysis). Rules and owners are proposals pending DOST confirmation.
export const BP_FORM_CATALOG = [
  { id: 'bp-a', code: 'BP Form A', name: 'Program Budget Matrix', level: FORM_LEVEL.REQUEST, engine: FORM_ENGINE.DYNAMIC, automation: AUTOMATION_LEVEL.AUTO_PLUS, completedBy: 'Proposing office, reviewed by Budget Office' },
  { id: 'bp-b', code: 'BP Form B', name: 'Agency Performance Measures', level: FORM_LEVEL.AGENCY, engine: FORM_ENGINE.DYNAMIC, automation: AUTOMATION_LEVEL.AUTO_PLUS, completedBy: 'Program / project owner' },
  { id: 'bp-c', code: 'BP Form C', name: 'RDC Inputs and Recommendations on New and Expanded Programs/Projects', level: FORM_LEVEL.AGENCY, engine: FORM_ENGINE.DYNAMIC, automation: AUTOMATION_LEVEL.AUTO_PLUS, completedBy: 'Budget Office / Planning personnel' },
  { id: 'bp-d', code: 'BP Form D', name: 'CSO Inputs on Ongoing and New Spending', level: FORM_LEVEL.AGENCY, engine: FORM_ENGINE.DYNAMIC, automation: AUTOMATION_LEVEL.AUTO_PLUS, completedBy: 'Budget Office / Planning personnel' },
  { id: 'bp-100', code: 'BP Form 100', name: 'Statement of Revenues - General Fund', level: FORM_LEVEL.AGENCY, engine: FORM_ENGINE.SCHEMA, schemaId: 'bp-form-100', automation: AUTOMATION_LEVEL.AUTO, completedBy: 'Budget / Finance Office' },
  { id: 'bp-100-a', code: 'BP Form 100-A', name: 'Earmarked Revenues', level: FORM_LEVEL.AGENCY, engine: FORM_ENGINE.SCHEMA, schemaId: 'bp-form-100-a', automation: AUTOMATION_LEVEL.AUTO, completedBy: 'Budget / Finance Office' },
  { id: 'bp-100-b', code: 'BP Form 100-B', name: 'Other Receipts / Expenditures', level: FORM_LEVEL.AGENCY, engine: FORM_ENGINE.SCHEMA, schemaId: 'bp-form-100-b', automation: AUTOMATION_LEVEL.AUTO, completedBy: 'Budget / Finance Office' },
  { id: 'bp-100-c', code: 'BP Form 100-C', name: 'Donations and Grants', level: FORM_LEVEL.AGENCY, engine: FORM_ENGINE.SCHEMA, schemaId: 'bp-form-100-c', automation: AUTOMATION_LEVEL.AUTO_PLUS, completedBy: 'Budget / Finance Office' },
  { id: 'bp-200', code: 'BP Form 200', name: 'Comparison of Appropriations and Obligations', level: FORM_LEVEL.AGENCY, engine: FORM_ENGINE.SCHEMA, schemaId: 'bp-form-200', automation: AUTOMATION_LEVEL.AUTO, completedBy: 'Budget Office' },
  { id: 'bp-201', code: 'BP Form 201', name: 'Summary of Obligations and Proposed Programs/Projects', level: FORM_LEVEL.AGENCY, engine: FORM_ENGINE.DYNAMIC, automation: AUTOMATION_LEVEL.AUTO_PLUS, completedBy: 'Institution Budget / Finance contributors; Central Office consolidation (DOST assignment pending)' },
  { id: 'bp-201-a', code: 'BP Form 201-A', name: 'Personnel Services (PS)', level: FORM_LEVEL.REQUEST, engine: FORM_ENGINE.DYNAMIC, automation: AUTOMATION_LEVEL.AUTO_PLUS, completedBy: 'Budget Office, using PS data from HR' },
  { id: 'bp-201-b', code: 'BP Form 201-B', name: 'Maintenance and Other Operating Expenses (MOOE)', level: FORM_LEVEL.REQUEST, engine: FORM_ENGINE.DYNAMIC, automation: AUTOMATION_LEVEL.AUTO_PLUS, completedBy: 'Budget Office' },
  { id: 'bp-201-c', code: 'BP Form 201-C', name: 'Financial Expenses (FinEx)', level: FORM_LEVEL.REQUEST, engine: FORM_ENGINE.DYNAMIC, automation: AUTOMATION_LEVEL.AUTO_PLUS, completedBy: 'Budget / Finance Office' },
  { id: 'bp-201-d', code: 'BP Form 201-D', name: 'Capital Outlays (CO)', level: FORM_LEVEL.REQUEST, engine: FORM_ENGINE.DYNAMIC, automation: AUTOMATION_LEVEL.AUTO_PLUS, completedBy: 'Budget Office, using CO data from the proposing office' },
  { id: 'bp-201-e', code: 'BP Form 201-E', name: 'Summary of Outyear Requirements', level: FORM_LEVEL.REQUEST, engine: FORM_ENGINE.DYNAMIC, automation: AUTOMATION_LEVEL.AUTO_PLUS, completedBy: 'Budget Office, from the proposing office' },
  { id: 'bp-202', code: 'BP Form 202', name: 'Profile for Tier 2 Budget Proposals', level: FORM_LEVEL.REQUEST, engine: FORM_ENGINE.DYNAMIC, automation: AUTOMATION_LEVEL.AUTO_PLUS, completedBy: 'Proposing office / project team, reviewed by Budget Office' },
  { id: 'bp-203', code: 'BP Form 203', name: 'Profile for Foreign-Assisted Projects', level: FORM_LEVEL.REQUEST, engine: FORM_ENGINE.DYNAMIC, automation: AUTOMATION_LEVEL.AUTO_PLUS, completedBy: 'Proposing office, with foreign-assisted project focal person' },
  { id: 'bp-204', code: 'BP Form 204', name: 'Staffing Summary of Non-Permanent Positions', level: FORM_LEVEL.REQUEST, engine: FORM_ENGINE.DYNAMIC, automation: AUTOMATION_LEVEL.AUTO_PLUS, completedBy: 'HR / Personnel Office, with proposing office' },
  { id: 'bp-205', code: 'BP Form 205', name: 'List of Retirees', level: FORM_LEVEL.AGENCY, engine: FORM_ENGINE.DYNAMIC, automation: AUTOMATION_LEVEL.AUTO_PLUS, completedBy: 'HR / Personnel Office' },
  { id: 'bp-206', code: 'BP Form 206', name: 'Convergence Programs and Projects', level: FORM_LEVEL.REQUEST, engine: FORM_ENGINE.DYNAMIC, automation: AUTOMATION_LEVEL.AUTO_PLUS, completedBy: 'PCB focal person / proposing office' },
  { id: 'bp-207', code: 'BP Form 207', name: 'Climate Change Expenditures', level: FORM_LEVEL.REQUEST, engine: FORM_ENGINE.DYNAMIC, automation: AUTOMATION_LEVEL.AUTO_PLUS, completedBy: 'Proposing office, with Climate Change Expenditure Tagging focal person' },
  { id: 'bp-300', code: 'BP Form 300', name: 'Proposed New, Amended or Deleted Provisions', level: FORM_LEVEL.AGENCY, engine: FORM_ENGINE.SCHEMA, schemaId: 'bp-form-300', automation: AUTOMATION_LEVEL.MANUAL, completedBy: 'Budget Office / Planning Office' },
];

export function getCycleFormCatalog(objCycle) {
  return [...BP_FORM_CATALOG, ...(objCycle?.custom_forms || [])].map((form) => {
    if (OFFICIAL_WORKBOOK_FORMS.some((row) => row.id === form.id)) form = { ...form, engine: FORM_ENGINE.DYNAMIC };
    const config = objCycle?.form_configs?.[form.id];
    const metadata = { reportingScope: 'Individual institution and Central Office consolidation', responsibilityStatus: 'DOST assignment requires confirmation' };
    return config ? { ...metadata, ...form, completedBy: config.completedBy || form.completedBy, level: config.level || form.level, engine: config.fields?.length ? FORM_ENGINE.DYNAMIC : form.engine, automation: config.fields?.some((field) => field.source !== 'user') ? AUTOMATION_LEVEL.AUTO_PLUS : AUTOMATION_LEVEL.MANUAL } : { ...metadata, ...form };
  });
}

export function getFormById(strFormId, arrCatalog = BP_FORM_CATALOG) {
  return arrCatalog.find((objForm) => objForm.id === strFormId) || null;
}
