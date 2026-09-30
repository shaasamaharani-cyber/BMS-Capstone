/**
 * System Name: Budget Management System
 * Module Name: BP Forms Module
 *
 * Purpose of this file:
 * Deterministic rules that decide which BP forms a budget request needs, based on the proposal questions, the line-item
 * totals and the funding source. Every rule carries a reason so the user can see why a form was included. A user may
 * override a decision, and the override is recorded with a reason (no machine learning for compliance decisions).
 *
 * Author(s): QUT Group T214
 *
 * Copyright (C) 2026
 * by the Department of Science and Technology - Central Office
 * All rights reserved.
 */

export const FUNDING_SOURCE_OPTIONS = [
  { value: 'national_government', label: 'National Government' },
  { value: 'foreign_grant', label: 'Foreign Grant' },
  { value: 'foreign_loan', label: 'Foreign Loan' },
  { value: 'other', label: 'Other' },
];

export const TIER_OPTIONS = [
  { value: 'tier1', label: 'Tier 1 - current requirements' },
  { value: 'tier2', label: 'Tier 2 - new or expanded proposal' },
];

// group is only used to lay the questions out on screen
export const PROPOSAL_QUESTIONS = [
  { key: 'proposalTier', group: 'Project', label: 'Which budget tier is this proposal?', type: 'select', options: TIER_OPTIONS },
  { key: 'hasOutyear', group: 'Project', label: 'Does it have funding requirements beyond FY2027 (outyears)?', type: 'yesno' },
  { key: 'hasFinEx', group: 'Project', label: 'Does it include financial expenses (FinEx)?', type: 'yesno' },
  { key: 'isPcb', group: 'Project', label: 'Is it part of an approved Program Convergence Budgeting arrangement?', type: 'yesno' },
  { key: 'hasClimate', group: 'Project', label: 'Does it contain climate change adaptation or mitigation expenditure?', type: 'yesno' },
  { key: 'hasNonPermanent', group: 'People', label: 'Does it need non-permanent (contractual or job order) positions?', type: 'yesno' },
  { key: 'hasRetirement', group: 'People', label: 'Does the agency have retirement requirements for FY2027?', type: 'yesno' },
  { key: 'hasEarmarked', group: 'Agency finance', label: 'Does the agency have earmarked revenues?', type: 'yesno' },
  { key: 'hasOtherReceipts', group: 'Agency finance', label: 'Does the agency have other receipts or expenditures to report?', type: 'yesno' },
  { key: 'hasDonations', group: 'Agency finance', label: 'Does the agency receive donations or grants?', type: 'yesno' },
  { key: 'hasProvisions', group: 'Agency finance', label: 'Does the agency propose new, amended or deleted provisions?', type: 'yesno' },
  { key: 'hasRdcInputs', group: 'Consultations', label: 'Are there Regional Development Council (RDC) inputs or recommendations?', type: 'yesno' },
  { key: 'hasCsoInputs', group: 'Consultations', label: 'Are there Civil Society Organisation (CSO) inputs?', type: 'yesno' },
];

const isYes = (objAnswers, strKey) => objAnswers?.[strKey] === 'yes';
const isForeignFunded = (objCommon) => ['foreign_grant', 'foreign_loan'].includes(objCommon?.fundingSource);

// Rule ids follow the team's business rules register (BR-01 to BR-17). BR-00 covers the core agency forms.
export const BP_FORM_RULES = [
  { id: 'BR-00', formId: 'bp-a', reason: 'Core agency form - always required', when: () => true },
  { id: 'BR-00', formId: 'bp-b', reason: 'Core agency form - always required', when: () => true },
  { id: 'BR-00', formId: 'bp-100', reason: 'Core agency form - always required', when: () => true },
  { id: 'BR-00', formId: 'bp-200', reason: 'Core agency form - always required', when: () => true },
  { id: 'BR-01', formId: 'bp-202', reason: 'Proposal is Tier 2 (new or expanded spending)', when: (objAnswers) => objAnswers?.proposalTier === 'tier2' },
  { id: 'BR-02', formId: 'bp-203', reason: 'Funding source is foreign (grant or loan)', when: (objAnswers, objTotals, objCommon) => isForeignFunded(objCommon) },
  { id: 'BR-03', formId: 'bp-204', reason: 'Proposal needs non-permanent positions', when: (objAnswers) => isYes(objAnswers, 'hasNonPermanent') },
  { id: 'BR-04', formId: 'bp-205', reason: 'Agency has FY2027 retirement requirements', when: (objAnswers) => isYes(objAnswers, 'hasRetirement') },
  { id: 'BR-05', formId: 'bp-206', reason: 'Part of an approved convergence program', when: (objAnswers) => isYes(objAnswers, 'isPcb') },
  { id: 'BR-06', formId: 'bp-207', reason: 'Climate change expenditure declared', when: (objAnswers) => isYes(objAnswers, 'hasClimate') },
  { id: 'BR-06', formId: 'bp-207', reason: 'Project tagging (TAG) amount entered in the line items', when: (objAnswers, objTotals) => Number(objTotals?.tagTotal) > 0 },
  { id: 'BR-07', formId: 'bp-201-e', reason: 'Proposal has outyear funding requirements', when: (objAnswers) => isYes(objAnswers, 'hasOutyear') },
  { id: 'BR-08', formId: 'bp-c', reason: 'RDC inputs or recommendations exist', when: (objAnswers) => isYes(objAnswers, 'hasRdcInputs') },
  { id: 'BR-09', formId: 'bp-d', reason: 'CSO inputs exist', when: (objAnswers) => isYes(objAnswers, 'hasCsoInputs') },
  { id: 'BR-10', formId: 'bp-300', reason: 'Agency proposes new, amended or deleted provisions', when: (objAnswers) => isYes(objAnswers, 'hasProvisions') },
  { id: 'BR-11', formId: 'bp-100-a', reason: 'Agency has earmarked revenues', when: (objAnswers) => isYes(objAnswers, 'hasEarmarked') },
  { id: 'BR-12', formId: 'bp-100-b', reason: 'Agency has other receipts or expenditures', when: (objAnswers) => isYes(objAnswers, 'hasOtherReceipts') },
  { id: 'BR-13', formId: 'bp-100-c', reason: 'Agency receives donations or grants', when: (objAnswers) => isYes(objAnswers, 'hasDonations') },
  { id: 'BR-14', formId: 'bp-201-a', reason: 'Line items include Personnel Services (PS)', when: (objAnswers, objTotals) => Number(objTotals?.psTotal) > 0 },
  { id: 'BR-15', formId: 'bp-201-b', reason: 'Line items include MOOE', when: (objAnswers, objTotals) => Number(objTotals?.mooeTotal) > 0 },
  { id: 'BR-16', formId: 'bp-201-c', reason: 'Proposal includes financial expenses (FinEx)', when: (objAnswers) => isYes(objAnswers, 'hasFinEx') },
  { id: 'BR-17', formId: 'bp-201-d', reason: 'Line items include Capital Outlay (CO)', when: (objAnswers, objTotals) => Number(objTotals?.coTotal) > 0 },
];

export function countUnansweredQuestions(objAnswers) {
  return PROPOSAL_QUESTIONS.filter((objQuestion) => !objAnswers?.[objQuestion.key]).length;
}

/**
 * Evaluate the rules and return one entry per required form: { formId, ruleIds, reasons, origin }.
 * arrEnabledFormIds is the list configured for the budget cycle; forms outside it are reported separately.
 */
export function evaluateRequiredForms(objAnswers, objTotals, objCommon, arrEnabledFormIds, objOverrides = {}) {
  const mapRequired = new Map();

  BP_FORM_RULES.forEach((objRule) => {
    if (!objRule.when(objAnswers, objTotals, objCommon)) return;

    const objEntry = mapRequired.get(objRule.formId) || { formId: objRule.formId, ruleIds: [], reasons: [], origin: 'rule' };
    if (!objEntry.ruleIds.includes(objRule.id)) objEntry.ruleIds.push(objRule.id);
    objEntry.reasons.push(objRule.reason);
    mapRequired.set(objRule.formId, objEntry);
  });

  // Recorded user overrides: add a form the rules did not select, or remove one they did
  Object.entries(objOverrides).forEach(([strFormId, objOverride]) => {
    if (objOverride.action === 'add' && !mapRequired.has(strFormId)) {
      mapRequired.set(strFormId, { formId: strFormId, ruleIds: ['OVERRIDE'], reasons: [`Added by user: ${objOverride.reason}`], origin: 'override' });
    }
    if (objOverride.action === 'remove' && mapRequired.has(strFormId)) {
      mapRequired.delete(strFormId);
    }
  });

  const arrRequired = [];
  const arrNotInCycle = [];
  mapRequired.forEach((objEntry) => {
    if (arrEnabledFormIds.includes(objEntry.formId)) arrRequired.push(objEntry);
    else arrNotInCycle.push(objEntry);
  });

  return { arrRequired, arrNotInCycle };
}
