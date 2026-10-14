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

import { describeCondition, matchesCondition, matchesRequirement } from './bp_form_conditions.js';

import { PROPOSAL_QUESTIONS, getQuestionAnswer } from './proposal_questions.js';
export { PROPOSAL_QUESTIONS, FUNDING_SOURCE_OPTIONS, TIER_OPTIONS } from './proposal_questions.js';
const condition = (field, value = 'yes', operator = 'equals') => ({ field, value, operator });

// Rule ids follow the team's business rules register (BR-01 to BR-17). BR-00 covers the core agency forms.
export const BP_FORM_RULES = [
  ...['bp-a', 'bp-b', 'bp-100', 'bp-200', 'bp-201'].map((formId) => ({ id: 'BR-00', formId, reason: 'Core agency form - always required' })),
  { id: 'BR-01', formId: 'bp-202', reason: 'Proposal is Tier 2 (new or expanded spending)', condition: condition('proposalTier', 'tier2') },
  { id: 'BR-02', formId: 'bp-203', reason: 'Funding source is foreign (grant or loan)', condition: condition('fundingSource', 'foreign') },
  { id: 'BR-03', formId: 'bp-204', reason: 'Proposal needs non-permanent positions', condition: condition('hasNonPermanent') },
  { id: 'BR-04', formId: 'bp-205', reason: 'Agency has retirement requirements', condition: condition('hasRetirement') },
  { id: 'BR-05', formId: 'bp-206', reason: 'Part of an approved convergence program', condition: condition('isPcb') },
  { id: 'BR-06', formId: 'bp-207', reason: 'Climate change expenditure declared', condition: condition('hasClimate') },
  { id: 'BR-06-AMOUNT', formId: 'bp-207', reason: 'Climate-tagged expenditure entered in the line items', condition: condition('climateTotal', 0, 'gt') },
  { id: 'BR-07', formId: 'bp-201-e', reason: 'Proposal has outyear funding requirements', condition: condition('hasOutyear') },
  { id: 'BR-08', formId: 'bp-c', reason: 'RDC inputs or recommendations exist', condition: condition('hasRdcInputs') },
  { id: 'BR-09', formId: 'bp-d', reason: 'CSO inputs exist', condition: condition('hasCsoInputs') },
  { id: 'BR-10', formId: 'bp-300', reason: 'Agency provision review, including retention where there are no amendments (NBM 156, page 98)' },
  { id: 'BR-11', formId: 'bp-100-a', reason: 'Agency has earmarked revenues', condition: condition('hasEarmarked') },
  { id: 'BR-12', formId: 'bp-100-b', reason: 'Agency has other receipts or expenditures', condition: condition('hasOtherReceipts') },
  { id: 'BR-13', formId: 'bp-100-c', reason: 'Agency receives donations or grants', condition: condition('hasDonations') },
  { id: 'BR-14', formId: 'bp-201-a', reason: 'Line items include Personnel Services (PS)', condition: condition('psTotal', 0, 'gt') },
  { id: 'BR-15', formId: 'bp-201-b', reason: 'Line items include MOOE', condition: condition('mooeTotal', 0, 'gt') },
  { id: 'BR-16', formId: 'bp-201-c', reason: 'Line items include Financial Expenses (FinEx)', condition: condition('finexTotal', 0, 'gt') },
  { id: 'BR-17', formId: 'bp-201-d', reason: 'Line items include Capital Outlay (CO)', condition: condition('coTotal', 0, 'gt') },
];

export function getDefaultRequirement(strFormId) {
  const rules = BP_FORM_RULES.filter((rule) => rule.formId === strFormId);
  return { mode: rules.length ? 'default' : 'always', enabled: true, match: 'any', conditions: rules.filter((rule) => rule.condition).map((rule, index) => ({ ...rule.condition, id: `default-${index}`, enabled: true })) };
}

export function getRequiredQuestions(enabledIds, configs = {}, catalog = []) {
  const ids = new Set();
  for (const formId of enabledIds) {
    if (catalog.find((form) => form.id === formId)?.level === 'agency') continue;
    const requirement = configs[formId]?.requirement;
    if (requirement?.enabled === false || ['always', 'optional'].includes(requirement?.mode)) continue;
    const conditions = requirement?.mode === 'conditional' ? requirement.conditions || [] : BP_FORM_RULES.filter((rule) => rule.formId === formId).map((rule) => rule.condition).filter(Boolean);
    for (const row of conditions) if (row.enabled !== false) ids.add(row.questionId || row.field);
  }
  return PROPOSAL_QUESTIONS.filter((question) => ids.has(question.id));
}

export function countUnansweredQuestions(objAnswers, common = {}, questions = PROPOSAL_QUESTIONS) {
  return questions.filter((question) => !question.options.some((option) => option.value === getQuestionAnswer(question, { answers: objAnswers, common }))).length;
}

/**
 * Evaluate the rules and return one entry per required form: { formId, ruleIds, reasons, origin }.
 * arrEnabledFormIds is the list configured for the budget cycle; forms outside it are reported separately.
 */
export function evaluateRequiredForms(objAnswers, objTotals, objCommon, arrEnabledFormIds, objOverrides = {}, arrCustomForms = [], objFormConfigs = {}) {
  const mapRequired = new Map();
  const context = { answers: objAnswers, totals: objTotals, common: objCommon };

  BP_FORM_RULES.forEach((objRule) => {
    if (objFormConfigs[objRule.formId]?.requirement?.enabled === false) return;
    if (objFormConfigs[objRule.formId]?.requirement?.mode && objFormConfigs[objRule.formId].requirement.mode !== 'default') return;
    if (objRule.condition && !matchesCondition(objRule.condition, context)) return;

    const objEntry = mapRequired.get(objRule.formId) || { formId: objRule.formId, ruleIds: [], reasons: [], origin: 'rule' };
    if (!objEntry.ruleIds.includes(objRule.id)) objEntry.ruleIds.push(objRule.id);
    objEntry.reasons.push(objRule.reason);
    mapRequired.set(objRule.formId, objEntry);
  });

  arrCustomForms.forEach((objForm) => {
    if (objFormConfigs[objForm.id]?.requirement?.enabled === false) return;
    if (objFormConfigs[objForm.id]?.requirement?.mode && objFormConfigs[objForm.id].requirement.mode !== 'default') return;
    mapRequired.set(objForm.id, { formId: objForm.id, ruleIds: ['CYCLE'], reasons: [`Required by the administrator for FY${objCommon?.fiscalYear || objCommon?.fiscalYearLabel || ''}`], origin: 'cycle' });
  });

  Object.entries(objFormConfigs).forEach(([formId, config]) => {
    const requirement = config.requirement;
    if (!requirement || requirement.enabled === false || !['always', 'conditional'].includes(requirement.mode)) return;
    if (requirement.mode === 'conditional' && !matchesRequirement(requirement, context)) return;
    const reasons = requirement.mode === 'always' ? ['Required by the administrator for this fiscal year']
      : [`Required when ${requirement.match === 'all' ? 'all' : 'any'} enabled conditions match: ${(requirement.conditions || []).filter((row) => row.enabled !== false && matchesCondition(row, context)).map(describeCondition).join('; ')}`];
    mapRequired.set(formId, { formId, ruleIds: ['CYCLE'], reasons, origin: 'cycle' });
  });

  const arrApplicableFormIds = [...mapRequired.keys()].filter((id) => arrEnabledFormIds.includes(id));

  // Recorded user overrides: add a form the rules did not select, or remove one they did
  Object.entries(objOverrides).forEach(([strFormId, objOverride]) => {
    if (!objOverride || typeof objOverride.reason !== 'string' || !objOverride.reason.trim()) return;
    if (objOverride.action === 'add' && !mapRequired.has(strFormId)) {
      mapRequired.set(strFormId, { formId: strFormId, ruleIds: ['OVERRIDE'], reasons: [`Added by user: ${objOverride.reason}`], origin: 'override' });
    }
    if (objOverride.action === 'remove' && mapRequired.has(strFormId) && canOverrideForm(strFormId, objFormConfigs)) {
      mapRequired.delete(strFormId);
    }
  });

  const arrRequired = [];
  const arrNotInCycle = [];
  mapRequired.forEach((objEntry) => {
    if (arrEnabledFormIds.includes(objEntry.formId)) arrRequired.push({ ...objEntry, canRemove: canOverrideForm(objEntry.formId, objFormConfigs) });
    else arrNotInCycle.push(objEntry);
  });

  return { arrRequired, arrNotInCycle, arrApplicableFormIds };
}

export function canOverrideForm(formId, configs = {}) {
  const requirement = configs[formId]?.requirement;
  return requirement?.mode === 'optional' || requirement?.allowOverride === true;
}
