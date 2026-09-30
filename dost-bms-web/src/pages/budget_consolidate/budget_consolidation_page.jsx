/**
 * System Name: Budget Management System
 * Module Name: Core Module
 *
 * Purpose of this file:
 * Unified budget consolidation list page with summary metrics, filterable table, and create/manage actions.
 *
 * Author(s): QUT Group 27
 *
 * Copyright (C) 2026
 * by the Department of Science and Technology - Central Office
 * Developed by Team 27, Queensland University of Technology
 * All rights reserved.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/layout/page_header';
import {
  Button,
  Badge,
  Table,
  Modal,
  Input,
  Dropdown,
  Pagination,
  MetricCard,
} from '../../components/ui';
import {
  getUnifiedBudgets,
  getSummaryStats,
  getUnifiedBudgetStageOptions,
  getUnifiedBudgetStatusOptions,
  getUnifiedBudgetFiscalYearOptions,
} from '../../api/budget_consolidation_api';
import { getReviewedBudgetRequests } from '../../api/budget_requests_api';
import { formatTimestamp, getBadgeStatus } from '../../utils/formatters';
import { useAuth } from '../../context/auth_context';
import { getFiscalYear } from '../../utils/helpers';
import { toReviewedRequests } from '../../utils/budget_request_utils';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const PAGE_SIZE = 5;

// Accent colours for the MetricCard summary banners
const METRIC_ACCENT = {
  totalRequestsToReview: 'var(--color-text-muted)',
  consolidatedRequests: 'var(--color-brand-primary)',
  ps: 'var(--ps)',
  mooe: 'var(--mooe)',
  co: 'var(--co)',
};

const parseBudgetValue = (value) => {
  const numeric = Number(String(value ?? '').replace(/[^\d.]/g, ''));
  return Number.isNaN(numeric) ? 0 : numeric;
};



// ---------------------------------------------------------------------------
// ActionMenu — inline dropdown for each table row (portal-based to escape overflow)
// ---------------------------------------------------------------------------
function ActionMenu({ row, navigate, canApprove }) {
  const normalizedStatus = String(row.status || '').trim().toUpperCase();
  const canEdit = ['DRAFT', 'REJECTED'].includes(normalizedStatus);
  const showApprove = canApprove && normalizedStatus === 'PENDING';
  const [blnOpen, setBlnOpen] = useState(false);
  const [objMenuStyle, setObjMenuStyle] = useState({});
  const btnRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!blnOpen) return;
    const rect = btnRef.current?.getBoundingClientRect();
    if (rect) {
      setObjMenuStyle({
        position: 'fixed',
        top: rect.bottom + 2,
        left: rect.left,
        minWidth: rect.width,
        zIndex: 9999,
      });
    }
    const handleClickOutside = (e) => {
      if (!btnRef.current?.contains(e.target) && !menuRef.current?.contains(e.target)) {
        setBlnOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [blnOpen]);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className="btn btn-sm btn-outline-secondary dropdown-toggle"
        onClick={() => setBlnOpen((v) => !v)}
        aria-expanded={blnOpen}
      >
        Actions
      </button>
      {blnOpen && createPortal(
        <ul ref={menuRef} className="dropdown-menu show" style={objMenuStyle}>
          <li>
            <button type="button" className="dropdown-item" onClick={() => { setBlnOpen(false); navigate(`/budget-consolidation/${row.id}`); }}>
              View
            </button>
          </li>
          {canEdit && (
            <li>
              <button type="button" className="dropdown-item" onClick={() => { setBlnOpen(false); navigate(`/budget-consolidation/${row.id}/edit`); }}>
                Edit
              </button>
            </li>
          )}
          {showApprove && (
            <li>
              <button type="button" className="dropdown-item" onClick={() => { setBlnOpen(false); navigate(`/budget-consolidation/${row.id}`); }}>
                Approve
              </button>
            </li>
          )}
        </ul>,
        document.body
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Table column definitions
// ---------------------------------------------------------------------------
const TABLE_COLUMNS = [
  {
    key: 'title',
    label: 'Title',
    render: (_, row) => (
      <div>
        <div className="fw-bold text-brand">
          {row.title}
        </div>
        <small className="text-muted">{row.code}</small>
      </div>
    ),
  },
  // { key: 'requestingUnit', label: 'Requesting Unit' },
  {
    key: 'fiscalYear',
    label: 'Fiscal Year',
    render: (_, row) => getFiscalYear(row.periodStart),
  },
  {
    key: 'status',
    label: 'Status',
    render: (_, row) => <Badge status={getBadgeStatus(row.status)} label={row.status} />,
  },
  { key: 'stage', label: 'Stage' },
  { key: 'lastUpdated', label: 'Last Updated', render: (_, row) => formatTimestamp(row.lastUpdated) },
  {
    key: 'actions',
    label: 'Actions',
    width: '120px',
    render: () => null,
  },
];

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------
export default function BudgetConsolidationPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const canApprove = String(user?.role?.role_group || '').toLowerCase() === 'executive';

  // ── Data state ──
  const [arrBudgets, setArrBudgets] = useState([]);
  const [intTotalBudgets, setIntTotalBudgets] = useState(0);
  const [objSummaryStats, setObjSummaryStats] = useState(null);
  const [intReviewedCount, setIntReviewedCount] = useState(0);
  const [blnIsLoading, setBlnIsLoading] = useState(true);

  // ── UI state ──
  const [objFilters, setObjFilters] = useState({ title: '', stage: '', fiscalYear: '', status: '' });
  const [objAppliedFilters, setObjAppliedFilters] = useState({ title: '', stage: '', fiscalYear: '', status: '' });
  const [strSortKey, setStrSortKey] = useState('lastUpdated');
  const [strSortDir, setStrSortDir] = useState('desc');
  const [intCurrentPage, setIntCurrentPage] = useState(1);
  const [objMeta, setObjMeta] = useState({ current_page: 1, last_page: 1, total: 0, per_page: PAGE_SIZE });
  const [blnShowConsolidateModal, setBlnShowConsolidateModal] = useState(false);
  const isCreating = false;
  const [arrReviewedRequests, setArrReviewedRequests] = useState([]);
  const [blnModalLoading, setBlnModalLoading] = useState(false);
  const [strModalError, setStrModalError] = useState('');
  const [arrFiscalYearOptions, setArrFiscalYearOptions] = useState([]);
  const [arrStageOptions, setArrStageOptions] = useState([]);
  const [arrStatusOptions, setArrStatusOptions] = useState([]);
  const [blnIsFilterOptionsLoading, setBlnIsFilterOptionsLoading] = useState(true);

  // ── Load summary stats once on mount ──
  useEffect(() => {
    let isMounted = true;
    Promise.all([
      getSummaryStats(),
      getReviewedBudgetRequests(),
    ])
      .then(([stats, reviewedRes]) => {
        if (!isMounted) return;
        setObjSummaryStats(stats);
        setIntReviewedCount(toReviewedRequests(reviewedRes).length);
      });
    return () => { isMounted = false; };
  }, []);

  // ── Load filter options from API on mount ──
  useEffect(() => {
    let isMounted = true;

    const loadFilterOptions = async () => {
      setBlnIsFilterOptionsLoading(true);
      try {
        const [arrStages, arrStatuses, arrFiscalYears] = await Promise.all([
          getUnifiedBudgetStageOptions(),
          getUnifiedBudgetStatusOptions(),
          getUnifiedBudgetFiscalYearOptions(),
        ]);

        if (!isMounted) return;
        setArrStageOptions(Array.isArray(arrStages) ? arrStages : []);
        setArrStatusOptions(Array.isArray(arrStatuses) ? arrStatuses : []);
        setArrFiscalYearOptions(Array.isArray(arrFiscalYears) ? arrFiscalYears : []);
      } catch {
        if (!isMounted) return;
        setArrStageOptions([]);
        setArrStatusOptions([]);
        setArrFiscalYearOptions([]);
      } finally {
        if (isMounted) setBlnIsFilterOptionsLoading(false);
      }
    };

    loadFilterOptions();
    return () => { isMounted = false; };
  }, []);

  // ── Load arrBudgets whenever applied objFilters change ──
  useEffect(() => {
    let isMounted = true;
    setBlnIsLoading(true);

    getUnifiedBudgets({
      page: intCurrentPage,
      per_page: PAGE_SIZE,
      title: objAppliedFilters.title || undefined,
      fiscal_year: objAppliedFilters.fiscalYear || undefined,
      stage: objAppliedFilters.stage || undefined,
      status: objAppliedFilters.status || undefined,
      sort_by: strSortKey,
      sort_dir: strSortDir,
    })
      .then(({ data, objMeta: apiMeta }) => {
        if (!isMounted) return;
        setArrBudgets(data || []);
        setObjMeta(apiMeta || { current_page: 1, last_page: 1, total: 0, per_page: PAGE_SIZE });
        setIntTotalBudgets(apiMeta?.total || 0);
      })
      .finally(() => {
        if (isMounted) setBlnIsLoading(false);
      });

    return () => { isMounted = false; };
  }, [objAppliedFilters, intCurrentPage, strSortKey, strSortDir]);

  // ── Fetch reviewed requests only when modal opens ──
  useEffect(() => {
    if (!blnShowConsolidateModal) return undefined;

    let isMounted = true;
    const fetchReviewed = async () => {
      setBlnModalLoading(true);
      setStrModalError('');
      try {
        // Always fetch from API when modal opens (no hardcoded list).
        const res = await getReviewedBudgetRequests();
        if (!isMounted) return;
        setArrReviewedRequests(toReviewedRequests(res));
      } catch {
        if (!isMounted) return;
        setStrModalError('Failed to load reviewed requests. Please try again.');
        setArrReviewedRequests([]);
      } finally {
        if (isMounted) setBlnModalLoading(false);
      }
    };

    fetchReviewed();
    return () => { isMounted = false; };
  }, [blnShowConsolidateModal]);

  // ── Handlers ──
  const handleSearch = () => {
    setObjAppliedFilters({ ...objFilters });
    setIntCurrentPage(1);
  };

  const handleClear = () => {
    const empty = { title: '', stage: '', fiscalYear: '', status: '' };
    setObjFilters(empty);
    setObjAppliedFilters(empty);
    setIntCurrentPage(1);
  };

  const handleSort = (key) => {
    const nextDir = strSortKey === key && strSortDir === 'asc' ? 'desc' : 'asc';
    setStrSortKey(key);
    setStrSortDir(nextDir);
    setIntCurrentPage(1);
  };

  const handleCreateConsolidation = () => {
    const selectedIds = arrReviewedRequests
      .map((request) => request.id ?? request.br_id)
      .filter((id) => typeof id !== 'undefined' && id !== null);
    if (selectedIds.length === 0) {
      setStrModalError('No reviewed requests available for consolidation.');
      return;
    }

    setBlnShowConsolidateModal(false);
    navigate('/budget-consolidation/new', {
      state: { selectedRequestIds: selectedIds },
    });
  };

  const handleBackToList = () => {
    setBlnShowConsolidateModal(false);
    setStrModalError('');
  };

  // ── Build MetricCard data from API response ──
  const metricCards = objSummaryStats
    ? (() => {
      const psValue = parseBudgetValue(objSummaryStats.ps);
      const mooeValue = parseBudgetValue(objSummaryStats.mooe);
      const coValue = parseBudgetValue(objSummaryStats.co);
      const totalCategoryValue = psValue + mooeValue + coValue;
      const getProgress = (value) => (totalCategoryValue > 0 ? (value / totalCategoryValue) * 100 : 0);

      return [
        {
          label: 'Total Requests ready for consolidation',
          value: intReviewedCount,
          subtitle: 'Files Reviewed',
          accentColor: METRIC_ACCENT.totalRequestsToReview,
        },
        {
          label: 'Personnel Services (PS)',
          value: objSummaryStats.ps,
          accentColor: METRIC_ACCENT.ps,
          progress: getProgress(psValue),
        },
        {
          label: 'MOOE',
          value: objSummaryStats.mooe,
          accentColor: METRIC_ACCENT.mooe,
          progress: getProgress(mooeValue),
        },
        {
          label: 'Capital Outlay (CO)',
          value: objSummaryStats.co,
          accentColor: METRIC_ACCENT.co,
          progress: getProgress(coValue),
        },
      ];
    })()
    : [];

  const columns = useMemo(
    () =>
      TABLE_COLUMNS.map((col) =>
        col.key === 'actions'
          ? { ...col, render: (_, row) => <ActionMenu row={row} navigate={navigate} canApprove={canApprove} /> }
          : { ...col, sortable: true }
      ),
    [navigate, canApprove]
  );

  return (
    <div>
      {/* ── Section 1: Page Header ── */}
      <PageHeader title="Budget Consolidation">
        <Button onClick={() => setBlnShowConsolidateModal(true)}>
          🔗 Consolidate Budget
        </Button>
      </PageHeader>

      {/* ── Section 2: Summary Metric Cards ── */}
      <div className="budget-consolidation-metric-grid mb-4">
        {metricCards.map((card) => (
          <div key={card.label}>
            <MetricCard
              label={card.label}
              value={card.value}
              subtitle={card.subtitle}
              accentColor={card.accentColor}
              progress={card.progress}
            />
          </div>
        ))}
      </div>

      {/* ── Section 3: Filter & Sort Bar ── */}
      <div className="w-100 mb-3">
        <div className="row g-2 align-items-end">
          <div className="col-12 col-md-3">
            <label className="form-label mb-1">Title</label>
            <Input
              placeholder="Search by title"
              value={objFilters.title}
              onChange={(e) => setObjFilters((prev) => ({ ...prev, title: e.target.value }))}
            />
          </div>

          <div className="col-12 col-md-2">
            <label className="form-label mb-1">Stage</label>
            <Dropdown
              options={[
                { value: '', label: 'All Stages' },
                ...arrStageOptions.map((stage) => ({ value: stage, label: stage })),
              ]}
              value={objFilters.stage}
              onChange={(val) => setObjFilters((prev) => ({ ...prev, stage: val }))}
              placeholder="All Stages"
              disabled={blnIsFilterOptionsLoading}
            />
          </div>

          <div className="col-12 col-md-2">
            <label className="form-label mb-1">Fiscal Year</label>
            <Dropdown
              options={[
                { value: '', label: 'All' },
                ...arrFiscalYearOptions.map((year) => ({ value: year, label: year })),
              ]}
              value={objFilters.fiscalYear}
              onChange={(val) => setObjFilters((prev) => ({ ...prev, fiscalYear: val }))}
              placeholder="All"
              disabled={blnIsFilterOptionsLoading}
            />
          </div>

          <div className="col-12 col-md-2">
            <label className="form-label mb-1">Status</label>
            <Dropdown
              options={[
                { value: '', label: 'Show All' },
                ...arrStatusOptions.map((status) => ({ value: status, label: status })),
              ]}
              value={objFilters.status}
              onChange={(val) => setObjFilters((prev) => ({ ...prev, status: val }))}
              placeholder="Show All"
              disabled={blnIsFilterOptionsLoading}
            />
          </div>

          <div className="col-12 col-md-3 d-flex gap-2 flex-wrap justify-content-md-end">
            <Button size="sm" onClick={handleSearch}>Search</Button>
            <Button variant="outline" size="sm" onClick={handleClear}>Clear</Button>
          </div>
        </div>
      </div>

      {/* ── Section 4: Unified Budget Table ── */}
      <div className="card border rounded-3 p-0 overflow-hidden">
        <Table
          columns={columns}
          data={arrBudgets}
          loading={blnIsLoading}
          emptyState="No unified budgets found. Adjust your filters and try again."
          sortKey={strSortKey}
          sortDir={strSortDir}
          onSort={handleSort}
        />
      </div>

      {/* ── Pagination ── */}
      <Pagination
        total={intTotalBudgets}
        page={intCurrentPage}
        pageSize={objMeta.per_page || PAGE_SIZE}
        onChange={setIntCurrentPage}
      />

      {/* ── Modal: Consolidate Budget ── */}
      <Modal
        open={blnShowConsolidateModal}
        onClose={handleBackToList}
        // title="Consolidate Budget"
        size="lg"
        showCloseButton={false}
      >
        <div className="bg-white border rounded-3 p-3">
          <p
            className="text-uppercase text-muted fw-semibold mb-2 modal-eyebrow"
          >
            Reviewed Requests Ready for Consolidation
          </p>

          {strModalError && (
            <div className="alert alert-danger py-2 px-3 mb-3" role="alert">
              {strModalError}
            </div>
          )}

          <div className="review-list-scroll">
            {blnModalLoading ? (
              <div className="d-flex align-items-center gap-2 text-muted">
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                <span>Loading reviewed requests...</span>
              </div>
            ) : arrReviewedRequests.length === 0 ? (
              <p className="text-muted mb-0">No reviewed requests available.</p>
            ) : (
              <ul className="mb-0 ps-3">
                {arrReviewedRequests.map((request) => (
                  <li key={String(request.id ?? request.br_id)} className="mb-1">
                    {request.title || request.br_title}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="d-grid gap-2 mt-3">
            <Button fullWidth onClick={handleCreateConsolidation} disabled={isCreating || blnModalLoading}>
              {isCreating ? 'Creating...' : '✦ Create New Consolidation'}
            </Button>
            <Button
              fullWidth
              variant="secondary"
              onClick={handleBackToList}
              disabled={isCreating}
            >
              Back to List
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
