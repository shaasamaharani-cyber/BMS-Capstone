/**
 * System Name: Budget Management System
 * Module Name: Dashboard
 *
 * Purpose of this file:
 * Financial dashboard for budget planning, status and monitoring.
 *
 * Author(s): QUT Group 27
 *
 * Copyright (C) 2026
 * by the Department of Science and Technology - Central Office
 * Developed by Team 27, Queensland University of Technology
 * All rights reserved.
 */

import { useEffect, useMemo, useState } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import {
  BarElement,
  CategoryScale,
  Chart as ChartJs,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
} from 'chart.js';
import { Badge, Dropdown, Pagination, Table, Tabs, Typography } from '../../components/ui';
import PageHeader from '../../components/layout/page_header';
import DashboardFilters from '../../components/shared/dashboard_filters';
import { getDashboardData } from '../../api';
import { useAuth } from '../../context/auth_context';
import { isRequesterRole } from '../../utils/requesting_unit_scope';
import RequesterDashboard from './requester_dashboard';
import {
  ExecutionAmountCards,
  FinancialAlerts,
  FinancialOverview,
  PlanningInsight,
  ProjectedExpenditureChart,
} from './execution_insights';
import { SAMPLE_INSIGHTS } from './execution_insights_sample';
import { formatCurrency, formatRate, getRateClassName } from '../../utils/formatters';
import '../../styles/dashboard.css';
import '../../styles/tokens.css';

ChartJs.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const DASHBOARD_TABS = [
  { id: 'planning',   label: 'Budget Planning & Status' },
  { id: 'monitoring', label: 'Budget Execution Monitoring' },
];

const PERFORMANCE_PAGE_SIZE = 10;

const PASTEL_TREND_COLORS = {
  appropriation: '#AFCBFF',
  allotment:     '#CDB4FF',
  obligation:    '#B8F2E6',
  disbursement:  '#FFD6A5',
  ps: '#AFCBFF',
  mooe: '#FFD6A5',
  co: '#B8F2E6',
  tag: '#FBCFE8', 
};


const DEFAULT_FILTERS = {
  fiscal_year_id:    '',
  category_id:       '',
  requesting_unit_id: '',
  period:            'annually',
  budget_status:     'all',
};

const FALLBACK_OPTIONS = {
  fiscalYears:     [],
  categories:      [],
  requestingUnits: [],
  periods: [
    { value: 'annually',      label: 'Annually'      },
    { value: 'semi-annually', label: 'Semi-Annually' },
    { value: 'quarterly',     label: 'Quarterly'     },
    { value: 'monthly',       label: 'Monthly'       },
  ],
  budgetStatuses: [
    { value: 'all', label: 'All' },
  ],
};


function buildQueryFilters(objFilters)
{
  const objQuery = {
    period:        objFilters.period,
    budget_status: objFilters.budget_status,
  };

  if (objFilters.fiscal_year_id)     objQuery.fiscal_year_id     = objFilters.fiscal_year_id;
  if (objFilters.category_id)        objQuery.category_id        = objFilters.category_id;
  if (objFilters.requesting_unit_id) objQuery.requesting_unit_id = objFilters.requesting_unit_id;

  return objQuery;
}

function cloneNumbersFromDatasetData(arrData)
{
  return [...(arrData || [])].map((val) => Number(val) || 0);
}

function cloneBudgetByCategory(objBudgetByCategory)
{
  if (!objBudgetByCategory || !Array.isArray(objBudgetByCategory.datasets)) return objBudgetByCategory;

  return {
    ...objBudgetByCategory,
    labels: [...(objBudgetByCategory.labels || [])],
    datasets: objBudgetByCategory.datasets.map((objDs) => ({
      ...objDs,
      data: cloneNumbersFromDatasetData(objDs.data),
    })),
  };
}

function pickCategoryTotals(objSource)
{
  if (!objSource || typeof objSource !== 'object') return {};
  const objLower = {};
  Object.entries(objSource).forEach(([strKey, val]) => {
    objLower[String(strKey).toLowerCase()] = val;
  });
  return objLower;
}

function buildBudgetByCategoryFromTotals(objSubmitted, objApproved, arrLabels)
{
  const objSub = pickCategoryTotals(objSubmitted);
  const objApr = pickCategoryTotals(objApproved);
  const arrNormLabels = (arrLabels && arrLabels.length) ? arrLabels : ['PS', 'MOOE', 'CO', 'TAG'];
  const arrKeys = arrNormLabels.map((lbl) => String(lbl).toLowerCase());

  return {
    labels: [...arrNormLabels],
    datasets: [
      {
        label: 'Budget Requests',
        data:  arrKeys.map((strKey) => Number(objSub[strKey] ?? 0)),
      },
      {
        label: 'Unified Budget',
        data:  arrKeys.map((strKey) => Number(objApr[strKey] ?? 0)),
      },
    ],
  };
}

function normalizeDashboardPayload(objRaw)
{
  if (!objRaw || Object.keys(objRaw).length === 0) return null;

  const objSubmittedByCategory = objRaw?.planning?.submittedByCategory;
  const objApprovedByCategory  = objRaw?.planning?.approvedUnifiedByCategory;
  const blnHasGranularSubmitted = objSubmittedByCategory
    && typeof objSubmittedByCategory === 'object'
    && Object.keys(objSubmittedByCategory).length > 0;
  const blnHasGranularApproved = objApprovedByCategory
    && typeof objApprovedByCategory === 'object'
    && Object.keys(objApprovedByCategory).length > 0;
  const objBcFromApi = objRaw?.planning?.budgetByCategory;
  const blnHasSummaryCards = Array.isArray(objRaw?.monitoring?.summaryCards);

  if (objBcFromApi && blnHasSummaryCards)
  {
    let objBudgetByCategory = objBcFromApi;
    if (blnHasGranularSubmitted || blnHasGranularApproved)
    {
      objBudgetByCategory = buildBudgetByCategoryFromTotals(
        objSubmittedByCategory || {},
        objApprovedByCategory || {},
        objBcFromApi.labels
      );
    }
    else
    {
      objBudgetByCategory = cloneBudgetByCategory(objBcFromApi);
    }

    return {
      ...objRaw,
      planning: {
        ...objRaw.planning,
        budgetByCategory: objBudgetByCategory,
      },
    };
  }

  const objSubmittedLegacy = objRaw?.planning?.submittedByCategory        || {};
  const objApprovedLegacy  = objRaw?.planning?.approvedUnifiedByCategory  || {};
  const objStatusSummary       = objRaw?.planning?.statusSummary              || {};
  const arrTrendLegacy         = objRaw?.monitoring?.trendFiveYears           || [];
  const arrUnitPerformance     = objRaw?.monitoring?.unitPerformance          || [];
  const objSummaryAmounts      = objRaw?.monitoring?.summaryAmounts           || {};
  const arrStatusOptions       = objRaw?.filters?.budgetStatuses || objRaw?.filters?.statuses || [];

  return {
    filters: {
      fiscalYears:     objRaw?.filters?.fiscalYears     || [],
      categories:      objRaw?.filters?.categories      || [],
      requestingUnits: objRaw?.filters?.requestingUnits || [],
      periods:         objRaw?.filters?.periods         || FALLBACK_OPTIONS.periods,
      budgetStatuses:  arrStatusOptions,
    },
    planning: {
      statusSummary: [
        { status: 'pending',      label: 'Pending',      value: Number(objStatusSummary.pending || objStatusSummary.submitted || 0), color: 'pending'      },
        { status: 'reviewed',     label: 'Reviewed',     value: Number(objStatusSummary.reviewed     || 0),                          color: 'reviewed'     },
        { status: 'rejected',     label: 'Rejected',     value: Number(objStatusSummary.rejected     || 0),                          color: 'rejected'     },
        { status: 'consolidated', label: 'Consolidated', value: Number(objStatusSummary.consolidated || 0),                          color: 'consolidated' },
      ],
      budgetByCategory: {
        labels: ['PS', 'MOOE', 'CO', 'TAG'],
        datasets: [
          {
            label: 'Budget Requests',
            data: [
              Number(objSubmittedLegacy.ps   || 0),
              Number(objSubmittedLegacy.mooe || 0),
              Number(objSubmittedLegacy.co   || 0),
              Number(objSubmittedLegacy.tag  || 0),
            ],
          },
          {
            label: 'Unified Budget',
            data: [
              Number(objApprovedLegacy.ps   || 0),
              Number(objApprovedLegacy.mooe || 0),
              Number(objApprovedLegacy.co   || 0),
              Number(objApprovedLegacy.tag  || 0),
            ],
          },
        ],
      },
    },
    monitoring: {
      summaryCards: [
        { key: 'appropriation', label: 'Appropriation', value: Number(objSummaryAmounts.appropriation || 0) },
        { key: 'allotment',     label: 'Allotment',     value: Number(objSummaryAmounts.allotment     || 0) },
        { key: 'obligation',    label: 'Obligation',    value: Number(objSummaryAmounts.obligation    || 0) },
        { key: 'disbursement',  label: 'Disbursement',  value: Number(objSummaryAmounts.disbursement  || 0) },
      ],
      trend: arrTrendLegacy.map((objRow) => ({
        year:          String(objRow.year),
        appropriation: Number(objRow.appropriation || 0),
        allotment:     Number(objRow.allotment     || 0),
        obligation:    Number(objRow.obligation    || 0),
        disbursement:  Number(objRow.disbursement  || 0),
      })),
      releasedVariance: {
        labels: ['PS', 'MOOE', 'CO', 'TAG'],
        values: [
          Number(objRaw?.monitoring?.releasedVariance || 0) * 0.26,
          Number(objRaw?.monitoring?.releasedVariance || 0) * 0.34,
          Number(objRaw?.monitoring?.releasedVariance || 0) * 0.21,
          Number(objRaw?.monitoring?.releasedVariance || 0) * 0.19,
        ],
      },
      executionVariance: {
        labels: ['PS', 'MOOE', 'CO', 'TAG'],
        values: [
          Number(objRaw?.monitoring?.executionVariance || 0) * 0.25,
          Number(objRaw?.monitoring?.executionVariance || 0) * 0.35,
          Number(objRaw?.monitoring?.executionVariance || 0) * 0.22,
          Number(objRaw?.monitoring?.executionVariance || 0) * 0.18,
        ],
      },
      performanceRows: arrUnitPerformance.map((objRow) => ({
        requestingUnit:  objRow.requestingUnit,
        appropriation:   Number(objRow.appropriation   || 0),
        allotment:       Number(objRow.allotment       || 0),
        obligation:      Number(objRow.obligation      || 0),
        disbursement:    Number(objRow.disbursement    || 0),
        executionRate:   Number(objRow.executionRate   || 0),
        disbursementRate: Number(objRow.disbursementRate || 0),
        absorptionRate:  Number(objRow.absorptionRate  || 0),
      })),
    },
  };
}

function OrganisationDashboard()
{
  const [strActiveTab,       setStrActiveTab]       = useState('planning');
  const [objDraftFilters,    setObjDraftFilters]    = useState(DEFAULT_FILTERS);
  const [objAppliedFilters,  setObjAppliedFilters]  = useState(DEFAULT_FILTERS);
  const [objDashboardData,   setObjDashboardData]   = useState(null);
  const [objFilterOptions,   setObjFilterOptions]   = useState(FALLBACK_OPTIONS);
  const [blnLoading,         setBlnLoading]         = useState(false);
  const [strError,           setStrError]           = useState('');
  const [strPerformanceSortKey, setStrPerformanceSortKey] = useState('requestingUnit');
  const [strPerformanceSortDir, setStrPerformanceSortDir] = useState('asc');
  const [intPerformancePage, setIntPerformancePage] = useState(1);

  const objChartColors = useMemo(() => ({
    ps:             PASTEL_TREND_COLORS.ps,
    mooe:           PASTEL_TREND_COLORS.mooe,
    co:             PASTEL_TREND_COLORS.co,
    tag:            PASTEL_TREND_COLORS.tag,
    appropriation:  PASTEL_TREND_COLORS.appropriation,
    allotment:      PASTEL_TREND_COLORS.allotment,
    obligation:     PASTEL_TREND_COLORS.obligation,
    disbursement:   PASTEL_TREND_COLORS.disbursement,
  }), []);

  useEffect(() => {
    async function fetchDashboard()
    {
      setBlnLoading(true);
      setStrError('');
      try {
        const objRawData = await getDashboardData(buildQueryFilters(objAppliedFilters));
        const objData    = normalizeDashboardPayload(objRawData);
        setObjDashboardData(objData);
        setObjFilterOptions({
          fiscalYears:     objData?.filters?.fiscalYears     || [],
          categories:      objData?.filters?.categories      || [],
          requestingUnits: objData?.filters?.requestingUnits || [],
          periods:         objData?.filters?.periods         || FALLBACK_OPTIONS.periods,
          budgetStatuses:  objData?.filters?.budgetStatuses  || FALLBACK_OPTIONS.budgetStatuses,
        });
      } catch (objFetchError) {
        setStrError(objFetchError?.message || 'Cannot perform transaction. Error encountered.');
      } finally {
        setBlnLoading(false);
      }
    }

    fetchDashboard();
  }, [objAppliedFilters]);

  const objChartOptions = useMemo(() => ({
    responsive:          true,
    maintainAspectRatio: false,
    interaction:         { mode: 'index', intersect: false },
    plugins:             {
      legend: {
        position: 'top',
        align:    'end',
        labels:   {
          boxWidth:       10,
          boxHeight:      10,
          usePointStyle:  true,
          pointStyle:     'rectRounded',
          padding:        16,
        },
      },
    },
    scales: {
      x: {
        grid:   { display: false },
        border: { display: false },
        ticks:  { maxRotation: 0 },
      },
      y: {
        border: { display: false },
        grid:   { drawTicks: false },
        ticks:  { padding: 8 },
      },
    },
  }), []);

  const objBudgetRequestBarData = useMemo(() => {
    const objPlanning = objDashboardData?.planning?.budgetByCategory;
    if (!objPlanning) return { labels: [], datasets: [] };

    return {
      labels: objPlanning.labels || [],
      datasets: [
        {
          label:           objPlanning.datasets?.[0]?.label || 'Budget Requests',
          data:            objPlanning.datasets?.[0]?.data || [],
          backgroundColor: [objChartColors.ps, objChartColors.mooe, objChartColors.co, objChartColors.tag],
        },
      ],
    };
  }, [objChartColors, objDashboardData]);

  const objUnifiedBudgetBarData = useMemo(() => {
    const objPlanning = objDashboardData?.planning?.budgetByCategory;
    if (!objPlanning) return { labels: [], datasets: [] };

    return {
      labels: objPlanning.labels || [],
      datasets: [
        {
          label:           objPlanning.datasets?.[1]?.label || 'Unified Budget',
          data:            objPlanning.datasets?.[1]?.data || [],
          backgroundColor: [objChartColors.ps, objChartColors.mooe, objChartColors.co, objChartColors.tag],
        },
      ],
    };
  }, [objChartColors, objDashboardData]);

  const objTrendLineData = useMemo(() => {
    const arrTrend = objDashboardData?.monitoring?.trend || [];
    return {
      labels: arrTrend.map((objRow) => objRow.year),
      datasets: [
        { label: 'Appropriation', data: arrTrend.map((r) => r.appropriation), borderColor: PASTEL_TREND_COLORS.appropriation, backgroundColor: PASTEL_TREND_COLORS.appropriation },
        { label: 'Allotment',     data: arrTrend.map((r) => r.allotment),     borderColor: PASTEL_TREND_COLORS.allotment,     backgroundColor: PASTEL_TREND_COLORS.allotment },
        { label: 'Obligation',    data: arrTrend.map((r) => r.obligation),    borderColor: PASTEL_TREND_COLORS.obligation,    backgroundColor: PASTEL_TREND_COLORS.obligation },
        { label: 'Disbursement',  data: arrTrend.map((r) => r.disbursement),  borderColor: PASTEL_TREND_COLORS.disbursement,  backgroundColor: PASTEL_TREND_COLORS.disbursement },
      ],
    };
  }, [objDashboardData]);

  const objReleasedVarianceData = useMemo(() => {
    const objVariance = objDashboardData?.monitoring?.releasedVariance;
    return {
      labels: objVariance?.labels || [],
      datasets: [
        {
          label:           'Released Amount = Appropriation − Allotment',
          data:            objVariance?.values || [],
          backgroundColor: [objChartColors.ps, objChartColors.mooe, objChartColors.co , objChartColors.tag],
        },
      ],
    };
  }, [objChartColors, objDashboardData]);

  const objExecutionVarianceData = useMemo(() => {
    const objVariance = objDashboardData?.monitoring?.executionVariance;
    return {
      labels: objVariance?.labels || [],
      datasets: [
        {
          label:           'Execution Amount = Allotment − Obligation',
          data:            objVariance?.values || [],
          backgroundColor: [objChartColors.ps, objChartColors.mooe, objChartColors.co, objChartColors.tag],
        },
      ],
    };
  }, [objChartColors, objDashboardData]);

  const renderRateCell = (value) => (
    <span className={getRateClassName(value)}>{formatRate(value)}</span>
  );

  const arrPerformanceColumns = useMemo(() => ([
    { key: 'requestingUnit',  label: 'Requesting Unit', sortable: true },
    { key: 'appropriation',   label: 'Appropriation', sortable: true, render: (value) => formatCurrency(value) },
    { key: 'allotment',       label: 'Allotment', sortable: true, render: (value) => formatCurrency(value) },
    { key: 'obligation',      label: 'Obligation', sortable: true, render: (value) => formatCurrency(value) },
    { key: 'disbursement',    label: 'Disbursement', sortable: true, render: (value) => formatCurrency(value) },
    { key: 'executionRate',   label: 'Execution Rate', sortable: true, render: renderRateCell },
    { key: 'disbursementRate', label: 'Disbursement Rate', sortable: true, render: renderRateCell },
    { key: 'absorptionRate',  label: 'Absorption Rate', sortable: true, render: renderRateCell },
  ]), []);

  const arrPerformanceRows = useMemo(() => {
    const arrRows = [...(objDashboardData?.monitoring?.performanceRows || [])];
    arrRows.sort((objA, objB) => {
      const left = objA?.[strPerformanceSortKey];
      const right = objB?.[strPerformanceSortKey];
      const intResult = typeof left === 'number' && typeof right === 'number'
        ? left - right
        : String(left ?? '').localeCompare(String(right ?? ''), undefined, { numeric: true, sensitivity: 'base' });
      return strPerformanceSortDir === 'desc' ? -intResult : intResult;
    });
    return arrRows;
  }, [objDashboardData, strPerformanceSortDir, strPerformanceSortKey]);

  const arrPagedPerformanceRows = useMemo(() => {
    const intStart = (intPerformancePage - 1) * PERFORMANCE_PAGE_SIZE;
    return arrPerformanceRows.slice(intStart, intStart + PERFORMANCE_PAGE_SIZE);
  }, [arrPerformanceRows, intPerformancePage]);

  const handlePerformanceSort = (strKey) => {
    const nextDir = strPerformanceSortKey === strKey && strPerformanceSortDir === 'asc' ? 'desc' : 'asc';
    setStrPerformanceSortKey(strKey);
    setStrPerformanceSortDir(nextDir);
    setIntPerformancePage(1);
  };

  const handleFilterChange = (strKey, strValue) => {
    setObjDraftFilters((objPrev) => ({
      ...objPrev,
      [strKey]: strValue || '',
    }));
  };

  const handleApplyFilters = () => {
    setObjAppliedFilters(objDraftFilters);
    setIntPerformancePage(1);
  };

  const handleClearFilters = () => {
    setObjDraftFilters(DEFAULT_FILTERS);
    setObjAppliedFilters(DEFAULT_FILTERS);
    setIntPerformancePage(1);
  };

  return (
    <div className="dashboard-page">
      <PageHeader title="Financial Dashboard" />

      <Tabs
        tabs={DASHBOARD_TABS}
        activeTab={strActiveTab}
        onChange={setStrActiveTab}
      />

      <div className="mt-3">
        <DashboardFilters
          value={objDraftFilters}
          options={objFilterOptions}
          onChange={handleFilterChange}
          onApply={handleApplyFilters}
          onClear={handleClearFilters}
          loading={blnLoading}
        />
      </div>

      {strError && (
        <div className="dashboard-alert dashboard-alert--danger" role="alert">
          {strError}
        </div>
      )}

      {strActiveTab === 'planning' && (
        <div className="dashboard-tab-section">
          <section className="dashboard-section" aria-labelledby="dashboard-planning-status-heading">
            <div className="row">
              <div className="col-12 mb-3">
                <Typography
                  id="dashboard-planning-status-heading"
                  variant="h4"
                  className="dashboard-section__title"
                >
                  Budget Request Status
                </Typography>
              </div>
            </div>
            <div className="row g-3">
              {(objDashboardData?.planning?.statusSummary || []).map((objStatus) => (
                <div key={objStatus.status} className="col-sm-6 col-xl-3">
                  <div className={`dashboard-status-card dashboard-status-card--${objStatus.status}`}>
                    <div className="d-flex justify-content-between align-items-center">
                      <Badge status={objStatus.color} label={objStatus.label} />
                    </div>
                    <Typography variant="h2" className="mb-0 dashboard-status-card__value">
                      {objStatus.value}
                    </Typography>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="dashboard-section" aria-labelledby="dashboard-planning-breakdown-heading">
            <div className="row">
              <div className="col-12 mb-3">
                <Typography
                  id="dashboard-planning-breakdown-heading"
                  variant="h4"
                  className="dashboard-section__title"
                >
                  Budget Amount Breakdown by Category
                </Typography>
              </div>
            </div>
            <div className="dashboard-panel">
              <div className="dashboard-panel__toolbar">
                <div className="row g-3 align-items-end">
                  <div className="col-md-4">
                    <Dropdown
                      options={objFilterOptions.budgetStatuses}
                      value={objDraftFilters.budget_status}
                      onChange={(strValue) => handleFilterChange('budget_status', strValue)}
                      placeholder="All Statuses"
                    />
                  </div>
                </div>
              </div>
              <div className="row g-3 dashboard-panel__body--charts">
                <div className="col-lg-6">
                  <div className="dashboard-chart-card">
                    <div className="dashboard-panel__chart-title">Budget request</div>
                    <div className="dashboard-chart dashboard-chart--small">
                      <Bar data={objBudgetRequestBarData} options={objChartOptions} />
                    </div>
                  </div>
                </div>
                <div className="col-lg-6">
                  <div className="dashboard-chart-card">
                    <div className="dashboard-panel__chart-title">Unified budget</div>
                    <div className="dashboard-chart dashboard-chart--small">
                      <Bar data={objUnifiedBudgetBarData} options={objChartOptions} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {strActiveTab === 'monitoring' && (
        <div className="dashboard-tab-section">
          <ExecutionAmountCards summaryCards={objDashboardData?.monitoring?.summaryCards} />

          <FinancialOverview
            summaryCards={objDashboardData?.monitoring?.summaryCards}
            projectedYearEnd={SAMPLE_INSIGHTS.projectedYearEnd}
            projectedVariance={SAMPLE_INSIGHTS.projectedVariance}
          />

          <section className="dashboard-section">
            <div className="row g-3">
              <div className="col-lg-7">
                <ProjectedExpenditureChart {...SAMPLE_INSIGHTS.expenditure} />
              </div>
              <div className="col-lg-5">
                <FinancialAlerts
                  alerts={SAMPLE_INSIGHTS.alerts}
                  onView={() => document.getElementById('dashboard-monitoring-performance-heading')?.scrollIntoView({ behavior: 'smooth' })}
                />
              </div>
            </div>
          </section>

          <PlanningInsight year={SAMPLE_INSIGHTS.planningYear} items={SAMPLE_INSIGHTS.planning} />

          <section className="dashboard-section" aria-labelledby="dashboard-monitoring-trend-heading">
            <div className="row">
              <div className="col-12 mb-3">
                <Typography
                  id="dashboard-monitoring-trend-heading"
                  variant="h4"
                  className="dashboard-section__title"
                >
                  Budget Execution Trend
                </Typography>
              </div>
            </div>
            <div className="dashboard-panel">
              <div className="dashboard-chart">
                <Line data={objTrendLineData} options={objChartOptions} />
              </div>
            </div>
          </section>

          <section className="dashboard-section">
            <div className="row g-3">
              <div className="col-md-6 d-flex flex-column">
                <Typography variant="h4" className="mb-3 dashboard-section__title">
                  Released Amount Variance
                </Typography>
                <div className="dashboard-panel flex-grow-1">
                  <div className="dashboard-chart dashboard-chart--small">
                    <Bar data={objReleasedVarianceData} options={objChartOptions} />
                  </div>
                </div>
              </div>
              <div className="col-md-6 d-flex flex-column">
                <Typography variant="h4" className="mb-3 dashboard-section__title">
                  Execution Amount Variance
                </Typography>
                <div className="dashboard-panel flex-grow-1">
                  <div className="dashboard-chart dashboard-chart--small">
                    <Bar data={objExecutionVarianceData} options={objChartOptions} />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="dashboard-section" aria-labelledby="dashboard-monitoring-performance-heading">
            <div className="row">
              <div className="col-12 mb-3">
                <Typography
                  id="dashboard-monitoring-performance-heading"
                  variant="h4"
                  className="dashboard-section__title"
                >
                  Performance Summary by Requesting Unit
                </Typography>
              </div>
            </div>
            <div className="dashboard-table-shell">
              <Table
                columns={arrPerformanceColumns}
                data={arrPagedPerformanceRows}
                loading={blnLoading}
                emptyState="No monitoring records found for the selected filters."
                sortKey={strPerformanceSortKey}
                sortDir={strPerformanceSortDir}
                onSort={handlePerformanceSort}
              />
              {/* <Pagination
              total={arrPerformanceRows.length}
              page={intPerformancePage}
              pageSize={PERFORMANCE_PAGE_SIZE}
              onChange={setIntPerformancePage}
            /> */}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

// Each role gets the dashboard that answers its own question; requesters only ever see their own unit
export default function DashboardPage()
{
  const { user } = useAuth();

  return isRequesterRole(user) ? <RequesterDashboard /> : <OrganisationDashboard />;
}
