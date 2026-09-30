/**
 * System Name: Budget Management System
 * Module Name: Budget Review
 *
 * Purpose of this file:
 * Review detail page — Budget Officer can view and validate a request.
 *
 * Author(s): QUT Group 27
 *
 * Copyright (C) 2026
 * by the Department of Science and Technology - Central Office
 * Developed by Team 27, Queensland University of Technology
 * All rights reserved.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BsArrowLeft, BsArrowReturnLeft, BsCheckAll, BsCheckCircleFill } from 'react-icons/bs';
import {
  getBudgetCategories,
  getBudgetRequestActivity,
  getBudgetRequestById,
  getBudgetRequestVersions,
  getFiscalYears,
  getPlanningPeriods,
  getRequestingUnits,
  reviewBudgetRequest,
} from '../../api';
import { Button, Modal } from '../../components/ui';
import BudgetRequestForm from '../../components/form/budget_request_form';
import BudgetRequestAttachedFormsTab from '../../components/form/budget_request_attached_forms_tab';
import BudgetRequestVersionsTab from '../../components/form/budget_request_versions_tab';
import { getWorkflowSteps } from '../../utils/budget_request_workflow_utils';
import { MAX_LENGTHS } from '../../utils/input_validation';
import {
  buildBudgetCategoryDropdownOptions,
  buildCategoryIdToCodeMap,
  buildFiscalYearDropdownOptions,
  buildPlanningPeriodDropdownOptions,
  buildRequestingUnitDropdownOptions,
  computeBudgetLineItemTotals,
  DEFAULT_PLANNING_PERIOD_ID,
  fetchBudgetCategoriesForPage,
  fetchFiscalYearsForBudgetPage,
  fetchPlanningPeriodsForPage,
  fetchRequestingUnitsForBudgetPage,
  formatBudgetRequestCurrency,
  getBudgetRequestReviewCommentClass,
} from '../../utils/budget_request_utils';
import { DEFAULT_COST_STRUCTURE, normalizeCostStructure } from '../../utils/cost_structure';
import { useAuth } from '../../context/auth_context';
import { formatTimestamp, toTitleCase } from '../../utils/formatters';

const REVIEWABLE_STATUSES = ['submitted'];
const REVIEWED_STATUSES = ['approved', 'rejected', 'reviewed', 'consolidated'];

export default function BudgetReviewDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();

  const [objBudgetRequest, setObjBudgetRequest] = useState(null);
  const [blnIsLoading, setBlnIsLoading] = useState(true);
  const [blnIsProcessing, setBlnIsProcessing] = useState(false);
  const [strReviewComment, setStrReviewComment] = useState('');
  const [strCommentError, setStrCommentError] = useState('');
  const [blnIsApproveModalOpen, setBlnIsApproveModalOpen] = useState(false);
  const [blnIsReturnModalOpen, setBlnIsReturnModalOpen] = useState(false);
  const [blnIsConsolidateModalOpen, setBlnIsConsolidateModalOpen] = useState(false);

  const [strTitle, setStrTitle] = useState('');
  const [strUnit, setStrUnit] = useState('');
  const [strDescription, setStrDescription] = useState('');
  const [strFiscalYear, setStrFiscalYear] = useState('');
  const [strPlanningPeriod, setStrPlanningPeriod] = useState(DEFAULT_PLANNING_PERIOD_ID);
  const [arrLineItems, setArrLineItems] = useState([]);

  const [arrFiscalYears, setArrFiscalYears] = useState([]);
  const [arrPlanningPeriods, setArrPlanningPeriods] = useState([]);
  const [arrRequestingUnits, setArrRequestingUnits] = useState([]);
  const [arrBudgetCategories, setArrBudgetCategories] = useState([]);
  const [arrRawItems, setArrRawItems] = useState([]);
  const [arrActivityLogs, setArrActivityLogs] = useState([]);
  const [strActiveTab, setStrActiveTab] = useState('overview');
  const [arrVersions, setArrVersions] = useState([]);
  const [blnVersionsLoading, setBlnVersionsLoading] = useState(false);

  const strApiStatus = objBudgetRequest?.br_status || '';
  const strStatus = toTitleCase(strApiStatus || 'draft');
  const isReviewable = REVIEWABLE_STATUSES.includes(strApiStatus.toLowerCase());
  const isAlreadyReviewed = REVIEWED_STATUSES.includes(strApiStatus.toLowerCase());
  const isValidatable = strApiStatus.toLowerCase() === 'approved';

  const workflowSteps = useMemo(
    () => getWorkflowSteps(
      strStatus, '',
      objBudgetRequest?.br_updated_at || objBudgetRequest?.br_created_at,
      objBudgetRequest,
      arrActivityLogs,
    ),
    [strStatus, objBudgetRequest, arrActivityLogs]
  );

  const categoryIdToCode = useMemo(() => buildCategoryIdToCodeMap(arrBudgetCategories), [arrBudgetCategories]);
  const fiscalYearOptions = useMemo(() => buildFiscalYearDropdownOptions(arrFiscalYears), [arrFiscalYears]);
  const planningPeriodOptions = useMemo(
    () => buildPlanningPeriodDropdownOptions(arrPlanningPeriods),
    [arrPlanningPeriods]
  );
  const requestingUnitOptions = useMemo(() => buildRequestingUnitDropdownOptions(arrRequestingUnits), [arrRequestingUnits]);
  const budgetCategoryOptions = useMemo(() => buildBudgetCategoryDropdownOptions(arrBudgetCategories), [arrBudgetCategories]);

  const mapItemApiToUi = useCallback((objItem) => ({
    id: objItem?.bri_id,
    name: objItem?.bri_description || '',
    category: categoryIdToCode.get(Number(objItem?.bri_category_id)) || 'PS',
    costStructure: normalizeCostStructure(objItem?.bri_cost_structure) || DEFAULT_COST_STRUCTURE,
    amount: objItem?.bri_planned_amount ?? '',
    justification: objItem?.bri_justification || '',
    sortOrder: objItem?.bri_sort_order ?? 0,
  }), [categoryIdToCode]);

  const { psTotal, mooeTotal, coTotal, tagTotal, grandTotal } = useMemo(
    () => computeBudgetLineItemTotals(arrLineItems),
    [arrLineItems]
  );

  useEffect(() => {
    let isMounted = true;

    const loadBudgetCategories = async () => {
      const arrData = await fetchBudgetCategoriesForPage(getBudgetCategories);
      if (!isMounted) return;
      setArrBudgetCategories(arrData);
    };

    const loadFiscalYears = async () => {
      const arrData = await fetchFiscalYearsForBudgetPage(getFiscalYears);
      if (!isMounted) return;
      setArrFiscalYears(arrData);
    };

    const loadPlanningPeriods = async () => {
      const arrData = await fetchPlanningPeriodsForPage(getPlanningPeriods);
      if (!isMounted) return;
      setArrPlanningPeriods(arrData);
    };

    const loadRequestingUnits = async () => {
      const arrData = await fetchRequestingUnitsForBudgetPage(getRequestingUnits);
      if (!isMounted) return;
      setArrRequestingUnits(arrData);
    };

    const loadDetail = async () => {
      setBlnIsLoading(true);
      try {
        const objResult = await getBudgetRequestById(Number(id));
        const data = objResult?.data ?? null;
        if (!isMounted) return;
        setObjBudgetRequest(data);
        if (data) {
          setStrTitle(data.br_title || '');
          setStrUnit(String(data.br_requesting_unit_id ?? data.requesting_unit?.ru_id ?? ''));
          setStrDescription(data.br_description || '');
          setStrFiscalYear(String(data.br_fiscal_year_id ?? data.fiscal_year?.fy_id ?? ''));
          setStrPlanningPeriod(String(
            data.br_planning_period_id ??
            data.planning_period?.pp_id ??
            DEFAULT_PLANNING_PERIOD_ID
          ));
          setArrRawItems(Array.isArray(data.items) ? data.items : []);
        }
      } catch (err) {
        if (!isMounted) return;
        if (err?.response?.status === 401) navigate('/login', { replace: true });
        setObjBudgetRequest(null);
      } finally {
        if (isMounted) setBlnIsLoading(false);
      }
    };

    const loadActivity = async () => {
      try {
        const res = await getBudgetRequestActivity(Number(id));
        if (!isMounted) return;
        setArrActivityLogs(Array.isArray(res?.data) ? res.data : []);
      } catch { /* non-critical */ }
    };

    const loadVersions = async () => {
      setBlnVersionsLoading(true);
      try {
        const res = await getBudgetRequestVersions(Number(id));
        if (!isMounted) return;
        setArrVersions(Array.isArray(res?.data) ? res.data : []);
      } catch { /* non-critical */ } finally {
        if (isMounted) setBlnVersionsLoading(false);
      }
    };

    loadBudgetCategories();
    loadFiscalYears();
    loadPlanningPeriods();
    loadRequestingUnits();
    loadDetail();
    loadActivity();
    loadVersions();

    return () => { isMounted = false; };
  }, [id, navigate]);

  useEffect(() => {
    setArrLineItems(arrRawItems.map(mapItemApiToUi));
  }, [arrRawItems, mapItemApiToUi]);

  const handleApprove = async () => {
    setBlnIsProcessing(true);
    try {
      await reviewBudgetRequest(Number(id), {
        action: 'approve',
        comment: strReviewComment.trim(),
        actor_id: user?.usr_id ?? user?.id ?? null,
      });
      // navigate(`/budget-review/${id}`, { replace: true });
      window.location.reload();
    } catch {
      window.alert('Cannot perform transaction. Error encountered.');
    } finally {
      setBlnIsProcessing(false);
      setBlnIsApproveModalOpen(false);
    }
  };

  const handleReturn = async () => {
    if (!strReviewComment.trim()) {
      setStrCommentError('Clarification notes are required when returning a request.');
      return;
    }
    setBlnIsProcessing(true);
    try {
      await reviewBudgetRequest(Number(id), {
        action: 'return',
        comment: strReviewComment.trim(),
        actor_id: user?.usr_id ?? user?.id ?? null,
      });
      navigate('/budget-review');
    } catch {
      window.alert('Cannot perform transaction. Error encountered.');
    } finally {
      setBlnIsProcessing(false);
      setBlnIsReturnModalOpen(false);
    }
  };

  const openReturnModal = () => {
    setStrCommentError('');
    setBlnIsReturnModalOpen(true);
  };

  const handleValidate = async () => {
    setBlnIsProcessing(true);
    try {
      await reviewBudgetRequest(Number(id), {
        action: 'validate',
        comment: strReviewComment.trim(),
        actor_id: user?.usr_id ?? user?.id ?? null,
      });
      navigate(`/budget-review/${id}`, { replace: true });
    } catch {
      window.alert('Cannot perform transaction. Error encountered.');
    } finally {
      setBlnIsProcessing(false);
      setBlnIsConsolidateModalOpen(false);
    }
  };

  const latestReviewComment = useMemo(() => {
    const direct = String(objBudgetRequest?.br_review_comment || '').trim();
    if (direct) return direct;

    const latestWithComment = [...(arrActivityLogs || [])]
      .reverse()
      .find((log) =>
        ['returned', 'rejected', 'approved', 'consolidated'].includes(String(log?.bral_action || '').toLowerCase())
        && String(log?.bral_comment || '').trim() !== ''
      );

    return String(latestWithComment?.bral_comment || '').trim();
  }, [objBudgetRequest?.br_review_comment, arrActivityLogs]);

  const reviewPanel = (
    <div className="card border rounded-3 p-3 mb-3">
      <p className="fw-bold text-uppercase mb-3 section-eyebrow">Review Decision</p>

      {isReviewable && (
        <>
          <div className="d-grid gap-2 mt-3">
            <Button
              leftIcon={<BsCheckCircleFill />}
              onClick={() => { setStrReviewComment(''); setStrCommentError(''); setBlnIsApproveModalOpen(true); }}
              disabled={blnIsProcessing}
            >
              Validate to Consolidate
            </Button>
            <Button
              variant="outline"
              leftIcon={<BsArrowReturnLeft />}
              onClick={openReturnModal}
              disabled={blnIsProcessing}
            >
              Return for Clarification
            </Button>
          </div>
        </>
      )}

      {isAlreadyReviewed && (
        <>
          <p className="text-muted small mb-2">
            {formatTimestamp(objBudgetRequest?.br_reviewed_at || objBudgetRequest?.br_updated_at)}
          </p>
          {latestReviewComment ? (
            <div className={getBudgetRequestReviewCommentClass(strApiStatus)}>
              <p className="fw-semibold small mb-1">Review Comment</p>
              <p className="small mb-0">&ldquo;{latestReviewComment}&rdquo;</p>
            </div>
          ) : null}
          {isValidatable && (
            <>
              <hr className="my-3" />
              <Button
                fullWidth
                leftIcon={<BsCheckAll />}
                onClick={() => { setStrReviewComment(''); setStrCommentError(''); setBlnIsConsolidateModalOpen(true); }}
                disabled={blnIsProcessing}
              >
                Validate to Consolidate
              </Button>
            </>
          )}
        </>
      )}
    </div>
  );

  if (blnIsLoading) {
    return <div className="p-4">Loading request details...</div>;
  }

  if (!objBudgetRequest) {
    return (
      <div className="p-4">
        <h5 className="mb-2">Budget request not found.</h5>
        <Button variant="outline" size="sm" onClick={() => navigate('/budget-review')}>
          Back to Review List
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="d-flex align-items-center gap-2 px-4 py-3 border-bottom">
        <Button variant="ghost" size="sm" onClick={() => navigate('/budget-review')} leftIcon={<BsArrowLeft />}>
          Back
        </Button>
        <h5 className="mb-0 fw-semibold">
          {isReviewable ? 'Review Budget Request' : 'Reviewed Budget Request'}
        </h5>
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
            className={`nav-link fw-semibold border-0 bg-transparent${strActiveTab === 'attached-forms' ? ' active nav-underline-active-brand' : ''}`}
            onClick={() => setStrActiveTab('attached-forms')}
          >
            Attached Forms
            {(() => {
              const count = (Array.isArray(objBudgetRequest?.br_form_entries) ? objBudgetRequest.br_form_entries.length : 0)
                + (Array.isArray(objBudgetRequest?.br_attached_files) ? objBudgetRequest.br_attached_files.length : 0);
              return count > 0 ? (
                <span className="badge rounded-pill text-bg-light border ms-2">{count}</span>
              ) : null;
            })()}
          </button>
        </li>
        <li className="nav-item">
          <button
            type="button"
            className={`nav-link fw-semibold border-0 bg-transparent${strActiveTab === 'versions' ? ' active nav-underline-active-brand' : ''}`}
            onClick={() => setStrActiveTab('versions')}
          >
            Versions
          </button>
        </li>
      </ul>

      {strActiveTab === 'versions' ? (
        <BudgetRequestVersionsTab versions={arrVersions} isLoading={blnVersionsLoading} />
      ) : strActiveTab === 'attached-forms' ? (
        <BudgetRequestAttachedFormsTab
          canEdit={false}
          title="Attached Forms"
          attachmentMode="both"
          attachedForms={objBudgetRequest?.br_form_entries || []}
          attachedFiles={objBudgetRequest?.br_attached_files || []}
        />
      ) : <BudgetRequestForm
        mode="view"
        isEditable={false}
        sidebarTopContent={reviewPanel}
        formData={{
          title: strTitle,
          unit: strUnit,
          description: strDescription,
          fiscalYear: strFiscalYear,
          planningPeriod: strPlanningPeriod,
          comment: objBudgetRequest?.br_comment || '',
          status: strStatus,
          referenceCode: String(objBudgetRequest?.br_reference_no || objBudgetRequest?.br_id || ''),
          currentVersionNumber: objBudgetRequest?.br_current_version_number ?? null,
        }}
        maxLengths={MAX_LENGTHS}
        errors={{}}
        fiscalYearOptions={fiscalYearOptions}
        planningPeriodOptions={planningPeriodOptions}
        requestingUnitOptions={requestingUnitOptions}
        budgetCategoryOptions={budgetCategoryOptions}
        attachedForms={objBudgetRequest?.br_form_entries || []}
        lineItems={arrLineItems}
        totals={{ psTotal, mooeTotal, coTotal, tagTotal, grandTotal }}
        workflowSteps={workflowSteps}
        actions={[{ label: 'Close', variant: 'outline', onClick: () => navigate('/budget-review') }]}
        onFieldChange={() => { }}
        onLineItemChange={() => { }}
        onAddLineItem={() => { }}
        onDeleteLineItem={() => { }}
        formatCurrency={formatBudgetRequestCurrency}
      />}

      <Modal
        open={blnIsApproveModalOpen}
        onClose={() => { if (!blnIsProcessing) setBlnIsApproveModalOpen(false); }}
        title="Validate to Consolidate?"
        size="md"
        footer={(
          <div className="d-grid d-sm-flex justify-content-sm-end gap-2 w-100">
            <Button variant="secondary" onClick={() => setBlnIsApproveModalOpen(false)} disabled={blnIsProcessing}>
              Cancel
            </Button>
            <Button onClick={handleApprove} disabled={blnIsProcessing}>
              {blnIsProcessing ? 'Validating...' : 'Confirm Validate'}
            </Button>
          </div>
        )}
      >
        <p className="mb-0">
          Validate <strong>{objBudgetRequest?.br_title}</strong> for consolidation? This will mark the request as reviewed and approved.
        </p>
        <label className="form-label small fw-semibold mt-3 mb-1">
          Remark
          <span className="text-muted fw-normal ms-1">(optional)</span>
        </label>
        <textarea
          className="form-control form-control-sm"
          placeholder="Add a validation remark..."
          rows={3}
          value={strReviewComment}
          onChange={(e) => setStrReviewComment(e.target.value)}
        />
      </Modal>

      <Modal
        open={blnIsReturnModalOpen}
        onClose={() => { if (!blnIsProcessing) setBlnIsReturnModalOpen(false); }}
        title="Return for Clarification?"
        size="md"
        footer={(
          <div className="d-grid d-sm-flex justify-content-sm-end gap-2 w-100">
            <Button variant="secondary" onClick={() => setBlnIsReturnModalOpen(false)} disabled={blnIsProcessing}>
              Cancel
            </Button>
            <Button variant="outline" onClick={handleReturn} disabled={blnIsProcessing}>
              {blnIsProcessing ? 'Returning...' : 'Confirm Return'}
            </Button>
          </div>
        )}
      >
        <p className="mb-1">
          Return <strong>{objBudgetRequest?.br_title}</strong> to the requester for clarification?
        </p>
        <label className="form-label small fw-semibold mb-1">
          Review Comment
          <span className="text-muted fw-normal ms-1">(required for clarification)</span>
        </label>
        <textarea
          className={`form-control form-control-sm${strCommentError ? ' is-invalid' : ''}`}
          placeholder="Add a comment or clarification notes..."
          rows={3}
          value={strReviewComment}
          onChange={(e) => { setStrReviewComment(e.target.value); setStrCommentError(''); }}
        />
        {strCommentError ? <div className="text-danger small mt-2 mb-0">{strCommentError}</div> : null}
      </Modal>

      <Modal
        open={blnIsConsolidateModalOpen}
        onClose={() => { if (!blnIsProcessing) setBlnIsConsolidateModalOpen(false); }}
        title="Validate to Consolidate?"
        size="md"
        footer={(
          <div className="d-grid d-sm-flex justify-content-sm-end gap-2 w-100">
            <Button variant="secondary" onClick={() => setBlnIsConsolidateModalOpen(false)} disabled={blnIsProcessing}>
              Cancel
            </Button>
            <Button leftIcon={<BsCheckAll />} onClick={handleValidate} disabled={blnIsProcessing}>
              {blnIsProcessing ? 'Validating...' : 'Confirm Validate'}
            </Button>
          </div>
        )}
      >
        <p className="mb-0">
          Validate <strong>{objBudgetRequest?.br_title}</strong> for consolidation? This will mark the request as consolidated and ready for the next stage.
        </p>
        <label className="form-label small fw-semibold mt-3 mb-1">
          Remark
          <span className="text-muted fw-normal ms-1">(optional)</span>
        </label>
        <textarea
          className="form-control form-control-sm"
          placeholder="Add a validation remark..."
          rows={3}
          value={strReviewComment}
          onChange={(e) => setStrReviewComment(e.target.value)}
        />
      </Modal>
    </>
  );
}
