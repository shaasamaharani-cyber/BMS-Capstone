/**
 * System Name: Budget Management System
 * Module Name: Core Module
 *
 * Purpose of this file:
 * Budget requests list page with server-side filtering, sorting, and pagination scoped to the user's requesting unit.
 *
 * Author(s): QUT Group 27
 *
 * Copyright (C) 2026
 * by the Department of Science and Technology - Central Office
 * Developed by Team 27, Queensland University of Technology
 * All rights reserved.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getBudgetRequests, getFiscalYears, getRequestingUnits } from '../../api';
import { useAuth } from '../../context/auth_context';
import { formatTimestamp, toTitleCase } from '../../utils/formatters';
import {
  getScopedRequestingUnitId,
  getScopedRequestingUnitLabel,
  mergeBudgetRequestListParams,
} from '../../utils/requesting_unit_scope';
import PageHeader from '../../components/layout/page_header';
import { getFiscalYear } from '../../utils/helpers';
import { getBudgetRequestEditPath } from '../../utils/budget_request_utils';
import { Button, Input, Dropdown, Table, Badge, Pagination } from '../../components/ui';

const PAGE_SIZE = 10;

const normalizeStatus = (status) => {
  const s = String(status || '').toLowerCase();
  if (s === 'draft') return 'Draft';
  if (s === 'submitted' || s === 'pending') return 'Pending';
  if (s === 'approved') return 'Reviewed';
  if (s === 'rejected') return 'Rejected';
  return toTitleCase(s);
};

const normalizeRow = (row) => ({
  id: row?.br_id,
  title: row?.br_title || '',
  code: row?.br_reference_no || String(row?.br_id || ''),
  unit: row?.requesting_unit?.ru_name || '',
  requestingUnitId: String(row?.br_requesting_unit_id || ''),
  fiscalYear: String(row?.fiscal_year?.fy_year || ''),
  fiscalYearId: String(row?.br_fiscal_year_id || ''),
  status: normalizeStatus(row?.br_status),
  lastUpdated: row?.br_updated_at || row?.br_created_at || null,
  createdAt: row?.br_created_at || null,
  totalAmount: row?.br_total_amount || '0.00',
  unified: Boolean(row?.br_unified_request),
});

export default function BudgetRequestsPage() {
  const navigate = useNavigate();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [strFilterTitle, setStrFilterTitle] = useState('');
  const [strFilterUnit, setStrFilterUnit] = useState('');
  const [strFilterFiscalYear, setStrFilterFiscalYear] = useState('');
  const [strFilterStatus, setStrFilterStatus] = useState('');
  const [arrBudgetRequests, setArrBudgetRequests] = useState([]);
  const [strSortKey, setStrSortKey] = useState('lastUpdated');
  const [strSortDir, setStrSortDir] = useState('desc');
  const [intCurrentPage, setIntCurrentPage] = useState(1);
  const [blnIsLoading, setBlnIsLoading] = useState(false);
  const [arrRequestingUnits, setArrRequestingUnits] = useState([]);
  const [arrFiscalYears, setArrFiscalYears] = useState([]);
  const [objMeta, setObjMeta] = useState({ current_page: 1, last_page: 1, total: 0, per_page: PAGE_SIZE });

  const tableRows = arrBudgetRequests;

  const intScopedUnitId = useMemo(() => getScopedRequestingUnitId(user), [user]);
  const blnUnitScoped = intScopedUnitId != null;
  const strScopedUnitLabel = useMemo(
    () => getScopedRequestingUnitLabel(user, arrRequestingUnits),
    [user, arrRequestingUnits]
  );

  const buildListParams = useCallback((params = {}) => mergeBudgetRequestListParams(params, user), [user]);

  useEffect(() => {
    if (blnUnitScoped) {
      setStrFilterUnit(String(intScopedUnitId));
    }
  }, [blnUnitScoped, intScopedUnitId]);

  useEffect(() => {
    if (isAuthLoading) {
      return undefined;
    }

    let isMounted = true;

    const loadBudgetRequests = async () => {
      setBlnIsLoading(true);
      try {
        const res = await getBudgetRequests(buildListParams({
          page: 1,
          per_page: PAGE_SIZE,
          sort_by: 'lastUpdated',
          sort_dir: 'desc',
        }));
        if (!isMounted) return;

        const apiData = res?.data || [];
        const apiMeta = res?.meta || {};

        const normalized = apiData.map(normalizeRow);
        setArrBudgetRequests(normalized);
        setObjMeta({
          current_page: apiMeta.current_page || 1,
          per_page: apiMeta.per_page || PAGE_SIZE,
          total: apiMeta.total || normalized.length,
          last_page: apiMeta.last_page || 1,
        });
        setIntCurrentPage(apiMeta.current_page || 1);
      } catch (err) {
        const status = err?.response?.status;
        if (status === 401) {
          navigate('/login', { replace: true });
        } else {
          window.alert('Cannot perform transaction. Error encountered.');
        }
      } finally {
        if (isMounted) setBlnIsLoading(false);
      }
    };

    const loadRequestingUnits = async () => {
      try {
        const res = await getRequestingUnits({ ru_is_active: 1 });
        if (!isMounted) return;
        const arrData = res?.data || [];
        setArrRequestingUnits(Array.isArray(arrData) ? arrData : []);
      } catch (err) {
        if (!isMounted) return;
        const status = err?.response?.status;
        if (status === 401) {
          navigate('/login', { replace: true });
          return;
        }
        setArrRequestingUnits([]);
      }
    };

    const loadFiscalYears = async () => {
      try {
        const resActive = await getFiscalYears();
        const arrData = Array.isArray(resActive?.data) ? resActive.data : [];
        if (!isMounted) return;
        setArrFiscalYears(Array.isArray(arrData) ? arrData : []);
      } catch {
        if (!isMounted) return;
        setArrFiscalYears([]);
      }
    };

    loadRequestingUnits();
    loadFiscalYears();
    loadBudgetRequests();
    return () => {
      isMounted = false;
    };
  }, [isAuthLoading, buildListParams, navigate]);

  const fetchWithParams = async (params) => {
    setBlnIsLoading(true);
    try {
      const res = await getBudgetRequests(buildListParams(params));
      const apiData = res?.data || [];
      const apiMeta = res?.meta || {};
      const normalized = apiData.map(normalizeRow);

      setArrBudgetRequests(normalized);
      setObjMeta({
        current_page: apiMeta.current_page || 1,
        per_page: apiMeta.per_page || PAGE_SIZE,
        total: apiMeta.total || normalized.length,
        last_page: apiMeta.last_page || 1,
      });
      setIntCurrentPage(apiMeta.current_page || 1);
    } catch (err) {
      const status = err?.response?.status;
      if (status === 401) {
        navigate('/login', { replace: true });
        return;
      }
      window.alert('Cannot perform transaction. Error encountered.');
    } finally {
      setBlnIsLoading(false);
    }
  };

  const mapStatusFilterToApiValue = (strStatusLabel) => {
    if (!strStatusLabel) return undefined;
    return strStatusLabel;
  };

  const handleSearch = () => {
    fetchWithParams({
      page: 1,
      per_page: PAGE_SIZE,
      sort_by: strSortKey,
      sort_dir: strSortDir,
      fiscal_year_id: strFilterFiscalYear || undefined,
      status: mapStatusFilterToApiValue(strFilterStatus),
      requesting_unit_id: strFilterUnit || undefined,
      title: strFilterTitle || undefined,
    });
  };

  const handleSearchKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleSearch();
    }
  };

  const handleClear = () => {
    setStrFilterTitle('');
    setStrFilterUnit(blnUnitScoped ? String(intScopedUnitId) : '');
    setStrFilterFiscalYear('');
    setStrFilterStatus('');
    fetchWithParams({ page: 1, per_page: PAGE_SIZE, sort_by: strSortKey, sort_dir: strSortDir });
  };

  const handleSort = (key) => {
    const nextDir = strSortKey === key && strSortDir === 'asc' ? 'desc' : 'asc';
    setStrSortKey(key);
    setStrSortDir(nextDir);
    fetchWithParams({
      page: 1,
      per_page: objMeta.per_page || PAGE_SIZE,
      sort_by: key,
      sort_dir: nextDir,
      fiscal_year_id: strFilterFiscalYear || undefined,
      status: mapStatusFilterToApiValue(strFilterStatus),
      requesting_unit_id: strFilterUnit || undefined,
      title: strFilterTitle || undefined,
    });
  };

  const unitOptions = useMemo(() => {
    if (blnUnitScoped) {
      return [{ value: String(intScopedUnitId), label: strScopedUnitLabel }];
    }

    return [
      { value: '', label: 'All' },
      ...arrRequestingUnits.map((ru) => ({ value: String(ru.ru_id), label: String(ru.ru_name) })),
    ];
  }, [blnUnitScoped, intScopedUnitId, arrRequestingUnits, strScopedUnitLabel]);

  const fiscalYearOptions = useMemo(
    () => [
      { value: '', label: 'All' },
      ...arrFiscalYears.map((fy) => ({
        value: String(fy.fy_id),
        label: String(fy.fy_year),
      })),
    ],
    [arrFiscalYears]
  );

  const statusOptions = [
    { value: '', label: 'All' },
    { value: 'draft', label: 'Draft' },
    { value: 'submitted', label: 'Pending' },
    { value: 'reviewed', label: 'Reviewed' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'consolidated', label: 'Consolidated' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  const columns = [
    {
      key: 'title',
      label: 'Title',
      sortable: true,
      render: (_, row) => (
        <div>
          <div className="fw-bold text-brand">{row.title}</div>
          <small className="text-muted">{row.code}</small>
        </div>
      ),
    },
    {
      key: 'unit',
      label: 'Requesting Unit',
      sortable: true,
    },
    {
      key: 'fiscalYear',
      label: 'Fiscal Year',
      sortable: true,
      render: (_, row) => row.fiscalYear || getFiscalYear(row.fiscalYearId),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (_, row) => <Badge status={row.status} />,
    },
    {
      key: 'lastUpdated',
      label: 'Last Updated',
      sortable: true,
      render: (_, row) => formatTimestamp(row.lastUpdated),
    },
    {
      key: 'actions',
      label: 'Actions',
      width: '120px',
      render: (_, row) => (
        <div className="dropdown">
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary dropdown-toggle"
            data-bs-toggle="dropdown"
            data-bs-strategy="fixed"
            aria-expanded="false"
          >
            Actions
          </button>
          <ul className="dropdown-menu">
            <li><button type="button" className="dropdown-item" onClick={() => navigate(`/budget-requests/${row.id}`)}>View</button></li>
            {['Draft', 'Rejected'].includes(String(row.status || '')) ? (
              <li><button type="button" className="dropdown-item" onClick={() => navigate(getBudgetRequestEditPath(row.id, row.unified))}>Edit</button></li>
            ) : null}
          </ul>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="page-sticky-header-shell">
        <PageHeader title="Budget Requests">
          <Button onClick={() => navigate('/budget-requests/unified/new')}>
            + New Request
          </Button>
        </PageHeader>

        <div className="w-100">
          <div className="row g-2 align-items-end">
            <div className="col-12 col-md-3">
              <label className="form-label mb-1">Title</label>
              <Input
                placeholder="Search by title"
                value={strFilterTitle}
                onChange={(e) => setStrFilterTitle(e.target.value)}
                onKeyDown={handleSearchKeyDown}
              />
            </div>

            <div className="col-12 col-md-2">
              <label className="form-label mb-1">Requesting Unit</label>
              {blnUnitScoped ? (
                <Input value={strScopedUnitLabel} readOnly disabled />
              ) : (
                <Dropdown
                  options={unitOptions}
                  value={strFilterUnit}
                  onChange={setStrFilterUnit}
                  placeholder="All"
                />
              )}
            </div>

            <div className="col-12 col-md-2">
              <label className="form-label mb-1">Fiscal Year</label>
              <Dropdown
                options={fiscalYearOptions}
                value={strFilterFiscalYear}
                onChange={setStrFilterFiscalYear}
                placeholder="All"
              />
            </div>

            <div className="col-12 col-md-2">
              <label className="form-label mb-1">Status</label>
              <Dropdown
                options={statusOptions}
                value={strFilterStatus}
                onChange={setStrFilterStatus}
                placeholder="All"
              />
            </div>

            <div className="col-12 col-md-3 d-flex gap-2 flex-wrap justify-content-md-end">
              <Button size="sm" onClick={handleSearch}>Search</Button>
              <Button variant="outline" size="sm" onClick={handleClear}>Clear</Button>
            </div>
          </div>
        </div>
      </div>

      <Table
        columns={columns}
        data={tableRows}
        emptyState="No budget requests found."
        loading={blnIsLoading}
        sortKey={strSortKey}
        sortDir={strSortDir}
        onSort={handleSort}
      />

      <Pagination
        total={objMeta.total}
        page={intCurrentPage}
        pageSize={objMeta.per_page || PAGE_SIZE}
        onChange={(p) => fetchWithParams({
          page: p,
          per_page: objMeta.per_page || PAGE_SIZE,
          sort_by: strSortKey,
          sort_dir: strSortDir,
          fiscal_year_id: strFilterFiscalYear || undefined,
          status: mapStatusFilterToApiValue(strFilterStatus),
          requesting_unit_id: strFilterUnit || undefined,
          title: strFilterTitle || undefined,
        })}
      />
    </div>
  );
}
