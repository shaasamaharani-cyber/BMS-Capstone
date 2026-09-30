/**
 * System Name: Budget Management System
 * Module Name: Components Module
 *
 * Purpose of this file:
 * Version history tab for unified budgets — expandable cards showing PDF snapshot, totals, and attached files per version.
 *
 * Author(s): QUT Group 27
 *
 * Copyright (C) 2026
 * by the Department of Science and Technology - Central Office
 * Developed by Team 27, Queensland University of Technology
 * All rights reserved.
 */

import { useState } from 'react';
import { formatTimestamp, formatCurrency } from '../../utils/formatters';
import { formatAttachmentFileSize, getGeneratedFileUrl } from '../../utils/attachments';

const STATUS_BADGE = {
  pending: { bg: 'bg-warning text-dark', label: 'Pending' },
  approved: { bg: 'bg-success', label: 'Approved' },
  rejected: { bg: 'bg-danger', label: 'Rejected' },
  draft: { bg: 'bg-secondary', label: 'Draft' },
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
  const snap = version.snapshot ?? {};
  const totals = snap.totals ?? {};
  const attachedFiles = Array.isArray(version.attachedFiles)
    ? version.attachedFiles
    : (Array.isArray(snap.attachedFiles) ? snap.attachedFiles : []);
  const hasPdfSnapshot = Boolean(version.pdfUrl);
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
            v{version.version}
          </span>
          <StatusBadge status={version.status} />
          {hasPdfSnapshot ? (
            <span className="badge rounded-pill text-bg-light border">PDF Snapshot</span>
          ) : null}
          <span className="badge rounded-pill text-bg-light border">
            {attachedFiles.length} file{attachedFiles.length !== 1 ? 's' : ''}
          </span>
          {version.stage && (
            <span className="text-muted small">
              Stage: <strong>{version.stage}</strong>
            </span>
          )}
        </div>
        <div className="d-flex align-items-center gap-3 flex-shrink-0">
          {totals.grandTotal != null && (
            <span className="fw-semibold text-end small">
              {formatCurrency(Number(totals.grandTotal))}
            </span>
          )}
          {hasPdfSnapshot ? (
            <a
              href={getGeneratedFileUrl(version.pdfUrl)}
              target="_blank"
              rel="noreferrer"
              className="btn btn-sm btn-outline-primary"
              onClick={(event) => event.stopPropagation()}
            >
              PDF
            </a>
          ) : null}
          <span className="text-muted small text-end" style={{ minWidth: '12rem' }}>
            {formatTimestamp(version.startedAt)}
          </span>
          {hasDetail && (
            <span className="text-muted" style={{ fontSize: '0.7rem' }}>
              {expanded ? '▲' : '▼'}
            </span>
          )}
        </div>
      </div>

      {expanded && hasDetail && (
        <div className="card-footer bg-white border-top px-3 py-2">
          <SnapshotSectionTitle>PDF Snapshot</SnapshotSectionTitle>
          {hasPdfSnapshot ? (
            <div className="border rounded-2 px-3 py-2 mb-3 d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-2">
              <div>
                <div className="fw-semibold small">Unified Budget Overview v{version.version}</div>
                <div className="text-muted small">
                  Captured {formatTimestamp(version.pdfGeneratedAt || version.startedAt)}
                </div>
              </div>
              <a
                href={getGeneratedFileUrl(version.pdfUrl)}
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

          <SnapshotSectionTitle>Overview Snapshot</SnapshotSectionTitle>
          {snap.title && (
            <p className="small mb-1">
              <span className="text-muted">Title:</span> <strong>{snap.title}</strong>
            </p>
          )}
          {snap.fiscalYear && (
            <p className="small mb-1">
              <span className="text-muted">Fiscal Year:</span> {snap.fiscalYear}
            </p>
          )}
          {totals.grandTotal != null && (
            <table className="table table-sm table-borderless mb-0 mt-2">
              <thead className="table-light">
                <tr>
                  <th className="small">PS</th>
                  <th className="small">MOOE</th>
                  <th className="small">CO</th>
                  <th className="small">TAG</th>
                  <th className="small text-end">Grand Total</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="small">{formatCurrency(Number(totals.psTotal ?? 0))}</td>
                  <td className="small">{formatCurrency(Number(totals.mooeTotal ?? 0))}</td>
                  <td className="small">{formatCurrency(Number(totals.coTotal ?? 0))}</td>
                  <td className="small">{formatCurrency(Number(totals.tagTotal ?? 0))}</td>
                  <td className="small text-end fw-semibold">{formatCurrency(Number(totals.grandTotal ?? 0))}</td>
                </tr>
              </tbody>
            </table>
          )}
          {snap.sectionCount != null && (
            <p className="small text-muted mb-0 mt-1">
              {snap.sectionCount} budget request{snap.sectionCount !== 1 ? 's' : ''} · {snap.itemCount ?? 0} line item{(snap.itemCount ?? 0) !== 1 ? 's' : ''}
            </p>
          )}

          <div className="mt-3">
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
                      <a className="btn btn-sm btn-outline-secondary" href={getGeneratedFileUrl(file.url)} target="_blank" rel="noreferrer">
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
      )}
    </div>
  );
}

export default function UnifiedBudgetVersionsTab({ versions = [], isLoading = false }) {
  if (isLoading) {
    return <div className="p-4 text-muted small">Loading versions...</div>;
  }

  if (!versions.length) {
    return (
      <div className="p-4 text-center text-muted">
        <p className="mb-0">No versions recorded yet. Versions are created when consolidation is submitted.</p>
      </div>
    );
  }

  const sorted = [...versions].sort((a, b) => Number(b.version) - Number(a.version));

  return (
    <div className="p-4">
      <p className="text-muted small mb-3">
        {sorted.length} version{sorted.length !== 1 ? 's' : ''} · Click a version to expand PDF snapshot and attached forms
      </p>
      {sorted.map((v, idx) => (
        <VersionCard key={v.version ?? idx} version={v} />
      ))}
    </div>
  );
}
