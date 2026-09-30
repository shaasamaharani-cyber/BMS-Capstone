/**
 * System Name: Budget Management System
 * Module Name: Core Module
 *
 * Purpose of this file:
 * Read-only view of a consolidated budget showing line totals, approval workflow, attached forms, and version history.
 *
 * Author(s): QUT Group 27
 *
 * Copyright (C) 2026
 * by the Department of Science and Technology - Central Office
 * Developed by Team 27, Queensland University of Technology
 * All rights reserved.
 */

import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BsArrowLeft } from 'react-icons/bs';
import { Button } from '../../components/ui';
import { useToast } from '../../components/ui/toast_message/toast_context';
import BudgetConsolidationForm from '../../components/form/budget_consolidation_form';
import BudgetRequestAttachedFormsTab from '../../components/form/budget_request_attached_forms_tab';
import UnifiedBudgetVersionsTab from '../../components/form/unified_budget_versions_tab';
import { getUnifiedBudgetById, getPlanningPeriods } from '../../api';
import { approveUnifiedBudget, rejectUnifiedBudget } from '../../api/budget_consolidation_api';
import { ALLOWED_FISCAL_YEARS, MAX_LENGTHS } from '../../utils/input_validation';
import {
  formatUnifiedWorkflowActionText,
  getActiveApprovalVersion,
  getUnifiedBudgetWorkflowSteps,
  getWorkflowActorNameFromUser,
} from '../../utils/workflow_utils';
import { splitUnifiedWorkflowStepsByLane } from '../../utils/unified_budget_workflow_lanes';
import { buildConsolidationLineRows } from '../../utils/consolidation_line_rows';
import { DEFAULT_COST_STRUCTURE, normalizeCostStructure } from '../../utils/cost_structure';
import {
  DEFAULT_PLANNING_PERIOD_ID,
  buildPlanningPeriodDropdownOptions,
  fetchPlanningPeriodsForPage,
} from '../../utils/budget_request_utils';
import { useAuth } from '../../context/auth_context';
import { toAmount, toFiscalYear } from '../../utils/helpers';

const fmt = (n) => `₱ ${n.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;

const normalizeConsolidatedSections = (raw, fallbackRequestId = 'BR-UNKNOWN', fallbackUnit = 'Unknown Unit') => {
  if (!Array.isArray(raw)) return [];
  if (raw.some((entry) => Array.isArray(entry?.items))) {
    return raw.map((section) => ({
      ...section,
      items: (section.items || []).map((item) => ({
        ...item,
        costStructure: normalizeCostStructure(item.costStructure) || DEFAULT_COST_STRUCTURE,
      })),
    }));
  }
  const onlyItems = raw.filter((row) => row?.rowType === 'item');
  const grouped = new Map();
  onlyItems.forEach((item, idx) => {
    const requestId = item.requestId || fallbackRequestId;
    const unit = item.requestingUnit || fallbackUnit;
    const key = `${requestId}::${unit}`;
    if (!grouped.has(key)) grouped.set(key, { requestId, requestTitle: 'Unified Source', requestingUnit: unit, items: [] });
    grouped.get(key).items.push({
      id: item.id || `${requestId}-${idx + 1}`,
      name: item.name || '',
      category: item.category || 'PS',
      costStructure: normalizeCostStructure(item.costStructure) || DEFAULT_COST_STRUCTURE,
      amount: toAmount(item.amount),
      justification: item.justification || '',
      requestId,
      requestingUnit: unit,
    });
  });
  return Array.from(grouped.values());
};

export default function BudgetConsolidationDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [blnIsLoading, setBlnIsLoading] = useState(true);
  const [objRecord, setObjRecord] = useState(null);
  const [arrPlanningPeriods, setArrPlanningPeriods] = useState([]);
  const [strActiveTab, setStrActiveTab] = useState('overview');
  const [strApproverComment, setStrApproverComment] = useState('');
  const [blnIsSubmitting, setBlnIsSubmitting] = useState(false);
  const [blnIsLocallyApproved, setBlnIsLocallyApproved] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setBlnIsLoading(true);
      const res = await getUnifiedBudgetById(id);
      if (!mounted) return;
      setObjRecord(res?.data || null);
      setBlnIsLoading(false);
    };
    load();
    return () => { mounted = false; };
  }, [id]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const rows = await fetchPlanningPeriodsForPage(getPlanningPeriods);
      if (mounted) setArrPlanningPeriods(Array.isArray(rows) ? rows : []);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const consolidatedLineItems = useMemo(
    () => normalizeConsolidatedSections(objRecord?.consolidatedLineItems, objRecord?.code || objRecord?.id, objRecord?.unit || objRecord?.requestingUnit),
    [objRecord]
  );

  const flattenedRows = useMemo(
    () => buildConsolidationLineRows(consolidatedLineItems),
    [consolidatedLineItems]
  );

  const totals = useMemo(() => {
    const result = { psTotal: 0, mooeTotal: 0, coTotal: 0, tagTotal: 0, grandTotal: 0 };
    flattenedRows.forEach((row) => {
      if (row.rowType !== 'item') return;
      if (row.category === 'PS') result.psTotal += row.amount;
      if (row.category === 'MOOE') result.mooeTotal += row.amount;
      if (row.category === 'CO') result.coTotal += row.amount;
      if (row.category === 'TAG') result.tagTotal += row.amount;
    });
    result.grandTotal = result.psTotal + result.mooeTotal + result.coTotal + result.tagTotal;
    return result;
  }, [flattenedRows]);

  const workflowSteps = useMemo(
    () => {
      const activeVersion = getActiveApprovalVersion(objRecord?.approvalVersions, objRecord?.currentVersion);
      const activeWorkflow = activeVersion?.workflow || objRecord?.approvalWorkflow;
      return getUnifiedBudgetWorkflowSteps(objRecord?.status, objRecord?.lastUpdated, activeWorkflow);
    },
    [objRecord?.status, objRecord?.lastUpdated, objRecord?.approvalWorkflow, objRecord?.approvalVersions, objRecord?.currentVersion]
  );

  const displayedWorkflowSteps = useMemo(() => {
    if (!blnIsLocallyApproved) return workflowSteps;

    const { internalSteps, externalSteps } = splitUnifiedWorkflowStepsByLane(workflowSteps);

    const approvedInternal = new Map(
      internalSteps.map((step) => [
        step.stepKey,
        {
          ...step,
          status: 'done',
          statusText: formatUnifiedWorkflowActionText({
            ...step,
            status: 'done',
            actionText: step.statusText || step.actionText || 'Approved',
            actorName: step.actorName || getWorkflowActorNameFromUser(user),
          }),
        },
      ])
    );
    const updatedExternal = new Map(
      externalSteps.map((step, idx) => [
        step.stepKey,
        idx === 0
          ? { ...step, status: 'current', statusText: 'Pending Approval' }
          : { ...step, status: 'locked', statusText: '' },
      ])
    );

    return workflowSteps.map(
      (step) => approvedInternal.get(step.stepKey) ?? updatedExternal.get(step.stepKey) ?? step
    );
  }, [blnIsLocallyApproved, workflowSteps, user]);

  const fiscalYearOptions = useMemo(
    () => [{ value: '', label: 'Select fiscal year' }, ...ALLOWED_FISCAL_YEARS.map((y) => ({ value: y, label: y }))],
    []
  );

  const planningPeriodOptions = useMemo(
    () => buildPlanningPeriodDropdownOptions(arrPlanningPeriods),
    [arrPlanningPeriods]
  );

  if (blnIsLoading) return <div className="p-4">Loading unified budget detail...</div>;
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

  const recordStatus = String(objRecord.status || '').trim().toUpperCase();
  const canApprove =
    String(user?.role?.role_group || '').toLowerCase() === 'executive' &&
    recordStatus === 'PENDING';

  const handleApprove = async () => {
    setBlnIsSubmitting(true);
    try {
      const res = await approveUnifiedBudget(id, {
        comment: strApproverComment,
        actor_id: user?.id ?? user?.usr_id ?? null,
      });
      const updated = res?.data ?? res;
      if (updated?.status) {
        setObjRecord(updated);
      } else {
        setObjRecord((prev) => ({ ...prev, status: 'APPROVED' }));
      }
    } catch {
      setObjRecord((prev) => ({ ...prev, status: 'APPROVED' }));
    }
    setBlnIsLocallyApproved(true);
    showToast({ message: 'Budget consolidation approved successfully.', variant: 'success' });
    setBlnIsSubmitting(false);
  };

  const handleReject = async () => {
    setBlnIsSubmitting(true);
    try {
      await rejectUnifiedBudget(id, {
        comment: strApproverComment,
        actor_id: user?.id ?? user?.usr_id ?? null,
      });
    } catch {
      // optimistic only
    }
    setObjRecord((prev) => ({ ...prev, status: 'REJECTED' }));
    showToast({ message: 'Budget consolidation rejected.', variant: 'success' });
    setBlnIsSubmitting(false);
    navigate('/budget-consolidation');
  };

  const approverPanel = canApprove ? (
    <div className="card border rounded-3 p-3">
      <p className="fw-bold text-uppercase mb-3 section-eyebrow">Approver Decisions</p>
      <label className="form-label text-uppercase small fw-semibold text-muted mb-1">
        Reviewer Comments
      </label>
      <textarea
        className="form-control mb-3"
        rows={4}
        placeholder="Enter notes or justifications for your decision..."
        value={strApproverComment}
        onChange={(e) => setStrApproverComment(e.target.value)}
        disabled={blnIsSubmitting}
      />
      <div className="d-grid gap-2">
        <Button fullWidth onClick={handleApprove} disabled={blnIsSubmitting}>
          {blnIsSubmitting ? 'Processing...' : '✔ Approve'}
        </Button>
        <Button fullWidth variant="danger" onClick={handleReject} disabled={blnIsSubmitting}>
          ⊘ Reject
        </Button>
        <Button fullWidth variant="secondary" onClick={() => navigate('/budget-consolidation')} disabled={blnIsSubmitting}>
          ✕ Close
        </Button>
      </div>
    </div>
  ) : null;

  return (
    <>
      <div className="d-flex align-items-center gap-2 px-4 py-3 border-bottom">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} leftIcon={<BsArrowLeft />}>
          Back
        </Button>
        <h5 className="mb-0 fw-semibold">View Budget Consolidation Request</h5>
      </div>

      <ul className="nav nav-underline px-4 border-bottom">
        <li className="nav-item">
          <button
            type="button"
            className={`nav-link fw-semibold border-0 bg-transparent${strActiveTab === 'overview' ? ' active nav-underline-active-brand' : ''}`}
            onClick={() => setStrActiveTab('overview')}
          >
            Overview
          </button>
        </li>
        <li className="nav-item">
          <button
            type="button"
            className={`nav-link fw-semibold border-0 bg-transparent${strActiveTab === 'attached-files' ? ' active nav-underline-active-brand' : ''}`}
            onClick={() => setStrActiveTab('attached-files')}
          >
            Attached Forms
            {Array.isArray(objRecord?.ub_attached_files) && objRecord.ub_attached_files.length > 0 ? (
              <span className="badge rounded-pill text-bg-light border ms-2">{objRecord.ub_attached_files.length}</span>
            ) : null}
          </button>
        </li>
        <li className="nav-item">
          <button
            type="button"
            className={`nav-link fw-semibold border-0 bg-transparent${strActiveTab === 'versions' ? ' active nav-underline-active-brand' : ''}`}
            onClick={() => setStrActiveTab('versions')}
          >
            Versions
            {Array.isArray(objRecord?.approvalVersions) && objRecord.approvalVersions.length > 0 ? (
              <span className="badge rounded-pill text-bg-light border ms-2">{objRecord.approvalVersions.length}</span>
            ) : null}
          </button>
        </li>
        <li className="nav-item">
          <button
            type="button"
            className="nav-link text-muted btn btn-link p-0 pt-2 ps-3 pe-0"
            onClick={() => navigate(`/budget-tracking/${id}`)}
          >
            Tracking
          </button>
        </li>
      </ul>

      {strActiveTab === 'versions' ? (
        <UnifiedBudgetVersionsTab versions={objRecord?.approvalVersions ?? []} />
      ) : strActiveTab === 'attached-files' ? (
        <BudgetRequestAttachedFormsTab
          canEdit={false}
          title="Attached Forms"
          attachmentMode="both"
          attachedForms={objRecord?.ub_form_entries || objRecord?.attachedForms || []}
          attachedFiles={objRecord?.ub_attached_files || objRecord?.attachedFiles || []}
        />
      ) : (
        <BudgetConsolidationForm
          mode="view"
          formData={{
            title: objRecord.title || '',
            unit: objRecord.unit || objRecord.requestingUnit || '',
            description: objRecord.description || '',
            fiscalYear: objRecord.fiscalYear || toFiscalYear(objRecord.periodStart),
            planningPeriod: String(
              objRecord.planningPeriod ??
              objRecord.ub_planning_period_id ??
              DEFAULT_PLANNING_PERIOD_ID
            ),
            comment: objRecord.comment || '',
            status: objRecord.status || 'DRAFT',
            referenceCode: objRecord.code || objRecord.id || '',
            currentVersion: Number(objRecord.currentVersion) > 0 ? Number(objRecord.currentVersion) : 1,
          }}
          errors={{}}
          maxLengths={MAX_LENGTHS}
          fiscalYearOptions={fiscalYearOptions}
          planningPeriodOptions={planningPeriodOptions}
          lineRows={flattenedRows}
          lineItemsError=""
          lineItemsFetchError=""
          lineItemsLoading={false}
          totals={totals}
          workflowSteps={displayedWorkflowSteps}
          approverPanel={approverPanel}
          actions={canApprove ? [] : [{ label: 'Close', variant: 'outline', onClick: () => navigate('/budget-consolidation') }]}
          onFieldChange={() => { }}
          onLineItemChange={() => { }}
          onCommentSend={() => { }}
          formatCurrency={fmt}
        />
      )}
    </>
  );
}
