/**
 * System Name: Budget Management System
 * Module Name: Core Module
 *
 * Purpose of this file:
 * Approval tracking page — lists all unified budgets in progress, and a detail view for recording external stage decisions.
 *
 * Author(s): QUT Group 27
 *
 * Copyright (C) 2026
 * by the Department of Science and Technology - Central Office
 * Developed by Team 27, Queensland University of Technology
 * All rights reserved.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BsArrowLeft, BsCloudUpload, BsDownload, BsFileEarmarkText, BsSliders } from 'react-icons/bs';
import { Badge, Button, Dropdown, Input, MetricCard, Pagination, Table, useToast } from '../../components/ui';
import PageHeader from '../../components/layout/page_header';
import ApprovalWorkflowTimeline from '../../components/shared/approval_workflow_timeline';
import { getUnifiedBudgetById, updateUnifiedBudget } from '../../api';
import { useAuth } from '../../context/auth_context';
import {
  getTrackingBudgets,
  getTrackingFiscalYearOptions,
  getTrackingStageOptions,
  getTrackingStatusOptions,
  getTrackingSummaryStats,
} from '../../api/budget_tracking_api';
import { getApprovalWorkflowStages } from '../../api/budget_consolidation_api';
import {
  isExternalStageUpdatePanelVisible,
  isUnifiedBudgetWorkflowFullyApproved,
  splitUnifiedWorkflowStepsByLane,
} from '../../utils/unified_budget_workflow_lanes';
import {
  applyUnifiedBudgetWorkflowAction,
  createApprovalVersionEntry,
  deriveUnifiedWorkflowStage,
  getActiveApprovalVersion,
  getUnifiedBudgetWorkflowActionForStep,
  getUnifiedBudgetWorkflowSteps,
  isUnifiedBudgetTerminalApprovalAction,
  getWorkflowActorNameFromUser,
  stripWorkflowStepsNotes,
} from '../../utils/workflow_utils';
import { getCurrentTimestamp, getFiscalYear, readFileAsDataUrl } from '../../utils/helpers';
import { formatTimestamp, getBadgeStatus } from '../../utils/formatters';



// ===========================================================================
// LIST VIEW
// ===========================================================================
const PAGE_SIZE = 5;

const METRIC_ACCENT = {
  inProgress: 'var(--color-text-muted)',
  completed:  'var(--color-success, #198754)',
  ps:         'var(--ps)',
  mooe:       'var(--mooe)',
};



function ActionMenu({ row, navigate }) {
  return (
    <div className="dropdown">
      <button
        type="button"
        className="btn btn-sm btn-outline-secondary dropdown-toggle"
        data-bs-toggle="dropdown"
        aria-expanded="false"
      >
        Actions
      </button>
      <ul className="dropdown-menu">
        <li>
          <button
            type="button"
            className="dropdown-item"
            onClick={() => navigate(`/budget-consolidation/${row.id}`)}
          >
            View Details
          </button>
        </li>
        <li>
          <button
            type="button"
            className="dropdown-item"
            onClick={() => navigate(`/budget-tracking/${row.id}`)}
          >
            Track Approval
          </button>
        </li>
      </ul>
    </div>
  );
}

const TABLE_COLUMNS = [
  {
    key: 'title',
    label: 'Title',
    render: (_, row) => (
      <div>
        <div className="fw-bold text-brand">{row.title}</div>
        <small className="text-muted">{row.code}</small>
      </div>
    ),
  },
  { key: 'requestingUnit', label: 'Requesting Unit' },
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
  { key: 'stage', label: 'Current Stage' },
  {
    key: 'lastUpdated',
    label: 'Last Updated',
    render: (_, row) => formatTimestamp(row.lastUpdated),
  },
  {
    key: 'actions',
    label: 'Actions',
    width: '120px',
    render: () => null,
  },
];

function BudgetTrackingListView() {
  const navigate = useNavigate();

  const [arrBudgets, setArrBudgets]           = useState([]);
  const [objSummaryStats, setObjSummaryStats] = useState(null);
  const [blnIsLoading, setBlnIsLoading]       = useState(true);

  const [arrStageOptions, setArrStageOptions]           = useState([]);
  const [arrStatusOptions, setArrStatusOptions]         = useState([]);
  const [arrFiscalYearOptions, setArrFiscalYearOptions] = useState([]);
  const [blnIsOptionsLoading, setBlnIsOptionsLoading]   = useState(true);

  const [objFilters, setObjFilters]               = useState({ title: '', stage: '', fiscalYear: '', status: '' });
  const [objAppliedFilters, setObjAppliedFilters] = useState({ title: '', stage: '', fiscalYear: '', status: '' });
  const [strSortOrder, setStrSortOrder]           = useState('desc');
  const [intCurrentPage, setIntCurrentPage]       = useState(1);

  useEffect(() => {
    let isMounted = true;
    getTrackingSummaryStats().then((stats) => {
      if (isMounted) setObjSummaryStats(stats);
    });
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    let isMounted = true;
    setBlnIsOptionsLoading(true);
    Promise.all([
      getTrackingStageOptions(),
      getTrackingStatusOptions(),
      getTrackingFiscalYearOptions(),
    ]).then(([stages, statuses, years]) => {
      if (!isMounted) return;
      setArrStageOptions(Array.isArray(stages) ? stages : []);
      setArrStatusOptions(Array.isArray(statuses) ? statuses : []);
      setArrFiscalYearOptions(Array.isArray(years) ? years : []);
    }).finally(() => {
      if (isMounted) setBlnIsOptionsLoading(false);
    });
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    let isMounted = true;
    setBlnIsLoading(true);
    getTrackingBudgets({
      stage:      objAppliedFilters.stage,
      status:     objAppliedFilters.status,
      fiscalYear: objAppliedFilters.fiscalYear,
    }).then(({ data }) => {
      if (isMounted) setArrBudgets(data);
    }).finally(() => {
      if (isMounted) setBlnIsLoading(false);
    });
    return () => { isMounted = false; };
  }, [objAppliedFilters]);

  const displayedBudgets = useMemo(() => {
    const titleFilter = objAppliedFilters.title.trim().toLowerCase();
    return [...arrBudgets]
      .filter((row) => !titleFilter || String(row.title || '').toLowerCase().includes(titleFilter))
      .sort((a, b) => {
        const dateA = new Date(a.lastUpdated);
        const dateB = new Date(b.lastUpdated);
        return strSortOrder === 'desc' ? dateB - dateA : dateA - dateB;
      });
  }, [arrBudgets, objAppliedFilters.title, strSortOrder]);

  const paginatedBudgets = useMemo(() => {
    const start = (intCurrentPage - 1) * PAGE_SIZE;
    return displayedBudgets.slice(start, start + PAGE_SIZE);
  }, [displayedBudgets, intCurrentPage]);

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

  const handleSort = () => setStrSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'));
  const handleSearchKeyDown = (e) => { if (e.key === 'Enter') handleSearch(); };

  const metricCards = objSummaryStats
    ? [
        {
          label: 'In Progress',
          value: objSummaryStats.inProgress,
          subtitle: 'Pending Approval',
          accentColor: METRIC_ACCENT.inProgress,
        },
        {
          label: 'Completed',
          value: objSummaryStats.completed,
          subtitle: 'Fully Approved',
          accentColor: METRIC_ACCENT.completed,
        },
        {
          label: 'Personnel Services (PS)',
          value: objSummaryStats.ps,
          accentColor: METRIC_ACCENT.ps,
        },
        {
          label: 'MOOE',
          value: objSummaryStats.mooe,
          accentColor: METRIC_ACCENT.mooe,
        },
      ]
    : [];

  const columns = useMemo(
    () =>
      TABLE_COLUMNS.map((col) =>
        col.key === 'actions'
          ? { ...col, render: (_, row) => <ActionMenu row={row} navigate={navigate} /> }
          : col
      ),
    [navigate]
  );

  return (
    <div>
      <PageHeader title="Budget Tracking" />

      <div className="row g-3 mb-4">
        {metricCards.map((card) => (
          <div key={card.label} className="col-12 col-sm-6 col-xl-3">
            <MetricCard
              label={card.label}
              value={card.value}
              subtitle={card.subtitle}
              accentColor={card.accentColor}
            />
          </div>
        ))}
      </div>

      <div className="w-100 mb-3">
        <div className="row g-2 align-items-end">
          <div className="col-12 col-md-3">
            <label className="form-label mb-1">Title</label>
            <Input
              placeholder="Search by title"
              value={objFilters.title}
              onChange={(e) => setObjFilters((prev) => ({ ...prev, title: e.target.value }))}
              onKeyDown={handleSearchKeyDown}
            />
          </div>

          <div className="col-12 col-md-2">
            <label className="form-label mb-1">Stage</label>
            <Dropdown
              options={[
                { value: '', label: 'All Stages' },
                ...arrStageOptions.map((s) => ({ value: s, label: s })),
              ]}
              value={objFilters.stage}
              onChange={(val) => setObjFilters((prev) => ({ ...prev, stage: val }))}
              placeholder="All Stages"
              disabled={blnIsOptionsLoading}
            />
          </div>

          <div className="col-12 col-md-2">
            <label className="form-label mb-1">Fiscal Year</label>
            <Dropdown
              options={[
                { value: '', label: 'All' },
                ...arrFiscalYearOptions.map((y) => ({ value: y, label: y })),
              ]}
              value={objFilters.fiscalYear}
              onChange={(val) => setObjFilters((prev) => ({ ...prev, fiscalYear: val }))}
              placeholder="All"
              disabled={blnIsOptionsLoading}
            />
          </div>

          <div className="col-12 col-md-2">
            <label className="form-label mb-1">Status</label>
            <Dropdown
              options={[
                { value: '', label: 'Show All' },
                ...arrStatusOptions.map((s) => ({ value: s, label: s })),
              ]}
              value={objFilters.status}
              onChange={(val) => setObjFilters((prev) => ({ ...prev, status: val }))}
              placeholder="Show All"
              disabled={blnIsOptionsLoading}
            />
          </div>

          <div className="col-12 col-md-3 d-flex gap-2 flex-wrap justify-content-md-end">
            <Button size="sm" onClick={handleSearch}>Search</Button>
            <Button variant="outline" size="sm" onClick={handleClear}>Clear</Button>
            <Button variant="outline" size="sm" onClick={handleSort}>
              {strSortOrder === 'desc' ? '↓' : '↑'} Sort by Date
            </Button>
          </div>
        </div>
      </div>

      <div className="card border rounded-3 p-0 overflow-hidden">
        <Table
          columns={columns}
          data={paginatedBudgets}
          loading={blnIsLoading}
          emptyState="No tracking records found. Adjust your filters and try again."
        />
      </div>

      <Pagination
        total={displayedBudgets.length}
        page={intCurrentPage}
        pageSize={PAGE_SIZE}
        onChange={setIntCurrentPage}
      />
    </div>
  );
}

// ===========================================================================
// DETAIL VIEW  (external decision recording)
// ===========================================================================


function BudgetTrackingDetailView() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user } = useAuth();
  const { id } = useParams();
  const [blnIsLoading, setBlnIsLoading] = useState(true);
  const [objRecord, setObjRecord] = useState(null);
  const [arrWorkflowStageDefinitions, setArrWorkflowStageDefinitions] = useState([]);

  const [strSelectedStageKey, setStrSelectedStageKey] = useState('');
  const [strStatusDecision, setStrStatusDecision] = useState('approved');
  const [strOfficialRemarks, setStrOfficialRemarks] = useState('');
  const [blnIsUploading, setBlnIsUploading] = useState(false);
  const [blnIsSubmitting, setBlnIsSubmitting] = useState(false);
  const [blnIsDragging, setBlnIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    let blnCancelled = false;
    getApprovalWorkflowStages()
      .then((arrStages) => {
        if (!blnCancelled) setArrWorkflowStageDefinitions(Array.isArray(arrStages) ? arrStages : []);
      })
      .catch(() => {
        if (!blnCancelled) setArrWorkflowStageDefinitions([]);
      });
    return () => {
      blnCancelled = true;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setBlnIsLoading(true);
      const response = await getUnifiedBudgetById(id);
      if (!mounted) return;
      setObjRecord(response?.data || null);
      setBlnIsLoading(false);
    };
    load();
    return () => { mounted = false; };
  }, [id]);

  const currentVersion  = Number(objRecord?.currentVersion) > 0 ? Number(objRecord.currentVersion) : 1;
  const approvalVersions = useMemo(
    () => Array.isArray(objRecord?.approvalVersions) ? objRecord.approvalVersions : [],
    [objRecord]
  );
  const activeVersion = useMemo(
    () => getActiveApprovalVersion(approvalVersions, currentVersion),
    [approvalVersions, currentVersion]
  );
  const activeWorkflow = useMemo(
    () => activeVersion?.workflow || objRecord?.approvalWorkflow || [],
    [activeVersion?.workflow, objRecord?.approvalWorkflow]
  );
  const workflowSteps = useMemo(
    () => getUnifiedBudgetWorkflowSteps(objRecord?.status, objRecord?.lastUpdated, activeWorkflow),
    [objRecord?.status, objRecord?.lastUpdated, activeWorkflow]
  );
  const { internalSteps, externalSteps } = useMemo(
    () => splitUnifiedWorkflowStepsByLane(workflowSteps, arrWorkflowStageDefinitions),
    [workflowSteps, arrWorkflowStageDefinitions]
  );
  const blnShowExternalStageUpdate = useMemo(
    () => isExternalStageUpdatePanelVisible(objRecord, activeWorkflow, arrWorkflowStageDefinitions)
      && externalSteps.length > 0,
    [objRecord, activeWorkflow, arrWorkflowStageDefinitions, externalSteps.length]
  );
  const blnWorkflowFullyApproved = useMemo(
    () => isUnifiedBudgetWorkflowFullyApproved(activeWorkflow, arrWorkflowStageDefinitions),
    [activeWorkflow, arrWorkflowStageDefinitions]
  );
  useEffect(() => {
    if (externalSteps.length > 0) {
      const currentExt = externalSteps.find((s) => s.status === 'current');
      setStrSelectedStageKey(currentExt?.title || externalSteps[0]?.title || '');
    }
  }, [externalSteps]);



  const handleFileUpload = async (rawFiles) => {
    if (!objRecord || rawFiles.length === 0) return;
    setBlnIsUploading(true);
    try {
      const now = new Date().toISOString();
      const prepared = await Promise.all(
        rawFiles.map(async (file) => ({
          id: `${file.name}-${file.size}-${file.lastModified}`,
          name: file.name,
          size: file.size,
          type: file.type || 'application/octet-stream',
          lastModified: file.lastModified,
          stage: strSelectedStageKey || '',
          uploadedAt: now,
          dataUrl: await readFileAsDataUrl(file),
        }))
      );
      const existing = Array.isArray(objRecord.attachedFiles) ? objRecord.attachedFiles : [];
      const response = await updateUnifiedBudget(objRecord.id, {
        attachedFiles: [...existing, ...prepared],
      });
      if (response?.data) setObjRecord(response.data);
      showToast({ message: `${rawFiles.length} file(s) uploaded successfully.`, variant: 'success' });
    } catch {
      showToast({ message: 'Failed to upload file(s).', variant: 'error' });
    }
    setBlnIsUploading(false);
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    setBlnIsDragging(false);
    handleFileUpload(Array.from(e.dataTransfer.files));
  };

  const handleFileChange = (e) => {
    handleFileUpload(Array.from(e.target.files));
    e.target.value = '';
  };

  const handleExternalStageUpdate = async () => {
    if (!objRecord || !strSelectedStageKey) return;

    if (blnWorkflowFullyApproved) {
      showToast({
        message: 'This budget has completed the full approval workflow. No further stage updates are allowed.',
        variant: 'warning',
      });
      return;
    }
    const decision = strStatusDecision === 'approved' ? 'approve' : 'reject';
    const actionType = getUnifiedBudgetWorkflowActionForStep(strSelectedStageKey, decision);
    if (!actionType) {
      showToast({ message: 'Cannot perform that action for the selected stage.', variant: 'error' });
      return;
    }

    setBlnIsSubmitting(true);
    const actionAt = getCurrentTimestamp();
    const strActorName = getWorkflowActorNameFromUser(user);
    const nextWorkflow = stripWorkflowStepsNotes(
      applyUnifiedBudgetWorkflowAction(activeWorkflow, actionType, actionAt, strActorName)
    );
    const resolvedStatus = String(actionType).endsWith('_reject') ? 'REJECTED' : 'APPROVED';
    const strResolvedStage = strSelectedStageKey;

    const nextApprovalVersions = approvalVersions.map((versionEntry) => {
      if (Number(versionEntry?.version) !== currentVersion) return versionEntry;
      return {
        ...versionEntry,
        status: resolvedStatus,
        stage: strResolvedStage,
        endedAt: resolvedStatus === 'APPROVED' && isUnifiedBudgetTerminalApprovalAction(actionType) ? actionAt : '',
        rejectedAtStage: resolvedStatus === 'REJECTED' ? strSelectedStageKey : '',
        actionNote: strOfficialRemarks.trim(),
        workflow: nextWorkflow,
        snapshot: versionEntry.snapshot ? {
          ...versionEntry.snapshot,
          overview: versionEntry.snapshot.overview ? {
            ...versionEntry.snapshot.overview,
            status: resolvedStatus,
            stage: strResolvedStage,
          } : undefined
        } : undefined
      };
    });

    try {
      const response = await updateUnifiedBudget(objRecord.id, {
        actor_id: user?.id ?? user?.usr_id ?? null,
        status: resolvedStatus,
        stage: strResolvedStage,
        approvalWorkflow: nextWorkflow,
        approvalVersions: nextApprovalVersions,
        lastUpdated: actionAt,
      });
      const updated = response?.data;
      if (updated) {
        setObjRecord(updated);
        setStrOfficialRemarks('');
        showToast({
          message: decision === 'approve'
            ? `${strSelectedStageKey} approved successfully.`
            : `${strSelectedStageKey} rejected successfully.`,
          variant: 'success',
        });
      }
    } catch {
      showToast({ message: 'Failed to update stage.', variant: 'error' });
    }
    setBlnIsSubmitting(false);
  };

  if (blnIsLoading) return <div className="p-4">Loading budget tracking...</div>;
  if (!objRecord) {
    return (
      <div className="p-4">
        <h5 className="mb-2">Unified budget not found.</h5>
        <Button variant="outline" size="sm" onClick={() => navigate('/budget-consolidation')}>
          Back to list
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="d-flex align-items-center justify-content-between px-4 py-3 border-bottom">
        <div className="d-flex align-items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/budget-consolidation/${id}`)}
            leftIcon={<BsArrowLeft />}
          >
            Back
          </Button>
          <h5 className="mb-0 fw-semibold">Approval Tracking</h5>
        </div>
      </div>

      <div className="p-4">
        <div className="card border rounded-3 p-4 mb-3">
          <div className="row g-3">
            <div className="col-md-3">
              <p className="text-muted small mb-1">Reference</p>
              <p className="fw-semibold mb-0">{objRecord.code || objRecord.id}</p>
            </div>
            <div className="col-md-2">
              <p className="text-muted small mb-1">Version</p>
              <p className="fw-semibold mb-0">{currentVersion}</p>
            </div>
            <div className="col-md-2">
              <p className="text-muted small mb-1">Status</p>
              <p className="fw-semibold mb-0">{objRecord.status}</p>
            </div>
            <div className="col-md-5">
              <p className="text-muted small mb-1">Stage</p>
              <p className="fw-semibold mb-0">{activeVersion?.stage || objRecord.stage || '—'}</p>
            </div>
          </div>
        </div>

        <div className="card border rounded-3 p-4 mb-3">
          <p className="fw-bold text-uppercase mb-1 section-eyebrow">Approval Workflow</p>
          {internalSteps.length === 0 && externalSteps.length === 0 ? (
            <p className="text-muted small mb-0">No workflow steps yet.</p>
          ) : (
            <>
              <p className="fw-semibold small text-uppercase text-muted mt-3">Internal stages</p>
              {internalSteps.length > 0 ? (
                <ApprovalWorkflowTimeline steps={internalSteps} />
              ) : (
                <p className="text-muted small mb-0">None</p>
              )}
              <p className="fw-semibold small text-uppercase text-muted mb-3 mt-3">External stages</p>
              {externalSteps.length > 0 ? (
                <ApprovalWorkflowTimeline steps={externalSteps} />
              ) : (
                <p className="text-muted small mb-0">None</p>
              )}
            </>
          )}
        </div>

        {blnShowExternalStageUpdate ? (
          <div className="row g-3">
            <div className="col-md-5">
              <div className="card border rounded-3 p-4 h-100 d-flex flex-column gap-3">
                <div>
                  <p className="fw-bold mb-0 text-brand">External Stage Update</p>
                  <p className="text-muted small mb-0">Modify the status of inter-agency reviews.</p>
                </div>

                <div>
                  <label className="form-label small fw-semibold text-uppercase text-muted mb-1">Target Entity</label>
                  <Dropdown
                    options={externalSteps.map((step) => ({ value: step.title, label: step.title }))}
                    value={strSelectedStageKey}
                    onChange={setStrSelectedStageKey}
                    disabled={blnWorkflowFullyApproved || blnIsSubmitting}
                  />
                </div>

                <div>
                  <label className="form-label small fw-semibold text-uppercase text-muted mb-2">Status Update</label>
                  <div className="d-flex gap-2">
                    {['approved', 'rejected'].map((s) => (
                      <Button
                        key={s}
                        size="sm"
                        variant={strStatusDecision === s ? 'primary' : 'outline'}
                        onClick={() => setStrStatusDecision(s)}
                        disabled={blnWorkflowFullyApproved || blnIsSubmitting}
                      >
                        {s.toUpperCase()}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="form-label small fw-semibold text-uppercase text-muted mb-1">Official Remarks</label>
                  <Input
                    type="textarea"
                    rows={4}
                    placeholder="Enter decision summary..."
                    value={strOfficialRemarks}
                    onChange={(e) => setStrOfficialRemarks(e.target.value)}
                    disabled={blnWorkflowFullyApproved || blnIsSubmitting}
                  />
                </div>

                {blnWorkflowFullyApproved ? (
                  <p className="text-muted small mb-0">
                    All approval stages are complete. Status updates are no longer available.
                  </p>
                ) : null}

                <Button
                  fullWidth
                  loading={blnIsSubmitting}
                  disabled={!strSelectedStageKey || blnWorkflowFullyApproved || blnIsSubmitting}
                  onClick={handleExternalStageUpdate}
                >
                  Status Update
                </Button>

                <div
                  className={`border rounded-3 p-4 text-center ${blnIsDragging ? 'bg-light' : ''}`}
                  style={{ borderStyle: 'dashed', borderWidth: 2, borderColor: '#ccc', cursor: blnIsUploading ? 'wait' : 'pointer' }}
                  onDragOver={(e) => { e.preventDefault(); setBlnIsDragging(true); }}
                  onDragLeave={() => setBlnIsDragging(false)}
                  onDrop={handleFileDrop}
                  onClick={() => !blnIsUploading && fileInputRef.current?.click()}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && !blnIsUploading && fileInputRef.current?.click()}
                >
                  <BsCloudUpload size={28} className="text-muted mb-2" />
                  <p className="fw-semibold mb-1">{blnIsUploading ? 'Uploading...' : 'Upload Revised Documents'}</p>
                  <p className="text-muted small mb-0">Drag or drop file, or click to browse</p>
                  <input ref={fileInputRef} type="file" hidden multiple onChange={handleFileChange} />
                </div>

                <Button fullWidth variant="outline" onClick={() => navigate(`/budget-consolidation/${id}`)}>
                  ✕ Close
                </Button>
              </div>
            </div>

            <div className="col-md-7">
              <div className="card border rounded-3 p-4 h-100">
                <div className="d-flex align-items-start justify-content-between mb-3">
                  <div>
                    <p className="fw-bold mb-0 text-brand">Document Version History</p>
                    <p className="text-muted small mb-0">Audit trail of all fiscal revisions and submittals.</p>
                  </div>
                  <div className="d-flex gap-2 text-muted">
                    <BsSliders size={18} style={{ cursor: 'pointer' }} title="Filter" />
                    <BsDownload size={18} style={{ cursor: 'pointer' }} title="Download all" />
                  </div>
                </div>
                <hr className="mt-0" />
                {(() => {
                  const stageFiles = (objRecord.attachedFiles || []).filter((f) => f.stage);
                  if (stageFiles.length === 0) return <p className="text-muted small mb-0">No documents uploaded yet.</p>;
                  return stageFiles.map((doc) => (
                    <div key={doc.id || doc.name} className="d-flex align-items-center gap-3 py-2 border-bottom">
                      <BsFileEarmarkText size={32} className="text-primary flex-shrink-0" />
                      <div className="flex-grow-1 overflow-hidden">
                        <p className="fw-semibold mb-1 text-truncate">{doc.name}</p>
                        <div className="d-flex align-items-center gap-2 flex-wrap">
                          {doc.stage && <Badge status="reviewed" label={`Stage: ${doc.stage}`} />}
                          {doc.uploadedAt && (
                            <small className="text-muted">
                              {new Date(doc.uploadedAt).toLocaleString('en-US', {
                                month: 'short', day: '2-digit', year: 'numeric',
                                hour: '2-digit', minute: '2-digit', hour12: true,
                              })}
                            </small>
                          )}
                        </div>
                      </div>
                      {doc.url && (
                        <a href={doc.url} target="_blank" rel="noreferrer" className="text-muted flex-shrink-0" title="Download">
                          <BsDownload size={16} />
                        </a>
                      )}
                    </div>
                  ));
                })()}
              </div>
            </div>
          </div>
        ) : null}
      </div>

    </>
  );
}

// ===========================================================================
// Root export — switches between list and detail based on route param
// ===========================================================================
export default function BudgetTrackingPage() {
  const { id } = useParams();
  return id ? <BudgetTrackingDetailView id={id} /> : <BudgetTrackingListView />;
}
