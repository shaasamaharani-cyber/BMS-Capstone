/**
 * System Name: Budget Management System
 * Module Name: Components Module
 *
 * Purpose of this file:
 * Version history tab listing budget request submission snapshots with reviewer comments and PDF links.
 *
 * Author(s): QUT Group 27
 *
 * Copyright (C) 2026
 * by the Department of Science and Technology - Central Office
 * Developed by Team 27, Queensland University of Technology
 * All rights reserved.
 */

import { useState } from 'react';
import { formatTimestamp } from '../../utils/formatters';
import { formatCurrency } from '../../utils/formatters';
import { formatAttachmentFileSize } from '../../utils/attachments';

const STATUS_BADGE = {
  submitted: { bg: 'bg-primary', label: 'Submitted' },
  reviewed: { bg: 'bg-success', label: 'Reviewed' },
  consolidated: { bg: 'bg-teal', label: 'Consolidated' },
  rejected: { bg: 'bg-danger', label: 'Rejected' },
};

function StatusBadge({ status = '' }) {
  const key = String(status).toLowerCase();
  const { bg = 'bg-secondary', label = status } = STATUS_BADGE[key] ?? {};
  return <span className={`badge ${bg} text-capitalize`}>{label}</span>;
}

function SnapshotSectionTitle({ children }) {
  return (
    <p className="fw-semibold small text-muted text-uppercase mb-2" style={{ fontSize: '0.7rem', letterSpacing: '0.05em' }}>
      {children}
    </p>
  );
}

function VersionCard({ version }) {
  const [expanded, setExpanded] = useState(false);
  const snap = version.brv_snapshot ?? {};
  const items = Array.isArray(snap.items) ? snap.items : [];
  const attachedFiles = Array.isArray(version.brv_attached_files)
    ? version.brv_attached_files
    : (Array.isArray(snap.attachedFiles) ? snap.attachedFiles : []);
  const hasPdfSnapshot = Boolean(version.brv_pdf_url);
  const hasDetail = true;

  return (
    <div className="card mb-2 border">
      <div
        className="card-body py-3 px-3 d-flex flex-column flex-sm-row align-items-sm-center gap-2"
        style={{ cursor: hasDetail ? 'pointer' : 'default' }}
        onClick={() => hasDetail && setExpanded((v) => !v)}
        role={hasDetail ? 'button' : undefined}
      >
        <div className="d-flex align-items-center gap-2 flex-grow-1 flex-wrap">
          <span className="badge bg-secondary-subtle text-secondary-emphasis fw-semibold" style={{ fontSize: '0.75rem' }}>
            v{version.brv_version_number}
          </span>
          <StatusBadge status={version.brv_status} />
          {hasPdfSnapshot ? (
            <span className="badge rounded-pill text-bg-light border">PDF Snapshot</span>
          ) : null}
          <span className="badge rounded-pill text-bg-light border">
            {attachedFiles.length} file{attachedFiles.length !== 1 ? 's' : ''}
          </span>
          <span className="text-muted small">
            {version.brv_submitted_by_name
              ? <><strong>{version.brv_submitted_by_name}</strong>{version.brv_submitted_by_role ? ` · ${version.brv_submitted_by_role}` : ''}</>
              : <em className="text-muted">Unknown</em>
            }
          </span>
        </div>
        <div className="d-flex align-items-center gap-3 flex-shrink-0">
          {(snap.totals?.grandTotal ?? snap.br_total_amount) != null && (
            <span className="fw-semibold text-end small">
              {formatCurrency(Number(snap.totals?.grandTotal ?? snap.br_total_amount))}
            </span>
          )}
          {version.brv_pdf_url ? (
            <a
              href={version.brv_pdf_url}
              target="_blank"
              rel="noreferrer"
              className="btn btn-sm btn-outline-primary"
              onClick={(event) => event.stopPropagation()}
            >
              PDF
            </a>
          ) : null}
          <span className="text-muted small text-end" style={{ minWidth: '12rem' }}>
            {formatTimestamp(version.brv_created_at)}
          </span>
          {hasDetail && (
            <span className="text-muted" style={{ fontSize: '0.7rem' }}>
              {expanded ? '▲' : '▼'}
            </span>
          )}
        </div>
      </div>

      {expanded && hasDetail && (
        <div className="card-footer bg-white border-top p-0">
          <div className="px-3 py-2">
            <SnapshotSectionTitle>PDF Snapshot</SnapshotSectionTitle>
            {hasPdfSnapshot ? (
              <div className="border rounded-2 px-3 py-2 mb-3 d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-2">
                <div>
                  <div className="fw-semibold small">Budget Request Overview v{version.brv_version_number}</div>
                  <div className="text-muted small">
                    Captured {formatTimestamp(version.brv_pdf_generated_at || version.brv_created_at)}
                  </div>
                </div>
                <a
                  href={version.brv_pdf_url}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-sm btn-outline-primary"
                >
                  Open PDF Snapshot
                </a>
              </div>
            ) : (
              <div className="border rounded-2 px-3 py-2 mb-3 text-muted small bg-light">
                No PDF snapshot was captured for this version.
              </div>
            )}

            {items.length > 0 ? (
              <>
                <SnapshotSectionTitle>Line Items Snapshot</SnapshotSectionTitle>
                <table className="table table-sm table-borderless mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="small">Description</th>
                      <th className="small">Category</th>
                      <th className="small text-end">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="small">{item.bri_description || '—'}</td>
                        <td className="small">{item.categoryCode || item.bri_cost_structure || '—'}</td>
                        <td className="small text-end">{formatCurrency(Number(item.bri_planned_amount ?? 0))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            ) : null}

            <div className={items.length > 0 ? 'mt-3' : ''}>
              <SnapshotSectionTitle>Attached Forms Captured</SnapshotSectionTitle>
              {attachedFiles.length > 0 ? (
                <div className="d-flex flex-column gap-1">
                  {attachedFiles.map((file, idx) => (
                    <div key={file.id || `${file.name}-${idx}`} className="border rounded-2 px-3 py-2 small d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-2">
                      <div className="min-w-0">
                        <div className="fw-semibold text-truncate">{file.name || 'File'}</div>
                        <div className="text-muted">
                          {formatAttachmentFileSize(file.size)}
                          {file.type ? <span className="ms-2">{file.type}</span> : null}
                        </div>
                      </div>
                      {file.url ? (
                        <a className="btn btn-sm btn-outline-secondary" href={file.url} target="_blank" rel="noreferrer">
                          Open Attached File
                        </a>
                      ) : (
                        <span className="text-muted">No file URL captured</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border rounded-2 px-3 py-2 text-muted small bg-light">
                  No attached forms were captured for this version.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BudgetRequestVersionsTab({ versions = [], isLoading = false }) {
  if (isLoading) {
    return <div className="p-4 text-muted small">Loading versions...</div>;
  }

  if (!versions.length) {
    return (
      <div className="p-4 text-center text-muted">
        <p className="mb-0">No versions recorded yet. Versions are created when a request is submitted.</p>
      </div>
    );
  }

  const sorted = [...versions].sort((a, b) => b.brv_version_number - a.brv_version_number);

  return (
    <div className="p-4">
      <p className="text-muted small mb-3">
        {sorted.length} version{sorted.length !== 1 ? 's' : ''} · Click a version to expand PDF snapshot and attached forms
      </p>
      {sorted.map((v) => (
        <VersionCard key={v.brv_id ?? v.id} version={v} />
      ))}
    </div>
  );
}
