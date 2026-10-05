/**
 * System Name: DOST Budget Management System
 * Module Name: Dashboard Service
 * Purpose: Build financial dashboard datasets from mock db.
 *          Execution data read from tbl_appropriations + tbl_budget_executions.
 */

// ─── Constants ────────────────────────────────────────────────────────────────

const AMOUNT_DIVISOR_BY_PERIOD = {
  annually:       1,
  semiAnnually:     2,
  'semi-annually':  2,
  quarterly:        4,
  monthly:          12,
};

const STATUS_SET_FOR_PLANNING = new Set([
  'pending', 'submitted', 'reviewed', 'rejected', 'consolidated',
]);

const STATUS_COLOR_MAP = {
  submitted:    'pending',
  pending:      'pending',
  reviewed:     'reviewed',
  consolidated: 'consolidated',
  rejected:     'rejected',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toNumber(value)
{
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function r2(value)
{
  return Math.round(toNumber(value) * 100) / 100;
}

function getPeriodDivisor(strPeriod)
{
  return AMOUNT_DIVISOR_BY_PERIOD[strPeriod] || AMOUNT_DIVISOR_BY_PERIOD.annually;
}

function getRatePercent(numerator, denominator)
{
  if (denominator <= 0) return 0;
  return r2((numerator / denominator) * 100);
}

function mapReferenceOptions(items, valueKey, labelKey)
{
  return items.map((item) => ({
    value: String(item[valueKey]),
    label: String(item[labelKey]),
  }));
}

// ─── Category helpers ─────────────────────────────────────────────────────────

function buildCategoryMaps(db)
{
  const arrCategories = db.rows('budget-categories');
  const objCategoryNameById = {};
  const objCategoryCodeById = {};

  arrCategories.forEach((objCategory) => {
    objCategoryNameById[objCategory.bcat_id] = objCategory.bcat_name;
    objCategoryCodeById[objCategory.bcat_id] = String(objCategory.bcat_code || '').toUpperCase();
  });

  return { arrCategories, objCategoryNameById, objCategoryCodeById };
}

// ─── Filter helpers ───────────────────────────────────────────────────────────

function getFilteredBudgetRequests(db, objFilters)
{
  const intFiscalYearId     = objFilters.fiscalYearId     ? Number(objFilters.fiscalYearId)     : null;
  const intRequestingUnitId = objFilters.requestingUnitId ? Number(objFilters.requestingUnitId) : null;

  return db.rows('budget-requests').filter((objRequest) => {
    if (intFiscalYearId     && Number(objRequest.br_fiscal_year_id)     !== intFiscalYearId)     return false;
    if (intRequestingUnitId && Number(objRequest.br_requesting_unit_id) !== intRequestingUnitId) return false;
    return true;
  });
}

function buildRequestItemMap(db)
{
  const objItemsByRequestId = {};
  db.rows('budget-request-items').forEach((objItem) => {
    const intRequestId = Number(objItem.bri_br_id);
    if (!objItemsByRequestId[intRequestId]) objItemsByRequestId[intRequestId] = [];
    objItemsByRequestId[intRequestId].push(objItem);
  });
  return objItemsByRequestId;
}

function getFilteredAppropriations(db, objFilters)
{
  const intFiscalYearId     = objFilters.fiscalYearId     ? Number(objFilters.fiscalYearId)     : null;
  const intRequestingUnitId = objFilters.requestingUnitId ? Number(objFilters.requestingUnitId) : null;
  const intCategoryId       = objFilters.categoryId       ? Number(objFilters.categoryId)       : null;

  return db.rows('appropriations').filter((objRow) => {
    if (intFiscalYearId     && Number(objRow.appr_fiscal_year_id)      !== intFiscalYearId)     return false;
    if (intRequestingUnitId && Number(objRow.appr_requesting_unit_id)  !== intRequestingUnitId) return false;
    if (intCategoryId       && Number(objRow.appr_category_id)         !== intCategoryId)       return false;
    return true;
  });
}

function getFilteredExecutions(db, objFilters)
{
  const intFiscalYearId     = objFilters.fiscalYearId     ? Number(objFilters.fiscalYearId)     : null;
  const intRequestingUnitId = objFilters.requestingUnitId ? Number(objFilters.requestingUnitId) : null;
  const intCategoryId       = objFilters.categoryId       ? Number(objFilters.categoryId)       : null;

  return db.rows('budget-executions').filter((objRow) => {
    if (intFiscalYearId     && Number(objRow.be_fiscal_year_id)     !== intFiscalYearId)     return false;
    if (intRequestingUnitId && Number(objRow.be_requesting_unit_id) !== intRequestingUnitId) return false;
    if (intCategoryId       && Number(objRow.be_category_id)        !== intCategoryId)       return false;
    return true;
  });
}

// ─── Planning tab ─────────────────────────────────────────────────────────────

function buildStatusSummary(arrRequests)
{
  const objCounts = { pending: 0, reviewed: 0, consolidated: 0, rejected: 0 };

  arrRequests.forEach((objRequest) => {
    const strStatus = String(objRequest.br_status || '').toLowerCase();
    if (strStatus === 'submitted') { objCounts.pending += 1; return; }
    if (strStatus in objCounts)    { objCounts[strStatus] += 1; }
  });

  return Object.entries(objCounts).map(([strStatus, intCount]) => ({
    status: strStatus,
    label:  strStatus.charAt(0).toUpperCase() + strStatus.slice(1),
    value:  intCount,
    color:  STATUS_COLOR_MAP[strStatus] || 'draft',
  }));
}

function buildPlanningCategoryBreakdown(arrRequests, objItemsByRequestId, objFilters, objCategoryCodeById)
{
  const strBudgetStatus = String(objFilters.budgetStatus || 'all').toLowerCase();
  const intCategoryId   = objFilters.categoryId ? Number(objFilters.categoryId) : null;
  const intDivisor      = getPeriodDivisor(objFilters.period);
  const objAccumulator  = { PS: 0, MOOE: 0, CO: 0, TAG: 0 };

  arrRequests.forEach((objRequest) => {
    const strStatus = String(objRequest.br_status || '').toLowerCase();
    if (!STATUS_SET_FOR_PLANNING.has(strStatus)) return;
    if (strBudgetStatus !== 'all' && strStatus !== strBudgetStatus) return;

    const arrItems = objItemsByRequestId[Number(objRequest.br_id)] || [];
    arrItems.forEach((objItem) => {
      if (intCategoryId && Number(objItem.bri_category_id) !== intCategoryId) return;
      const strCode = objCategoryCodeById[objItem.bri_category_id];
      if (!(strCode in objAccumulator)) return;
      objAccumulator[strCode] += toNumber(objItem.bri_planned_amount) / intDivisor;
    });
  });

  return objAccumulator;
}

function buildUnifiedCategoryBreakdown(db, objFilters)
{
  const intFiscalYearId     = objFilters.fiscalYearId     ? Number(objFilters.fiscalYearId)     : null;
  const intRequestingUnitId = objFilters.requestingUnitId ? Number(objFilters.requestingUnitId) : null;
  const intCategoryId       = objFilters.categoryId       ? Number(objFilters.categoryId)       : null;
  const intDivisor          = getPeriodDivisor(objFilters.period);
  const objAccumulator      = { PS: 0, MOOE: 0, CO: 0, TAG: 0 };

  const CAT_CODE = { 1: 'PS', 2: 'MOOE', 3: 'CO', 4: 'TAG' };

  db.rows('unified-budget-items')
    .filter((objItem) => {
      if (intRequestingUnitId && Number(objItem.ubi_requesting_unit_id) !== intRequestingUnitId) return false;
      if (intCategoryId && Number(objItem.ubi_category_id) !== intCategoryId) return false;
      if (!intFiscalYearId) return true;
      // match fiscal year via unified budget
      const objUB = db.rows('unified-budgets').find(
        (ub) => Number(ub.ub_id) === Number(objItem.ubi_unified_budget_id)
      );
      return objUB && Number(objUB.ub_fiscal_year_id) === intFiscalYearId;
    })
    .forEach((objItem) => {
      const strCode = CAT_CODE[objItem.ubi_category_id];
      if (!(strCode in objAccumulator)) return;
      objAccumulator[strCode] += toNumber(objItem.ubi_adjusted_amount) / intDivisor;
    });

  return objAccumulator;
}

// ─── Monitoring tab ───────────────────────────────────────────────────────────

/**
 * Summary cards — Appropriation from tbl_appropriations,
 * Allotment/Obligation/Disbursement from tbl_budget_executions.
 */
function buildMonitoringSummaryCards(arrAppropriations, arrExecutions, intDivisor)
{
  const dblAppropriation = arrAppropriations.reduce(
    (sum, row) => sum + toNumber(row.appr_amount), 0
  );
  const dblAllotment = arrExecutions.reduce(
    (sum, row) => sum + toNumber(row.be_allotment_amount), 0
  );
  const dblObligation = arrExecutions.reduce(
    (sum, row) => sum + toNumber(row.be_obligation_amount), 0
  );
  const dblDisbursement = arrExecutions.reduce(
    (sum, row) => sum + toNumber(row.be_disbursement_amount), 0
  );

  return [
    { key: 'appropriation', label: 'Appropriation', value: r2(dblAppropriation / intDivisor) },
    { key: 'allotment',     label: 'Allotment',     value: r2(dblAllotment     / intDivisor) },
    { key: 'obligation',    label: 'Obligation',     value: r2(dblObligation    / intDivisor) },
    { key: 'disbursement',  label: 'Disbursement',  value: r2(dblDisbursement  / intDivisor) },
  ];
}

/**
 * 5-year trend — aggregate appropriation + execution per fiscal year,
 * sorted ascending by year label.
 */
function buildMonitoringTrend(db, intDivisor)
{
  const arrFiscalYears = db.rows('fiscal-years');
  const objFYLabelById = {};
  arrFiscalYears.forEach((fy) => { objFYLabelById[fy.fy_id] = String(fy.fy_year); });

  const objByYear = {};

  db.rows('appropriations').forEach((objRow) => {
    const strYear = objFYLabelById[objRow.appr_fiscal_year_id];
    if (!strYear) return;
    if (!objByYear[strYear]) objByYear[strYear] = { appropriation: 0, allotment: 0, obligation: 0, disbursement: 0 };
    objByYear[strYear].appropriation += toNumber(objRow.appr_amount);
  });

  db.rows('budget-executions').forEach((objRow) => {
    const strYear = objFYLabelById[objRow.be_fiscal_year_id];
    if (!strYear) return;
    if (!objByYear[strYear]) objByYear[strYear] = { appropriation: 0, allotment: 0, obligation: 0, disbursement: 0 };
    objByYear[strYear].allotment    += toNumber(objRow.be_allotment_amount);
    objByYear[strYear].obligation   += toNumber(objRow.be_obligation_amount);
    objByYear[strYear].disbursement += toNumber(objRow.be_disbursement_amount);
  });

  return Object.entries(objByYear)
    .sort(([a], [b]) => Number(a) - Number(b))
    .slice(-5)
    .map(([strYear, objTotals]) => ({
      year:          strYear,
      appropriation: r2(objTotals.appropriation / intDivisor),
      allotment:     r2(objTotals.allotment     / intDivisor),
      obligation:    r2(objTotals.obligation    / intDivisor),
      disbursement:  r2(objTotals.disbursement  / intDivisor),
    }));
}

/**
 * Variance by category (PS / MOOE / CO / TAG):
 * releasedVariance  = appropriation − allotment
 * executionVariance = allotment − obligation
 */
function buildVarianceByCategory(arrAppropriations, arrExecutions, intDivisor)
{
  const CAT_CODE = { 1: 'PS', 2: 'MOOE', 3: 'CO', 4: 'TAG' };
  const objApprop = { PS: 0, MOOE: 0, CO: 0, TAG: 0 };
  const objAllot  = { PS: 0, MOOE: 0, CO: 0, TAG: 0 };
  const objOblig  = { PS: 0, MOOE: 0, CO: 0, TAG: 0 };

  arrAppropriations.forEach((objRow) => {
    const strCode = CAT_CODE[objRow.appr_category_id];
    if (strCode) objApprop[strCode] += toNumber(objRow.appr_amount);
  });

  arrExecutions.forEach((objRow) => {
    const strCode = CAT_CODE[objRow.be_category_id];
    if (strCode)
    {
      objAllot[strCode] += toNumber(objRow.be_allotment_amount);
      objOblig[strCode] += toNumber(objRow.be_obligation_amount);
    }
  });

  return ['PS', 'MOOE', 'CO', 'TAG'].map((strCode) => ({
    category:          strCode,
    releasedVariance:  r2((objApprop[strCode] - objAllot[strCode]) / intDivisor),
    executionVariance: r2((objAllot[strCode]  - objOblig[strCode]) / intDivisor),
  }));
}

/**
 * Performance table — one row per requesting unit,
 * aggregating across all categories for the filtered fiscal year.
 */
function buildPerformanceRows(db, objFilters, intDivisor)
{
  const intFiscalYearId     = objFilters.fiscalYearId     ? Number(objFilters.fiscalYearId)     : null;
  const intRequestingUnitId = objFilters.requestingUnitId ? Number(objFilters.requestingUnitId) : null;
  const intCategoryId       = objFilters.categoryId       ? Number(objFilters.categoryId)       : null;

  const arrUnits = db.rows('requesting-units');

  // aggregate appropriation per unit
  const objApprByUnit = {};
  db.rows('appropriations')
    .filter((r) => !intFiscalYearId || Number(r.appr_fiscal_year_id) === intFiscalYearId)
    .filter((r) => !intRequestingUnitId || Number(r.appr_requesting_unit_id) === intRequestingUnitId)
    .filter((r) => !intCategoryId || Number(r.appr_category_id) === intCategoryId)
    .forEach((r) => {
      const id = Number(r.appr_requesting_unit_id);
      objApprByUnit[id] = (objApprByUnit[id] || 0) + toNumber(r.appr_amount);
    });

  // aggregate execution per unit
  const objExecByUnit = {};
  db.rows('budget-executions')
    .filter((r) => !intFiscalYearId || Number(r.be_fiscal_year_id) === intFiscalYearId)
    .filter((r) => !intRequestingUnitId || Number(r.be_requesting_unit_id) === intRequestingUnitId)
    .filter((r) => !intCategoryId || Number(r.be_category_id) === intCategoryId)
    .forEach((r) => {
      const id = Number(r.be_requesting_unit_id);
      if (!objExecByUnit[id]) objExecByUnit[id] = { allotment: 0, obligation: 0, disbursement: 0 };
      objExecByUnit[id].allotment    += toNumber(r.be_allotment_amount);
      objExecByUnit[id].obligation   += toNumber(r.be_obligation_amount);
      objExecByUnit[id].disbursement += toNumber(r.be_disbursement_amount);
    });

  return arrUnits
    .map((objUnit) => {
      const intUnitId       = Number(objUnit.ru_id);
      const dblAppropriation = (objApprByUnit[intUnitId]  || 0) / intDivisor;
      if (dblAppropriation <= 0) return null;

      const objExec         = objExecByUnit[intUnitId] || { allotment: 0, obligation: 0, disbursement: 0 };
      const dblAllotment    = r2(objExec.allotment    / intDivisor);
      const dblObligation   = r2(objExec.obligation   / intDivisor);
      const dblDisbursement = r2(objExec.disbursement / intDivisor);

      return {
        requestingUnitId: objUnit.ru_id,
        requestingUnit:   objUnit.ru_name,
        appropriation:    r2(dblAppropriation),
        allotment:        dblAllotment,
        obligation:       dblObligation,
        disbursement:     dblDisbursement,
        executionRate:    getRatePercent(dblObligation,   dblAllotment),
        disbursementRate: getRatePercent(dblDisbursement, dblObligation),
        absorptionRate:   getRatePercent(dblDisbursement, dblAllotment),
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.appropriation - a.appropriation);
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function buildDashboardData(db, objFilters)
{
  const { arrCategories, objCategoryNameById, objCategoryCodeById } = buildCategoryMaps(db);
  const arrFiscalYears  = db.rows('fiscal-years');
  const arrUnits        = db.rows('requesting-units');
  const intDivisor      = getPeriodDivisor(objFilters.period);

  // Planning
  const arrRequests          = getFilteredBudgetRequests(db, objFilters);
  const objItemsByRequestId  = buildRequestItemMap(db);
  const objPlanningBreakdown = buildPlanningCategoryBreakdown(arrRequests, objItemsByRequestId, objFilters, objCategoryCodeById);
  const objUnifiedBreakdown  = buildUnifiedCategoryBreakdown(db, objFilters);

  // Monitoring
  const arrAppropriations = getFilteredAppropriations(db, objFilters);
  const arrExecutions     = getFilteredExecutions(db, objFilters);
  const arrVarianceRows   = buildVarianceByCategory(arrAppropriations, arrExecutions, intDivisor);

  return {
    filters: {
      fiscalYears:     mapReferenceOptions(arrFiscalYears, 'fy_id', 'fy_year'),
      categories:      mapReferenceOptions(arrCategories,  'bcat_id', 'bcat_name'),
      requestingUnits: mapReferenceOptions(arrUnits, 'ru_id', 'ru_name'),
      periods: [
        { value: 'annually',  label: 'Annually'  },
        { value: 'semiAnnually', label: 'Semi-Annually' },
        { value: 'quarterly', label: 'Quarterly' },
        { value: 'monthly',   label: 'Monthly'   },
      ],
      budgetStatuses: [
        { value: 'all',          label: 'All' },
        { value: 'pending',      label: 'Pending'      },
        { value: 'submitted',    label: 'Submitted'    },
        { value: 'reviewed',     label: 'Reviewed'     },
        { value: 'rejected',     label: 'Rejected'     },
        { value: 'consolidated', label: 'Consolidated' },
      ],
    },

    planning: {
      statusSummary: buildStatusSummary(arrRequests),
      budgetByCategory: {
        labels: ['PS', 'MOOE', 'CO', 'TAG'],
        datasets: [
          {
            key:   'budget_requests',
            label: 'Budget Requests',
            data:  [
              objPlanningBreakdown.PS,
              objPlanningBreakdown.MOOE,
              objPlanningBreakdown.CO,
              objPlanningBreakdown.TAG,
            ],
          },
          {
            key:   'unified_budget',
            label: 'Unified Budget',
            data:  [
              objUnifiedBreakdown.PS,
              objUnifiedBreakdown.MOOE,
              objUnifiedBreakdown.CO,
              objUnifiedBreakdown.TAG,
            ],
          },
        ],
      },
      categoryLegend: {
        PS:   objCategoryNameById[1] || 'Personnel Services',
        MOOE: objCategoryNameById[2] || 'Maintenance and Other Operating Expenses',
        CO:   objCategoryNameById[3] || 'Capital Outlay',
        TAG:  objCategoryNameById[4] || 'Project Tagging',
      },
    },

    monitoring: {
      summaryCards:      buildMonitoringSummaryCards(arrAppropriations, arrExecutions, intDivisor),
      trend:             buildMonitoringTrend(db, intDivisor),
      releasedVariance: {
        labels: arrVarianceRows.map((r) => r.category),
        values: arrVarianceRows.map((r) => r.releasedVariance),
      },
      executionVariance: {
        labels: arrVarianceRows.map((r) => r.category),
        values: arrVarianceRows.map((r) => r.executionVariance),
      },
      performanceRows: buildPerformanceRows(db, objFilters, intDivisor),
    },
  };
}