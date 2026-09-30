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

export const FORM_LEVEL = {
  REQUEST: 'request',
  AGENCY: 'agency',
};

// dynamic = defined in bp_form_fields.js, schema = existing Team 27 form engine, pending = layout not built yet
export const FORM_ENGINE = {
  DYNAMIC: 'dynamic',
  SCHEMA: 'schema',
  PENDING: 'pending',
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

const CYCLE_CONFIG_KEY_PREFIX = 'dost-bms.cycle-forms.';

// Source: team research (Brandon Findlay, FY2027 BP form analysis). Rules and owners are proposals pending DOST confirmation.
export const BP_FORM_CATALOG = [
  { id: 'bp-a', code: 'BP Form A', name: 'Program Budget Matrix', level: FORM_LEVEL.REQUEST, engine: FORM_ENGINE.DYNAMIC, automation: AUTOMATION_LEVEL.AUTO_PLUS, completedBy: 'Proposing office, reviewed by Budget Office' },
  { id: 'bp-b', code: 'BP Form B', name: 'Agency Performance Measures', level: FORM_LEVEL.AGENCY, engine: FORM_ENGINE.PENDING, automation: AUTOMATION_LEVEL.AUTO_PLUS, completedBy: 'Program / project owner' },
  { id: 'bp-c', code: 'BP Form C', name: 'RDC Inputs and Recommendations on New and Expanded Programs/Projects', level: FORM_LEVEL.AGENCY, engine: FORM_ENGINE.PENDING, automation: AUTOMATION_LEVEL.AUTO_PLUS, completedBy: 'Budget Office / Planning personnel' },
  { id: 'bp-d', code: 'BP Form D', name: 'CSO Inputs on Ongoing and New Spending', level: FORM_LEVEL.AGENCY, engine: FORM_ENGINE.PENDING, automation: AUTOMATION_LEVEL.AUTO_PLUS, completedBy: 'Budget Office / Planning personnel' },
  { id: 'bp-100', code: 'BP Form 100', name: 'Statement of Revenues - General Fund', level: FORM_LEVEL.AGENCY, engine: FORM_ENGINE.SCHEMA, schemaId: 'bp-form-100', automation: AUTOMATION_LEVEL.AUTO, completedBy: 'Budget / Finance Office' },
  { id: 'bp-100-a', code: 'BP Form 100-A', name: 'Earmarked Revenues', level: FORM_LEVEL.AGENCY, engine: FORM_ENGINE.SCHEMA, schemaId: 'bp-form-100-a', automation: AUTOMATION_LEVEL.AUTO, completedBy: 'Budget / Finance Office' },
  { id: 'bp-100-b', code: 'BP Form 100-B', name: 'Other Receipts / Expenditures', level: FORM_LEVEL.AGENCY, engine: FORM_ENGINE.SCHEMA, schemaId: 'bp-form-100-b', automation: AUTOMATION_LEVEL.AUTO, completedBy: 'Budget / Finance Office' },
  { id: 'bp-100-c', code: 'BP Form 100-C', name: 'Donations and Grants', level: FORM_LEVEL.AGENCY, engine: FORM_ENGINE.SCHEMA, schemaId: 'bp-form-100-c', automation: AUTOMATION_LEVEL.AUTO_PLUS, completedBy: 'Budget / Finance Office' },
  { id: 'bp-200', code: 'BP Form 200', name: 'Comparison of Appropriations and Obligations', level: FORM_LEVEL.AGENCY, engine: FORM_ENGINE.SCHEMA, schemaId: 'bp-form-200', automation: AUTOMATION_LEVEL.AUTO, completedBy: 'Budget Office' },
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

export function getFormById(strFormId) {
  return BP_FORM_CATALOG.find((objForm) => objForm.id === strFormId) || null;
}

// The administrator picks which forms apply to a budget cycle. Until an admin screen exists (Phase 2 backend), the choice is
// kept in localStorage per fiscal year and defaults to every form in the catalogue.
export function getEnabledFormIds(intFiscalYear) {
  const arrAllIds = BP_FORM_CATALOG.map((objForm) => objForm.id);
  if (!intFiscalYear) return arrAllIds;

  try {
    const strStored = localStorage.getItem(`${CYCLE_CONFIG_KEY_PREFIX}${intFiscalYear}`);
    if (!strStored) return arrAllIds;
    const arrStored = JSON.parse(strStored);
    return Array.isArray(arrStored) ? arrStored : arrAllIds;
  } catch {
    return arrAllIds;
  }
}

export function saveEnabledFormIds(intFiscalYear, arrFormIds) {
  if (!intFiscalYear) return;
  try {
    localStorage.setItem(`${CYCLE_CONFIG_KEY_PREFIX}${intFiscalYear}`, JSON.stringify(arrFormIds));
  } catch {
    // Storage unavailable - configuration simply stays at its default
  }
}
