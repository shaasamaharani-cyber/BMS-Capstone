/**
 * System Name: Budget Management System
 * Module Name: Core Module
 *
 * Purpose of this file:
 * Read-only detail view of a submitted budget request showing line items, workflow history, and attached forms.
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
import { BsArrowLeft, BsInfoCircleFill } from 'react-icons/bs';
import {
  getBudgetCategories,
  getBudgetRequestActivity,
  getBudgetRequestById,
  getBudgetRequestVersions,
  getFiscalYears,
  getPlanningPeriods,
  getRequestingUnits,
} from '../../api';
import { Button } from '../../components/ui';
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
import { toTitleCase } from '../../utils/formatters';
import { useHasPermission } from '../../hooks/use_permissions';
import { PERMISSIONS } from '../../utils/permissions';

export default function BudgetRequestDetailPage() {
  const navigate = useNavigate();
  // Reviewers reach this page from other screens and have no Budget Requests list to return to
  const blnHasRequestList = useHasPermission(PERMISSIONS.BUDGET_REQUESTS);
  const goBack = () => (blnHasRequestList ? navigate('/budget-requests') : navigate(-1));
  const { id } = useParams();

  const [objBudgetRequest, setObjBudgetRequest] = useState(null);
  const [blnIsLoading, setBlnIsLoading] = useState(true);
  const [strActiveTab, setStrActiveTab] = useState('overview');
  const apiStatus = objBudgetRequest?.br_status || '';
  const status = toTitleCase(apiStatus || 'draft');
  const isSubmittedStatus = ['submitted', 'pending'].includes(String(apiStatus || '').toLowerCase());

  const [strTitle, setStrTitle] = useState('');
  const [strUnit, setStrUnit] = useState('');
  const [strDescription, setStrDescription] = useState('');
  const [strFiscalYear, setStrFiscalYear] = useState('');
  const [strPlanningPeriod, setStrPlanningPeriod] = useState(DEFAULT_PLANNING_PERIOD_ID);
  const [strComment, setStrComment] = useState('');
  const [arrRawItems, setArrRawItems] = useState([]);

  const [arrFiscalYears, setArrFiscalYears] = useState([]);
  const [arrPlanningPeriods, setArrPlanningPeriods] = useState([]);
  const [arrRequestingUnits, setArrRequestingUnits] = useState([]);
  const [arrBudgetCategories, setArrBudgetCategories] = useState([]);
  const [arrActivityLogs, setArrActivityLogs] = useState([]);
  const [arrVersions, setArrVersions] = useState([]);
  const [blnVersionsLoading, setBlnVersionsLoading] = useState(false);

  const workflowSteps = useMemo(
    () => getWorkflowSteps(
      status,
      '',
      objBudgetRequest?.br_updated_at || objBudgetRequest?.br_created_at,
      objBudgetRequest,
      arrActivityLogs,
    ),
    [status, objBudgetRequest, arrActivityLogs]
  );

  const highlightedReviewComment = useMemo(() => {
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

  const reviewCommentBanner = highlightedReviewComment ? (
    <div className={getBudgetRequestReviewCommentClass(apiStatus)}>
      <p className="fw-semibold small mb-1">Review Comment</p>
      <p className="small mb-0">&ldquo;{highlightedReviewComment}&rdquo;</p>
    </div>
  ) : null;

  const fiscalYearOptions = useMemo(
    () => buildFiscalYearDropdownOptions(arrFiscalYears),
    [arrFiscalYears]
  );

  const planningPeriodOptions = useMemo(
    () => buildPlanningPeriodDropdownOptions(arrPlanningPeriods),
    [arrPlanningPeriods]
  );

  const requestingUnitOptions = useMemo(
    () => buildRequestingUnitDropdownOptions(arrRequestingUnits),
    [arrRequestingUnits]
  );

  const budgetCategoryOptions = useMemo(
    () => buildBudgetCategoryDropdownOptions(arrBudgetCategories),
    [arrBudgetCategories]
  );

  const categoryIdToCode = useMemo(
    () => buildCategoryIdToCodeMap(arrBudgetCategories),
    [arrBudgetCategories]
  );

  const mapItemApiToUi = useCallback((objItem) => ({
    id: objItem?.bri_id,
    name: objItem?.bri_description || '',
    category: categoryIdToCode.get(Number(objItem?.bri_category_id)) || 'PS',
    costStructure: normalizeCostStructure(objItem?.bri_cost_structure) || DEFAULT_COST_STRUCTURE,
    amount: objItem?.bri_planned_amount ?? '',
    justification: objItem?.bri_justification || '',
    sortOrder: objItem?.bri_sort_order ?? 0,
  }), [categoryIdToCode]);

  const lineItems = useMemo(
    () => arrRawItems.map(mapItemApiToUi),
    [arrRawItems, mapItemApiToUi]
  );

  const { psTotal, mooeTotal, coTotal, tagTotal, grandTotal } = useMemo(
    () => computeBudgetLineItemTotals(lineItems),
    [lineItems]
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

    const loadDetailData = async () => {
      setBlnIsLoading(true);
      try {
        const objResult = await getBudgetRequestById(Number(id));
        const data = objResult?.data ?? null;
        const arrItemsFromShow = Array.isArray(data?.items) ? data.items : null;
        const arrItems = arrItemsFromShow !== null ? arrItemsFromShow : [];

        if (!isMounted) return;

        setObjBudgetRequest(data);
        if (data) {
          const fiscalYearId = data.br_fiscal_year_id ?? data.fiscal_year?.fy_id ?? '';
          const planningPeriodId =
            data.br_planning_period_id ??
            data.planning_period?.pp_id ??
            DEFAULT_PLANNING_PERIOD_ID;
          setStrTitle(data.br_title || '');
          setStrUnit(String(data.br_requesting_unit_id ?? data.requesting_unit?.ru_id ?? ''));
          setStrDescription(data.br_description || '');
          setStrFiscalYear(String(fiscalYearId));
          setStrPlanningPeriod(String(planningPeriodId));
          setStrComment('');
          setArrRawItems(Array.isArray(arrItems) ? arrItems : []);
        }
      } catch (err) {
        if (!isMounted) return;
        if (err?.response?.status === 401) {
          navigate('/login', { replace: true });
          return;
        }
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
    loadDetailData();
    loadActivity();
    loadVersions();

    return () => {
      isMounted = false;
    };
  }, [id, navigate]);

  if (blnIsLoading) {
    return <div className="p-4">Loading request details...</div>;
  }

  if (!objBudgetRequest) {
    return (
      <div className="p-4">
        <h5 className="mb-2">Budget request not found.</h5>
        <Button variant="outline" size="sm" onClick={goBack}>
          Back to list
        </Button>
      </div>
    );
  }

  const actions = [{ label: 'Close', variant: 'outline', onClick: goBack }];

  return (
    <>
      <div className="d-flex align-items-center gap-2 px-4 py-3 border-bottom">
        <Button variant="ghost" size="sm" onClick={goBack} leftIcon={<BsArrowLeft />}>
          Back
        </Button>
        <h5 className="mb-0 fw-semibold">
          {isSubmittedStatus ? 'Submitted Budget Request' : 'View Budget Request'}
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
            {Array.isArray(objBudgetRequest?.br_attached_files) && objBudgetRequest.br_attached_files.length > 0 ? (
              <span className="badge rounded-pill text-bg-light border ms-2">{objBudgetRequest.br_attached_files.length}</span>
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
          </button>
        </li>
      </ul>

      {isSubmittedStatus && (
        <div className="px-4 pt-3">
          <div className="alert alert-info d-flex align-items-start gap-2 mb-0 py-2 px-3" role="alert">
            <BsInfoCircleFill className="mt-1 flex-shrink-0" />
            <div>
              <strong>Submitted for Review</strong>
              <span className="ms-1">
                This request has been submitted and is awaiting Internal Review. No changes can be made while it is under review.
              </span>
            </div>
          </div>
        </div>
      )}

      {strActiveTab === 'overview' ? <BudgetRequestForm
        mode="view"
        isEditable={false}
        formData={{
          title: strTitle,
          unit: strUnit,
          description: strDescription,
          fiscalYear: strFiscalYear,
          planningPeriod: strPlanningPeriod,
          comment: objBudgetRequest?.br_review_comment || strComment,
          status,
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
        lineItems={lineItems}
        totals={{ psTotal, mooeTotal, coTotal, tagTotal, grandTotal }}
        workflowSteps={workflowSteps}
        sidebarTopContent={reviewCommentBanner}
        actions={actions}
        onFieldChange={() => {}}
        onLineItemChange={() => {}}
        onAddLineItem={() => {}}
        onDeleteLineItem={() => {}}
        formatCurrency={formatBudgetRequestCurrency}
        showAttachedFormsSection={false}
      /> : strActiveTab === 'attached-forms' ? (
        <BudgetRequestAttachedFormsTab
          canEdit={false}
          title="Attached Forms"
          attachmentMode="both"
          attachedForms={objBudgetRequest?.br_form_entries || []}
          attachedFiles={objBudgetRequest?.br_attached_files || []}
        />
      ) : (
        <BudgetRequestVersionsTab versions={arrVersions} isLoading={blnVersionsLoading} />
      )}
    </>
  );
}
