/**
 * System Name: Budget Management System
 * Module Name: Budget Review
 *
 * Purpose of this file:
 * Review workspace list page — shows pending and reviewed budget requests.
 *
 * Author(s): QUT Group 27
 *
 * Copyright (C) 2026
 * by the Department of Science and Technology - Central Office
 * Developed by Team 27, Queensland University of Technology
 * All rights reserved.
 */

import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getBudgetReviewList, getFiscalYears, getRequestingUnits } from '../../api';
import { formatTimestamp } from '../../utils/formatters';
import PageHeader from '../../components/layout/page_header';
import { Badge, Button, Dropdown, Input, Pagination, Table } from '../../components/ui';

const PENDING_STATUSES = ['pending', 'submitted'];
const PAGE_SIZE = 10;

const getBadgeStatus = (status) => {
  if (status === 'submitted') return 'pending';
  if (status === 'approved') return 'reviewed';
  return status;
};

const normalizeRow = (row) => ({
  id: row?.br_id,
  title: row?.br_title || '',
  code: row?.br_reference_no || String(row?.br_id || ''),
  unit: row?.requesting_unit?.ru_name || '',
  requestingUnitId: String(row?.br_requesting_unit_id || ''),
  fiscalYear: String(row?.fiscal_year?.fy_year || ''),
  fiscalYearId: String(row?.br_fiscal_year_id || ''),
  status: String(row?.br_status || 'draft').toLowerCase(),
  lastUpdated: row?.br_updated_at || row?.br_created_at || null,
});

export default function BudgetReviewPage() {
  const navigate = useNavigate();

  const [arrAllRequests, setArrAllRequests] = useState([]);
  const [blnIsLoading, setBlnIsLoading] = useState(false);
  const [strSortKey, setStrSortKey] = useState('lastUpdated');
  const [strSortDir, setStrSortDir] = useState('desc');
  const [intCurrentPage, setIntCurrentPage] = useState(1);
  const [objMeta, setObjMeta] = useState({ current_page: 1, last_page: 1, total: 0, per_page: PAGE_SIZE });

  const [strFilterTitle, setStrFilterTitle] = useState('');
  const [strFilterUnit, setStrFilterUnit] = useState('');
  const [strFilterFiscalYear, setStrFilterFiscalYear] = useState('');

  const [arrRequestingUnits, setArrRequestingUnits] = useState([]);
  const [arrFiscalYears, setArrFiscalYears] = useState([]);



  useEffect(() => {
    let blnIsMounted = true;

    const loadRequests = async () => {
      setBlnIsLoading(true);
      try {
        const res = await getBudgetReviewList({ page: 1, per_page: PAGE_SIZE, sort_by: 'lastUpdated', sort_dir: 'desc' });
        if (!blnIsMounted) return;
        setArrAllRequests((res?.data || []).map(normalizeRow));
        setObjMeta(res?.objMeta || { current_page: 1, last_page: 1, total: 0, per_page: PAGE_SIZE });
        setIntCurrentPage(res?.objMeta?.current_page || 1);
      } catch (err) {
        if (!blnIsMounted) return;
        if (err?.response?.status === 401) navigate('/login', { replace: true });
      } finally {
        if (blnIsMounted) setBlnIsLoading(false);
      }
    };

    const loadRequestingUnits = async () => {
      try {
        const res = await getRequestingUnits({ ru_is_active: 1 });
        if (!blnIsMounted) return;
        setArrRequestingUnits(res?.data || []);
      } catch {
        if (!blnIsMounted) return;
        setArrRequestingUnits([]);
      }
    };

    const loadFiscalYears = async () => {
      try {
        const res = await getFiscalYears({ fy_is_active: 1 });
        if (!blnIsMounted) return;
        setArrFiscalYears(res?.data || []);
      } catch {
        if (!blnIsMounted) return;
        setArrFiscalYears([]);
      }
    };

    loadRequestingUnits();
    loadFiscalYears();
    loadRequests();

    return () => { blnIsMounted = false; };
  }, [navigate]);

  const unitOptions = useMemo(() => [
    { value: '', label: 'All' },
    ...arrRequestingUnits.map((ru) => ({ value: String(ru.ru_id), label: String(ru.ru_name) })),
  ], [arrRequestingUnits]);

  const fiscalYearOptions = useMemo(() => [
    { value: '', label: 'All' },
    ...arrFiscalYears.map((fy) => ({ value: String(fy.fy_id), label: String(fy.fy_year) })),
  ], [arrFiscalYears]);

  const fetchWithParams = async (params) => {
    setBlnIsLoading(true);
    try {
      const res = await getBudgetReviewList(params);
      setArrAllRequests((res?.data || []).map(normalizeRow));
      setObjMeta(res?.objMeta || { current_page: 1, last_page: 1, total: 0, per_page: PAGE_SIZE });
      setIntCurrentPage(res?.objMeta?.current_page || 1);
    } catch (err) {
      if (err?.response?.status === 401) navigate('/login', { replace: true });
    } finally {
      setBlnIsLoading(false);
    }
  };

  const buildQuery = (page = 1, nextSortKey = strSortKey, nextSortDir = strSortDir) => ({
    page,
    per_page: objMeta.per_page || PAGE_SIZE,
    sort_by: nextSortKey,
    sort_dir: nextSortDir,
    title: strFilterTitle || undefined,
    requesting_unit_id: strFilterUnit || undefined,
    fiscal_year_id: strFilterFiscalYear || undefined,
  });

  const handleSearch = () => fetchWithParams(buildQuery(1));

  const handleClear = () => {
    setStrFilterTitle('');
    setStrFilterUnit('');
    setStrFilterFiscalYear('');
    fetchWithParams({
      page: 1,
      per_page: objMeta.per_page || PAGE_SIZE,
      sort_by: strSortKey,
      sort_dir: strSortDir,
    });
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  const handleSort = (key) => {
    const nextDir = strSortKey === key && strSortDir === 'asc' ? 'desc' : 'asc';
    setStrSortKey(key);
    setStrSortDir(nextDir);
    fetchWithParams(buildQuery(1, key, nextDir));
  };

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
    { key: 'unit', label: 'Requesting Unit', sortable: true },
    { key: 'fiscalYear', label: 'Fiscal Year', sortable: true },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (_, row) => <Badge status={getBadgeStatus(row.status)} />,
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
            <li>
              <button
                type="button"
                className="dropdown-item"
                onClick={() => navigate(`/budget-review/${row.id}`)}
              >
                {PENDING_STATUSES.includes(row.status) ? 'Review' : 'View'}
              </button>
            </li>
          </ul>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="page-sticky-header-shell">
        <PageHeader title="Budget Review" />

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
              <Dropdown
                options={unitOptions}
                value={strFilterUnit}
                onChange={setStrFilterUnit}
                placeholder="All"
              />
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

            <div className="col-12 col-md-5 d-flex gap-2 flex-wrap justify-content-md-end">
              <Button size="sm" onClick={handleSearch}>Search</Button>
              <Button variant="outline" size="sm" onClick={handleClear}>Clear</Button>
            </div>
          </div>
        </div>
      </div>

      <Table
        columns={columns}
        data={arrAllRequests}
        loading={blnIsLoading}
        emptyState="No budget requests found."
        sortKey={strSortKey}
        sortDir={strSortDir}
        onSort={handleSort}
      />

      <Pagination
        total={objMeta.total}
        page={intCurrentPage}
        pageSize={objMeta.per_page || PAGE_SIZE}
        onChange={(page) => fetchWithParams(buildQuery(page))}
      />
    </div>
  );
}
