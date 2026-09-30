/**
 * System Name: Budget Management System
 * Module Name: Utilities Module
 *
 * Purpose of this file:
 * Provide helper functions and utility methods for budget requests.
 *
 * Author(s): QUT Group 27
 *
 * Copyright (C) 2026
 * by the Department of Science and Technology - Central Office
 * Developed by Team 27, Queensland University of Technology
 * All rights reserved.
 */

import { formatCurrency } from './formatters';

export const FALLBACK_BUDGET_CATEGORIES = [
  { bcat_code: 'PS', bcat_id: 1 },
  { bcat_code: 'MOOE', bcat_id: 2 },
  { bcat_code: 'CO', bcat_id: 3 },
  { bcat_code: 'TAG', bcat_id: 4 },
];

const CURRENT_CALENDAR_YEAR = new Date().getFullYear();

export function formatBudgetRequestCurrency(numValue) {
  const n = Number(numValue);
  return `${formatCurrency(n)}`;
}

export function getBudgetRequestPageTimestamp() {
  return new Date().toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function toWorkflowDateLabel(timestamp) {
  const parsed = new Date(timestamp);
  if (Number.isNaN(parsed.getTime())) return timestamp;
  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  });
}

export function computeBudgetLineItemTotals(lineItems) {
  const totals = {
    psTotal: 0,
    mooeTotal: 0,
    coTotal: 0,
    tagTotal: 0,
    grandTotal: 0,
  };
  (lineItems || []).forEach((item) => {
    const amt = Number(item.amount) || 0;
    if (item.category === 'PS') totals.psTotal += amt;
    if (item.category === 'MOOE') totals.mooeTotal += amt;
    if (item.category === 'CO') totals.coTotal += amt;
    if (item.category === 'TAG') totals.tagTotal += amt;
  });
  totals.grandTotal = totals.psTotal + totals.mooeTotal + totals.coTotal + totals.tagTotal;
  return totals;
}

export function buildBudgetCategoryDropdownOptions(budgetCategories) {
  const arrSource =
    Array.isArray(budgetCategories) && budgetCategories.length > 0
      ? budgetCategories
      : FALLBACK_BUDGET_CATEGORIES;
  return arrSource.map((cat) => ({
    value: String(cat.bcat_code),
    label: String(cat.bcat_code),
  }));
}

export function buildCategoryCodeToIdMap(budgetCategories) {
  const map = new Map();
  (budgetCategories || []).forEach((cat) => {
    if (!cat) return;
    if (typeof cat.bcat_code === 'undefined' || typeof cat.bcat_id === 'undefined') return;
    map.set(String(cat.bcat_code), Number(cat.bcat_id));
  });
  if (map.size === 0) {
    FALLBACK_BUDGET_CATEGORIES.forEach((cat) => {
      map.set(String(cat.bcat_code), Number(cat.bcat_id));
    });
  }
  return map;
}

export function buildCategoryIdToCodeMap(budgetCategories) {
  const map = new Map();
  (budgetCategories || []).forEach((cat) => {
    if (!cat) return;
    if (typeof cat.bcat_id === 'undefined' || typeof cat.bcat_code === 'undefined') return;
    map.set(Number(cat.bcat_id), String(cat.bcat_code));
  });
  if (map.size === 0) {
    FALLBACK_BUDGET_CATEGORIES.forEach((cat) => {
      map.set(Number(cat.bcat_id), String(cat.bcat_code));
    });
  }
  return map;
}

export function buildFiscalYearDropdownOptions(fiscalYears) {
  return [
    { value: '', label: 'Select fiscal year' },
    ...(fiscalYears || [])
      .filter((fy) => Number(fy?.fy_year) >= CURRENT_CALENDAR_YEAR)
      .map((fy) => ({ value: String(fy.fy_id), label: String(fy.fy_year) })),
  ];
}

/** Default planning period id in seed data (Annually). */
export const DEFAULT_PLANNING_PERIOD_ID = '1';

export function buildPlanningPeriodDropdownOptions(planningPeriods) {
  const arrSource =
    Array.isArray(planningPeriods) && planningPeriods.length > 0
      ? planningPeriods
      : [{ pp_id: 1, pp_name: 'Annually', pp_is_active: 1 }];
  return arrSource
    .filter((pp) => pp && Number(pp.pp_is_active) !== 0)
    .map((pp) => ({ value: String(pp.pp_id), label: String(pp.pp_name || '') }))
    .filter((opt) => opt.label !== '');
}

export function buildRequestingUnitDropdownOptions(requestingUnits) {
  return [
    { value: '', label: 'Select requesting unit' },
    ...(requestingUnits || []).map((ru) => ({ value: String(ru.ru_id), label: String(ru.ru_name) })),
  ];
}

export function extractApiRows(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

export async function fetchBudgetCategoriesForPage(getBudgetCategories) {
  try {
    const objResult = await getBudgetCategories({ bcat_is_active: 1 });
    return extractApiRows(objResult);
  } catch {
    return [];
  }
}

export async function fetchFiscalYearsForBudgetPage(getFiscalYears) {
  try {
    const resActive = await getFiscalYears({ fy_is_active: 1 });
    const arrActiveData = extractApiRows(resActive);
    let arrData = arrActiveData;
    if (arrData.length === 0) {
      const resAll = await getFiscalYears({});
      arrData = extractApiRows(resAll);
    }
    if (!Array.isArray(arrData)) return [];
    return arrData
      .filter((fy) => Number(fy?.fy_year) >= CURRENT_CALENDAR_YEAR)
      .sort((a, b) => Number(a?.fy_year) - Number(b?.fy_year));
  } catch {
    return [];
  }
}

export async function fetchRequestingUnitsForBudgetPage(getRequestingUnits) {
  try {
    const res = await getRequestingUnits({ ru_is_active: 1 });
    return extractApiRows(res);
  } catch {
    return [];
  }
}

export async function fetchPlanningPeriodsForPage(getPlanningPeriods) {
  try {
    const res = await getPlanningPeriods({ pp_is_active: 1 });
    return extractApiRows(res);
  } catch {
    return [];
  }
}

export function mergeBackendBudgetRequestValidationErrors(previousErrors, backendErrors) {
  if (!backendErrors || typeof backendErrors !== 'object') return previousErrors;
  return {
    ...previousErrors,
    title: backendErrors.br_title?.[0] || previousErrors.title,
    description: backendErrors.br_description?.[0] || previousErrors.description,
    fiscalYear: backendErrors.br_fiscal_year_id?.[0] || previousErrors.fiscalYear,
    planningPeriod: backendErrors.br_planning_period_id?.[0] || previousErrors.planningPeriod,
    unit: backendErrors.br_requesting_unit_id?.[0] || previousErrors.unit,
  };
}

/**
 * Normalizes budget request API status to match Badge component keys.
 *
 * @param {string} strApiStatus
 * @returns {string}
 */
export function normalizeBudgetRequestBadgeStatus(strApiStatus = '')
{
  const strNorm = String(strApiStatus || '').trim().toLowerCase();
  if (!strNorm) {
    return 'draft';
  }
  if (strNorm === 'submitted') {
    return 'pending';
  }
  if (strNorm === 'returned') {
    return 'rejected';
  }
  return strNorm;
}

/**
 * CSS class names for review comment banner aligned with status badge colors.
 *
 * @param {string} strApiStatus
 * @returns {string}
 */
export function getBudgetRequestReviewCommentClass(strApiStatus = '')
{
  const strBadgeStatus = normalizeBudgetRequestBadgeStatus(strApiStatus);
  return `br-review-comment br-review-comment--${strBadgeStatus}`;
}

/**
 * Extract budget request items and filter those with 'reviewed' status.
 *
 * @param {object|Array} payload
 * @returns {Array}
 */
export function toReviewedRequests(payload) {
  return extractApiRows(payload).filter(
    (r) => String(r?.br_status || r?.status || '').toLowerCase() === 'reviewed'
  );
}

