/**
 * System Name: Budget Management System
 * Module Name: Forms Module
 *
 * Purpose of this file:
 * Form entries listing page that shows all saved entries per schema with view, PDF download, and delete actions.
 *
 * Author(s): QUT Group 27
 *
 * Copyright (C) 2026
 * by the Department of Science and Technology - Central Office
 * Developed by Team 27, Queensland University of Technology
 * All rights reserved.
 */

import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageHeader from '../../components/layout/page_header';
import { Button, Pagination, Table } from '../../components/ui';
import { deleteEntry, fetchAllSchemas, fetchEntriesBySchema } from '../../api/forms_api';
import { formatTimestamp } from '../../utils/formatters';
import { getEntryDisplayName, normalizeSchemaRecord } from '../../forms/utils/form_object';
import { seedDefaultSchemas } from '../../forms/utils/seed_default_schemas';
import { getGeneratedFileUrl } from '../../utils/attachments';

const PAGE_SIZE = 10;

export default function FormsDataPage() {
  const navigate = useNavigate();
  const [arrSchemas, setArrSchemas] = useState([]);
  const [strSelectedSchemaId, setStrSelectedSchemaId] = useState('');
  const [arrEntries, setArrEntries] = useState([]);
  const [blnLoading, setBlnLoading] = useState(true);
  const [strSortKey, setStrSortKey] = useState('updatedAt');
  const [strSortDir, setStrSortDir] = useState('desc');
  const [intCurrentPage, setIntCurrentPage] = useState(1);
  const [objMeta, setObjMeta] = useState({ current_page: 1, last_page: 1, total: 0, per_page: PAGE_SIZE });

  useEffect(() => {
    let mounted = true;

    seedDefaultSchemas()
      .catch(() => { })
      .then(() => fetchAllSchemas())
      .then((rows) => {
        if (!mounted) return;
        const normalized = rows.map(normalizeSchemaRecord);
        setArrSchemas(normalized);
        setStrSelectedSchemaId((prev) => prev || normalized[0]?.id || '');
      })
      .finally(() => mounted && setBlnLoading(false));
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!strSelectedSchemaId) {
      setArrEntries([]);
      return;
    }

    let mounted = true;
    setBlnLoading(true);
    fetchEntriesBySchema(strSelectedSchemaId, {
      page: intCurrentPage,
      per_page: PAGE_SIZE,
      sort_by: strSortKey,
      sort_dir: strSortDir,
    }).then((payload) => {
      if (!mounted) return;
      setArrEntries(payload?.data || []);
      setObjMeta(payload?.objMeta || { current_page: 1, last_page: 1, total: 0, per_page: PAGE_SIZE });
    }).finally(() => {
      if (mounted) setBlnLoading(false);
    });
    return () => { mounted = false; };
  }, [strSelectedSchemaId, intCurrentPage, strSortKey, strSortDir]);

  async function handleDelete(id) {
    await deleteEntry(id);
    setArrEntries((prev) => prev.filter((entry) => entry.id !== id));
    setObjMeta((prev) => ({ ...prev, total: Math.max(0, prev.total - 1) }));
  }

  const columns = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (_, row) => getEntryDisplayName(row),
    },
    { key: 'updatedAt', label: 'Last Updated', sortable: true, render: (value) => formatTimestamp(value) },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="d-flex gap-2">
          <Button size="sm" variant="outline" onClick={() => navigate(`/forms/${row.schemaId}/entries/${row.id}`)}>
            Open
          </Button>
          {row.pdfUrl ? (
            <a className="btn btn-sm btn-outline-primary" href={getGeneratedFileUrl(row.pdfUrl)} target="_blank" rel="noreferrer">
              PDF
            </a>
          ) : null}
          <Button size="sm" variant="danger" onClick={() => handleDelete(row.id)}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  const handleSort = (key) => {
    const nextDir = strSortKey === key && strSortDir === 'asc' ? 'desc' : 'asc';
    setStrSortKey(key);
    setStrSortDir(nextDir);
    setIntCurrentPage(1);
  };

  return (
    <div>
      <PageHeader title="Flexible Forms" subtitle="Schema-driven forms and entries." />

      <div className="d-flex flex-wrap gap-2 justify-content-between align-items-end mb-3 no-print">
        <div style={{ minWidth: 280 }}>
          <label className="form-label fw-semibold">Schema</label>
          <select
            className="form-select"
            value={strSelectedSchemaId}
            onChange={(event) => { setStrSelectedSchemaId(event.target.value); setIntCurrentPage(1); }}
          >
            {arrSchemas.map((schema) => (
              <option key={schema.id} value={schema.id}>{schema.name}</option>
            ))}
          </select>
        </div>
        <div className="d-flex gap-2">
          <Link className="btn btn-primary" to={`/forms/${strSelectedSchemaId}/new`}>Create and Open</Link>
        </div>
      </div>

      <Table
        columns={columns}
        data={arrEntries}
        loading={blnLoading}
        emptyState={strSelectedSchemaId ? 'No entries for this schema yet.' : 'No schemas available.'}
        sortKey={strSortKey}
        sortDir={strSortDir}
        onSort={handleSort}
      />

      <Pagination
        total={objMeta.total}
        page={intCurrentPage}
        pageSize={objMeta.per_page || PAGE_SIZE}
        onChange={setIntCurrentPage}
      />
    </div>
  );
}
