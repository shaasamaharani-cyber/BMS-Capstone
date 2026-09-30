/**
 * System Name: Budget Management System
 * Module Name: Core Module
 *
 * Purpose of this file:
 * Edit page for an existing budget request — updates line items, attached forms, and re-submits for review.
 *
 * Author(s): QUT Group 27
 *
 * Copyright (C) 2026
 * by the Department of Science and Technology - Central Office
 * Developed by Team 27, Queensland University of Technology
 * All rights reserved.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  BsArrowLeft,
  BsSend,
  BsXCircle,
} from 'react-icons/bs';
import {
  getBudgetRequestActivity,
  getBudgetRequestById,
  getBudgetCategories,
  getFiscalYears,
  getPlanningPeriods,
  getRequestingUnits,
  getBudgetRequestVersions,
  submitBudgetRequest,
  updateBudgetRequest,
} from '../../api';
import { fetchAllSchemas, fetchEntriesBySchema } from '../../api/forms_api';
import { getEntryDisplayName } from '../../forms/utils/form_object';
import { seedDefaultSchemas } from '../../forms/utils/seed_default_schemas';
import { Button, Modal, useToast } from '../../components/ui';
import BudgetRequestForm from '../../components/form/budget_request_form';
import BudgetRequestAttachedFormsTab from '../../components/form/budget_request_attached_forms_tab';
import BudgetRequestVersionsTab from '../../components/form/budget_request_versions_tab';
import { getWorkflowSteps } from '../../utils/budget_request_workflow_utils';
import { useBudgetRequestFormHandlers } from './hooks/use_budget_request_form_handlers';
import { DEFAULT_COST_STRUCTURE, normalizeCostStructure } from '../../utils/cost_structure';
import { useAuth } from '../../context/auth_context';
import { readFileAsDataUrl } from '../../utils/helpers';
import {
  buildBudgetCategoryDropdownOptions,
  buildCategoryCodeToIdMap,
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
  mergeBackendBudgetRequestValidationErrors,
  getBudgetRequestReviewCommentClass,
} from '../../utils/budget_request_utils';

import {
  validateBudgetRequestForm,
  MAX_LENGTHS,
} from '../../utils/input_validation';
import { toTitleCase } from '../../utils/formatters';



export default function EditBudgetRequest() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user } = useAuth();
  const { id } = useParams();
  const [objBudgetRequest, setObjBudgetRequest] = useState(null);
  const [blnIsLoading, setBlnIsLoading] = useState(true);
  const apiStatus = objBudgetRequest?.br_status || '';
  const status = toTitleCase(apiStatus || 'draft');
  const isEditable = ['draft', 'rejected'].includes(String(apiStatus || '').toLowerCase());

  const [strTitle, setStrTitle] = useState('');
  const [strUnit, setStrUnit] = useState('');
  const [strDescription, setStrDescription] = useState('');
  const [strFiscalYear, setStrFiscalYear] = useState('');
  const [strPlanningPeriod, setStrPlanningPeriod] = useState(DEFAULT_PLANNING_PERIOD_ID);
  const [strComment, setStrComment] = useState('');
  const [strFormSchemaId, setStrFormSchemaId] = useState('');
  const [strFormEntryId, setStrFormEntryId] = useState('');
  const [arrAttachedForms, setArrAttachedForms] = useState([]);
  const [arrAttachedFiles, setArrAttachedFiles] = useState([]);
  const attachedFileUrlRef = useRef(new Set());
  const [blnIsConfirmActionModalOpen, setBlnIsConfirmActionModalOpen] = useState(false);
  const [blnIsBackConfirmModalOpen, setBlnIsBackConfirmModalOpen] = useState(false);
  const [blnIsConfirmActionProcessing, setBlnIsConfirmActionProcessing] = useState(false);
  const [arrLineItems, setArrLineItems] = useState([]);
  const [strOriginalTitle, setStrOriginalTitle] = useState('');
  const [arrInitialLineItems, setArrInitialLineItems] = useState([]);
  const [arrInitialAttachedFiles, setArrInitialAttachedFiles] = useState([]);
  const [objErrors, setObjErrors] = useState({});
  const [arrRawItems, setArrRawItems] = useState([]);
  const [arrActivityLogs, setArrActivityLogs] = useState([]);
  const [arrVersions, setArrVersions] = useState([]);
  const [strActiveTab, setStrActiveTab] = useState('overview');
  const normalizedStatus = String(apiStatus || '').toLowerCase();
  const isPendingStatus = ['submitted', 'pending'].includes(normalizedStatus);
  const canCancelRequest = normalizedStatus === 'draft' || normalizedStatus === 'rejected';
  const isCloseOnlyStatus = ['submitted', 'pending', 'approved', 'reviewed', 'consolidated', 'cancelled'].includes(normalizedStatus);
  const primaryActionLabel = 'Submit for Review';
  const dangerActionLabel = 'Cancel Request';
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
  const hasUnsavedChanges = useMemo(() => {
    if (!objBudgetRequest) return false;

    const strOriginalUnit = String(
      objBudgetRequest.br_requesting_unit_id ?? objBudgetRequest.requesting_unit?.ru_id ?? ''
    );
    const strOriginalFiscalYear = String(
      objBudgetRequest.br_fiscal_year_id ?? objBudgetRequest.fiscal_year?.fy_id ?? ''
    );
    const strOriginalPlanningPeriod = String(
      objBudgetRequest.br_planning_period_id ??
      objBudgetRequest.planning_period?.pp_id ??
      DEFAULT_PLANNING_PERIOD_ID
    );

    const hasHeaderChanges =
      (strTitle.trim() !== strOriginalTitle.trim()) ||
      (String(strUnit || '') !== strOriginalUnit) ||
      (String(strDescription || '').trim() !== String(objBudgetRequest.br_description || '').trim()) ||
      (String(strFiscalYear || '') !== strOriginalFiscalYear) ||
      (String(strPlanningPeriod || '') !== strOriginalPlanningPeriod) ||
      (JSON.stringify(arrAttachedForms) !== JSON.stringify(objBudgetRequest.br_form_entries || [])) ||
      (JSON.stringify(arrAttachedFiles) !== JSON.stringify(arrInitialAttachedFiles)) ||
      (String(strComment || '').trim() !== '');

    if (hasHeaderChanges) return true;

    return JSON.stringify(arrLineItems) !== JSON.stringify(arrInitialLineItems);
  }, [objBudgetRequest, strTitle, strOriginalTitle, strUnit, strDescription, strFiscalYear, strPlanningPeriod, arrAttachedForms, arrAttachedFiles, arrInitialAttachedFiles, strComment, arrLineItems, arrInitialLineItems]);
  const [arrFiscalYears, setArrFiscalYears] = useState([]);
  const [arrPlanningPeriods, setArrPlanningPeriods] = useState([]);
  const [arrRequestingUnits, setArrRequestingUnits] = useState([]);
  const [arrFormSchemas, setArrFormSchemas] = useState([]);
  const [arrFormEntries, setArrFormEntries] = useState([]);
  const fiscalYearOptions = useMemo(
    () => buildFiscalYearDropdownOptions(arrFiscalYears),
    [arrFiscalYears]
  );

  const planningPeriodOptions = useMemo(
    () => buildPlanningPeriodDropdownOptions(arrPlanningPeriods),
    [arrPlanningPeriods]
  );

  const planningPeriodAllowedIds = useMemo(
    () => planningPeriodOptions.map((opt) => String(opt.value)),
    [planningPeriodOptions]
  );

  const requestingUnitOptions = useMemo(
    () => buildRequestingUnitDropdownOptions(arrRequestingUnits),
    [arrRequestingUnits]
  );

  const formSchemaOptions = useMemo(
    () => [
      { value: '', label: 'No attached form' },
      ...arrFormSchemas.map((schema) => ({ value: schema.id, label: schema.name || schema.id })),
    ],
    [arrFormSchemas]
  );

  const formEntryOptions = useMemo(
    () => [
      { value: '', label: strFormSchemaId ? 'No specific entry' : 'Select a form type first' },
      ...arrFormEntries.map((entry) => ({
        value: entry.id,
        label: `${getEntryDisplayName(entry)} (${entry.status || 'draft'})`,
      })),
    ],
    [arrFormEntries, strFormSchemaId]
  );

  const [arrBudgetCategories, setArrBudgetCategories] = useState([]);

  const budgetCategoryOptions = useMemo(
    () => buildBudgetCategoryDropdownOptions(arrBudgetCategories),
    [arrBudgetCategories]
  );

  const categoryIdToCode = useMemo(
    () => buildCategoryIdToCodeMap(arrBudgetCategories),
    [arrBudgetCategories]
  );

  const categoryCodeToId = useMemo(
    () => buildCategoryCodeToIdMap(arrBudgetCategories),
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

  const mapItemUiToApi = (objItem) => ({
    ...(objItem?.id ? { bri_id: Number(objItem.id) } : {}),
    bri_category_id: categoryCodeToId.get(String(objItem?.category || '').trim()) || null,
    bri_cost_structure: String(objItem?.costStructure || '').trim(),
    bri_description: String(objItem?.name || '').trim(),
    bri_justification: String(objItem?.justification || '').trim() || null,
    bri_planned_amount:
      objItem?.amount === '' || objItem?.amount === null || typeof objItem?.amount === 'undefined'
        ? null
        : Number(objItem.amount),
    bri_sort_order: Number(objItem?.sortOrder ?? 0),
  });

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

    const loadFormSchemas = async () => {
      await seedDefaultSchemas().catch(() => { });
      const arrData = await fetchAllSchemas();
      if (!isMounted) return;
      setArrFormSchemas(Array.isArray(arrData) ? arrData : []);
    };

    const loadBudgetRequest = async () => {
      setBlnIsLoading(true);
      const objResult = await getBudgetRequestById(Number(id));
      const data = objResult?.data ?? null;
      const arrItemsFromShow = Array.isArray(data?.items) ? data.items : null;
      const arrItems = arrItemsFromShow !== null ? arrItemsFromShow : [];

      if (!isMounted) return;

      setObjBudgetRequest(data);
      if (data) {
        const fiscalYearId =
          data.br_fiscal_year_id ??
          data.fiscal_year?.fy_id ??
          '';

        const planningPeriodId =
          data.br_planning_period_id ??
          data.planning_period?.pp_id ??
          DEFAULT_PLANNING_PERIOD_ID;

        setStrTitle(data.br_title || '');
        setStrOriginalTitle(data.br_title || '');
        setStrUnit(String(data.br_requesting_unit_id ?? data.requesting_unit?.ru_id ?? ''));
        setStrDescription(data.br_description || '');
        setStrFiscalYear(String(fiscalYearId));
        setStrPlanningPeriod(String(planningPeriodId));
        setArrAttachedForms(Array.isArray(data.br_form_entries)
          ? data.br_form_entries
          : (data.br_form_entry_id ? [{ schemaId: data.br_form_schema_id || '', entryId: data.br_form_entry_id }] : []));
        setArrAttachedFiles(Array.isArray(data.br_attached_files) ? data.br_attached_files : []);
        setArrInitialAttachedFiles(Array.isArray(data.br_attached_files) ? data.br_attached_files : []);
        setStrComment('');

        setArrRawItems(Array.isArray(arrItems) ? arrItems : []);
      }
      setBlnIsLoading(false);
    };

    const loadActivity = async () => {
      try {
        const res = await getBudgetRequestActivity(Number(id));
        if (!isMounted) return;
        setArrActivityLogs(Array.isArray(res?.data) ? res.data : []);
      } catch { /* non-critical */ }
    };

    const loadVersions = async () => {
      try {
        const res = await getBudgetRequestVersions(Number(id));
        if (!isMounted) return;
        setArrVersions(Array.isArray(res?.data) ? res.data : []);
      } catch { /* non-critical */ }
    };

    loadFiscalYears();
    loadPlanningPeriods();
    loadRequestingUnits();
    loadBudgetCategories();
    loadFormSchemas();
    loadBudgetRequest();
    loadActivity();
    loadVersions();
    return () => {
      isMounted = false;
    };
  }, [id]);

  useEffect(() => {
    const mapped = arrRawItems.map(mapItemApiToUi);
    setArrLineItems(mapped);
    setArrInitialLineItems(mapped);
  }, [arrRawItems, mapItemApiToUi]);

  useEffect(() => {
    let isMounted = true;

    if (!strFormSchemaId) {
      setArrFormEntries([]);
      setStrFormEntryId('');
      return () => { isMounted = false; };
    }

    fetchEntriesBySchema(strFormSchemaId)
      .then((rows) => {
        if (!isMounted) return;
        const arrRows = Array.isArray(rows) ? rows : (Array.isArray(rows?.data) ? rows.data : []);
        setArrFormEntries(arrRows);
        setStrFormEntryId((prev) => arrRows.some((entry) => entry.id === prev) ? prev : '');
      })
      .catch(() => {
        if (!isMounted) return;
        setArrFormEntries([]);
      });

    return () => { isMounted = false; };
  }, [strFormSchemaId]);

  const { psTotal, mooeTotal, coTotal, tagTotal, grandTotal } = useMemo(
    () => computeBudgetLineItemTotals(arrLineItems),
    [arrLineItems]
  );

  // All validation failures result in rejection.
  // requireLineItems=false > Save Draft (line items optional)
  // requireLineItems=true  > Submit / Resubmit (at least one complete item required)
  // Security validation runs first; business rules are layered on top.
  const validate = (requireLineItems) => {
    const validationErrors = validateBudgetRequestForm({
      title: strTitle,
      unit: strUnit,
      description: strDescription,
      fiscalYear: strFiscalYear,
      planningPeriod: strPlanningPeriod,
      planningPeriodAllowedIds,
      lineItems: arrLineItems,
      comment: strComment,
      requireLineItems,
    });

    // Title is locked for submitted/pending requests but free to change when rejected.
    const titleLocked = !['rejected'].includes(normalizedStatus);
    if (titleLocked && !validationErrors.strTitle && strTitle.trim() !== strOriginalTitle.trim()) {
      validationErrors.strTitle = 'Title cannot be changed after the request has been submitted.';
    }

    setObjErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  };

  const mapBackendValidationErrors = (backendErrors) => {
    setObjErrors((prev) => mergeBackendBudgetRequestValidationErrors(prev, backendErrors));
  };

  const handleApiError = (err) => {
    const statusCode = err?.response?.status;

    if (statusCode === 401) {
      navigate('/login', { replace: true });
      return true;
    }

    if (statusCode === 422) {
      mapBackendValidationErrors(err?.response?.data?.objErrors);
      return true;
    }

    return false;
  };

  const handleSaveDraft = async () => {
    if (!objBudgetRequest) return;
    if (!validate(false)) return;

    try {
      await updateBudgetRequest(Number(id), {
        br_title: strTitle.trim(),
        br_requesting_unit_id: Number(strUnit),
        br_description: strDescription.trim() || null,
        br_fiscal_year_id: strFiscalYear === '' ? null : Number(strFiscalYear),
        br_planning_period_id: Number(strPlanningPeriod || DEFAULT_PLANNING_PERIOD_ID),
        br_form_entries: arrAttachedForms,
        br_form_schema_id: arrAttachedForms[0]?.schemaId || null,
        br_form_entry_id: arrAttachedForms[0]?.entryId || null,
        br_attached_files: arrAttachedFiles.map((file) => ({
          id: file.id,
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified,
          dataUrl: file.dataUrl,
          url: file.url,
        })),
        items: arrLineItems.map((objItem, idx) => mapItemUiToApi({ ...objItem, sortOrder: idx + 1 })),
      });

      const refreshedEnvelope = await getBudgetRequestById(Number(id));
      const refreshed = refreshedEnvelope?.data ?? null;

      if (refreshed) {
        setObjBudgetRequest(refreshed);
        setStrTitle(refreshed.br_title || '');
        setStrOriginalTitle(refreshed.br_title || '');
        setStrUnit(String(refreshed.br_requesting_unit_id ?? refreshed.requesting_unit?.ru_id ?? ''));
        setStrDescription(refreshed.br_description || '');
        setStrFiscalYear(String(refreshed.br_fiscal_year_id ?? ''));
        setStrPlanningPeriod(String(
          refreshed.br_planning_period_id ??
          refreshed.planning_period?.pp_id ??
          DEFAULT_PLANNING_PERIOD_ID
        ));
        setArrAttachedForms(Array.isArray(refreshed.br_form_entries)
          ? refreshed.br_form_entries
          : (refreshed.br_form_entry_id ? [{ schemaId: refreshed.br_form_schema_id || '', entryId: refreshed.br_form_entry_id }] : []));
        setArrAttachedFiles(Array.isArray(refreshed.br_attached_files) ? refreshed.br_attached_files : []);
        setArrInitialAttachedFiles(Array.isArray(refreshed.br_attached_files) ? refreshed.br_attached_files : []);
        setStrComment('');
        setArrRawItems(Array.isArray(refreshed.items) ? refreshed.items : []);
        setObjErrors({});
      }
    } catch (err) {
      if (!handleApiError(err)) {
        throw err;
      }
    }

    showToast({ message: 'Changes saved successfully.' });
  };

  const handleCancelRequest = async () => {
    if (!objBudgetRequest) return;

    if (!canCancelRequest) {
      navigate('/budget-requests');
      return;
    }

    try {
      await updateBudgetRequest(Number(id), { br_status: 'cancelled' });
      navigate('/budget-requests');
    } catch (err) {
      if (!handleApiError(err)) {
        window.alert('Cannot perform transaction. Error encountered.');
      }
    }
  };

  const openConfirmActionModal = () => {
    setBlnIsConfirmActionModalOpen(true);
  };

  const closeConfirmActionModal = () => {
    if (blnIsConfirmActionProcessing) return;
    setBlnIsConfirmActionModalOpen(false);
  };

  const handleConfirmCancelRequest = async () => {
    setBlnIsConfirmActionProcessing(true);
    try {
      await handleCancelRequest();
      setBlnIsConfirmActionModalOpen(false);
    } finally {
      setBlnIsConfirmActionProcessing(false);
    }
  };

  const handlePrimaryAction = async () => {
    if (!objBudgetRequest) return;
    if (!validate(true)) return;

    try {
      await handleSaveDraft();
      await submitBudgetRequest(Number(id), { actor_id: user?.usr_id ?? user?.id ?? null });
      const vRes = await getBudgetRequestVersions(Number(id));
      setArrVersions(Array.isArray(vRes?.data) ? vRes.data : []);
      navigate(`/budget-requests/${id}`, { replace: true });
    } catch (err) {
      handleApiError(err);
    }
  };

  const {
    handleSharedFieldChange,
    handleSharedLineItemChange,
    handleAddNewItem,
    handleDeleteItem,
  } = useBudgetRequestFormHandlers({
    setTitle: setStrTitle,
    setUnit: setStrUnit,
    setDescription: setStrDescription,
    setFiscalYear: setStrFiscalYear,
    setPlanningPeriod: setStrPlanningPeriod,
    setComment: setStrComment,
    setLineItems: setArrLineItems,
    setErrors: setObjErrors,
    planningPeriodAllowedIds,
  });

  const handleAttachForm = () => {
    if (!strFormSchemaId || !strFormEntryId) return;
    if (arrAttachedForms.some((form) => form.entryId === strFormEntryId)) return;

    const schema = arrFormSchemas.find((item) => item.id === strFormSchemaId);
    const entry = arrFormEntries.find((item) => item.id === strFormEntryId);

    setArrAttachedForms((prev) => [
      ...prev,
      {
        schemaId: strFormSchemaId,
        schemaName: schema?.name || strFormSchemaId,
        entryId: strFormEntryId,
        entryLabel: getEntryDisplayName(entry, strFormEntryId),
        pdfUrl: entry?.pdfUrl || '',
        pdfGeneratedAt: entry?.pdfGeneratedAt || '',
      },
    ]);
    setStrFormEntryId('');
  };

  const handleDetachForm = (entryId) => {
    setArrAttachedForms((prev) => prev.filter((form) => form.entryId !== entryId));
  };

  const handleAttachFiles = async (event) => {
    const files = Array.from(event.target.files || []);

    if (files.length === 0) {
      return;
    }

    const preparedFiles = await Promise.all(files.map(async (file) => ({
      id: `${file.name}-${file.size}-${file.lastModified}`,
      name: file.name,
      size: file.size,
      type: file.type || 'File',
      lastModified: file.lastModified,
      previewUrl: URL.createObjectURL(file),
      dataUrl: await readFileAsDataUrl(file),
    })));

    setArrAttachedFiles((prevFiles) => {
      const nextFiles = [...prevFiles];
      const existingIds = new Set(prevFiles.map((file) => file.id));

      preparedFiles.forEach((file) => {
        if (!existingIds.has(file.id)) {
          attachedFileUrlRef.current.add(file.previewUrl);
          nextFiles.push(file);
          existingIds.add(file.id);
        } else {
          URL.revokeObjectURL(file.previewUrl);
        }
      });

      return nextFiles;
    });

    event.target.value = '';
  };

  const handleRemoveAttachedFile = (fileId) => {
    setArrAttachedFiles((prevFiles) => {
      const fileToRemove = prevFiles.find((file) => file.id === fileId);
      if (fileToRemove?.previewUrl) {
        URL.revokeObjectURL(fileToRemove.previewUrl);
        attachedFileUrlRef.current.delete(fileToRemove.previewUrl);
      }
      return prevFiles.filter((file) => file.id !== fileId);
    });
  };

  useEffect(() => () => {
    attachedFileUrlRef.current.forEach((previewUrl) => {
      URL.revokeObjectURL(previewUrl);
    });
    attachedFileUrlRef.current.clear();
  }, []);

  const handleAddNewItemClick = () =>
    handleAddNewItem(budgetCategoryOptions?.[0]?.value || 'PS');

  const handleBackToRequestList = () => {
    if (!hasUnsavedChanges) {
      navigate('/budget-requests');
      return;
    }
    setBlnIsBackConfirmModalOpen(true);
  };

  const closeBackConfirmModal = () => {
    setBlnIsBackConfirmModalOpen(false);
  };

  const confirmBackToRequestList = () => {
    setBlnIsBackConfirmModalOpen(false);
    navigate('/budget-requests');
  };

  if (blnIsLoading) {
    return <div className="p-4">Loading budget request...</div>;
  }

  if (!objBudgetRequest) {
    return (
      <div className="p-4">
        <h5 className="mb-2">Budget request not found.</h5>
        <Button variant="outline" size="sm" onClick={() => navigate('/budget-requests')}>
          Back to list
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="d-flex align-items-center gap-2 px-4 py-3 border-bottom">
        <Button variant="ghost" size="sm" onClick={handleBackToRequestList} leftIcon={<BsArrowLeft />}>
          Back
        </Button>
        <h5 className="mb-0 fw-semibold">Edit Budget Request</h5>
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
            {arrAttachedFiles.length > 0 ? (
              <span className="badge rounded-pill text-bg-light border ms-2">{arrAttachedFiles.length}</span>
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
            {arrVersions.length > 0 && (
              <span className="badge bg-secondary ms-1" style={{ fontSize: '11px' }}>{arrVersions.length}</span>
            )}
          </button>
        </li>
      </ul>

      {strActiveTab === 'versions' && (
        <BudgetRequestVersionsTab versions={arrVersions} />
      )}

      {strActiveTab === 'overview' && <BudgetRequestForm
        mode={isEditable ? 'edit' : 'view'}
        isEditable={isEditable}
        formData={{
          title: strTitle,
          unit: strUnit,
          description: strDescription,
          fiscalYear: strFiscalYear,
          planningPeriod: strPlanningPeriod,
          comment: isEditable ? strComment : (objBudgetRequest?.br_review_comment || strComment),
          status,
          referenceCode: String(objBudgetRequest?.br_reference_no || objBudgetRequest?.br_id || ''),
          currentVersionNumber: objBudgetRequest?.br_current_version_number ?? null,
        }}
        maxLengths={MAX_LENGTHS}
        errors={objErrors}
        fiscalYearOptions={fiscalYearOptions}
        planningPeriodOptions={planningPeriodOptions}
        requestingUnitOptions={requestingUnitOptions}
        budgetCategoryOptions={budgetCategoryOptions}
        formSchemaOptions={formSchemaOptions}
        formEntryOptions={formEntryOptions}
        attachedForms={arrAttachedForms}
        selectedFormSchemaId={strFormSchemaId}
        selectedFormEntryId={strFormEntryId}
        onSelectedFormSchemaChange={setStrFormSchemaId}
        onSelectedFormEntryChange={setStrFormEntryId}
        onAttachForm={handleAttachForm}
        onDetachForm={handleDetachForm}
        lineItems={arrLineItems}
        totals={{ psTotal, mooeTotal, coTotal, tagTotal, grandTotal }}
        workflowSteps={workflowSteps}
        sidebarTopContent={reviewCommentBanner}
        actions={
          isPendingStatus
            ? []
            :
            isCloseOnlyStatus
              ? [
                canCancelRequest
                  ? { label: 'Cancel Request', variant: 'outline', onClick: openConfirmActionModal }
                  : { label: 'Close', variant: 'outline', onClick: () => navigate('/budget-requests') },
              ]
              : [
                {
                  label: primaryActionLabel,
                  leftIcon: <BsSend />,
                  onClick: handlePrimaryAction,
                  disabled: !isEditable,
                },
                { label: 'Save Request', variant: 'outline', onClick: handleSaveDraft, disabled: !isEditable },
                {
                  label: dangerActionLabel,
                  variant: 'danger',
                  leftIcon: <BsXCircle />,
                  onClick: openConfirmActionModal,
                  disabled: !isEditable,
                },
              ]
        }
        onFieldChange={handleSharedFieldChange}
        onLineItemChange={handleSharedLineItemChange}
        onAddLineItem={handleAddNewItemClick}
        onDeleteLineItem={handleDeleteItem}
        formatCurrency={formatBudgetRequestCurrency}
        showAttachedFormsSection={false}
      />}

      {strActiveTab === 'attached-forms' && (
        <BudgetRequestAttachedFormsTab
          canEdit={isEditable}
          title="Attached Forms"
          attachmentMode="both"
          formSchemaOptions={formSchemaOptions}
          formEntryOptions={formEntryOptions}
          selectedFormSchemaId={strFormSchemaId}
          selectedFormEntryId={strFormEntryId}
          onSelectedFormSchemaChange={setStrFormSchemaId}
          onSelectedFormEntryChange={setStrFormEntryId}
          onAttachForm={handleAttachForm}
          onDetachForm={handleDetachForm}
          attachedForms={arrAttachedForms}
          attachedFiles={arrAttachedFiles}
          onAttachFiles={handleAttachFiles}
          onDetachFile={handleRemoveAttachedFile}
        />
      )}

      <Modal
        open={blnIsConfirmActionModalOpen}
        onClose={closeConfirmActionModal}
        title="Cancel Budget Request?"
        size="md"
        footer={(
          <div className="d-grid d-sm-flex justify-content-sm-end gap-2 w-100">
            <Button
              variant="secondary"
              onClick={closeConfirmActionModal}
              disabled={blnIsConfirmActionProcessing}
            >
              Keep Editing
            </Button>
            <Button
              variant="danger"
              onClick={handleConfirmCancelRequest}
              disabled={blnIsConfirmActionProcessing}
            >
              {blnIsConfirmActionProcessing
                ? 'Cancelling...'
                : 'Cancel Request'}
            </Button>
          </div>
        )}
      >
        <p className="mb-0">
          {canCancelRequest
            ? 'This will mark the budget request as cancelled.'
            : 'This budget request is already cancelled. Return to the request list?'}
        </p>
      </Modal>

      <Modal
        open={blnIsBackConfirmModalOpen}
        onClose={closeBackConfirmModal}
        title="Leave without saving?"
        size="md"
        footer={(
          <div className="d-grid d-sm-flex justify-content-sm-end gap-2 w-100">
            <Button variant="secondary" onClick={closeBackConfirmModal}>
              Stay
            </Button>
            <Button variant="danger" onClick={confirmBackToRequestList}>
              Leave without Saving
            </Button>
          </div>
        )}
      >
        <p className="mb-0">
          Unsaved changes may be lost. Are you sure you want to leave this page?
        </p>
      </Modal>
    </>
  );
}
