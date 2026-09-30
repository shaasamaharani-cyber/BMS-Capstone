/**
 * System Name: Budget Management System
 * Module Name: Core Module
 *
 * Purpose of this file:
 * Multi-step creation page for a new budget request — collects general info, line items, and attached forms before submission.
 *
 * Author(s): QUT Group 27
 *
 * Copyright (C) 2026
 * by the Department of Science and Technology - Central Office
 * Developed by Team 27, Queensland University of Technology
 * All rights reserved.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BsArrowLeft,
  BsSend,
  BsXCircle,
} from 'react-icons/bs';
import {
  createBudgetRequest,
  createBudgetRequestItem,
  getBudgetCategories,
  getFiscalYears,
  getPlanningPeriods,
  getRequestingUnits,
  submitBudgetRequest,
  updateBudgetRequest,
} from '../../api';
import { fetchAllSchemas, fetchEntriesBySchema } from '../../api/forms_api';
import { getEntryDisplayName } from '../../forms/utils/form_object';
import { seedDefaultSchemas } from '../../forms/utils/seed_default_schemas';
import { Button, Modal, useToast } from '../../components/ui';
import BudgetRequestForm from '../../components/form/budget_request_form';
import BudgetRequestAttachedFormsTab from '../../components/form/budget_request_attached_forms_tab';
import { getWorkflowSteps } from '../../utils/budget_request_workflow_utils';
import { DEFAULT_COST_STRUCTURE } from '../../utils/cost_structure';
import { useAuth } from '../../context/auth_context';
import { getScopedRequestingUnitId } from '../../utils/requesting_unit_scope';
import { readFileAsDataUrl } from '../../utils/helpers';

import { useBudgetRequestFormHandlers } from './hooks/use_budget_request_form_handlers';
import {
  buildBudgetCategoryDropdownOptions,
  buildCategoryCodeToIdMap,
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
  getBudgetRequestPageTimestamp,
  mergeBackendBudgetRequestValidationErrors,
  toWorkflowDateLabel,
} from '../../utils/budget_request_utils';

import {
  validateBudgetRequestForm,
  MAX_LENGTHS,
} from '../../utils/input_validation';

// Default values for line items
const initialLineItems = [
  {
    id: 1,
    name: '',
    category: 'PS',
    costStructure: DEFAULT_COST_STRUCTURE,
    amount: '',
    justification: '',
  },
  {
    id: 2,
    name: '',
    category: 'MOOE',
    costStructure: DEFAULT_COST_STRUCTURE,
    amount: '',
    justification: '',
  },
  {
    id: 3,
    name: '',
    category: 'CO',
    costStructure: DEFAULT_COST_STRUCTURE,
    amount: '',
    justification: '',
  },
  {
    id: 4,
    name: '',
    category: 'TAG',
    costStructure: DEFAULT_COST_STRUCTURE,
    amount: '',
    justification: '',
  }
];



export default function NewBudgetRequest() {
  // Navigation
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user } = useAuth();
  const [blnIsBackConfirmModalOpen, setBlnIsBackConfirmModalOpen] = useState(false);
  const [blnIsConfirmActionModalOpen, setBlnIsConfirmActionModalOpen] = useState(false);
  const [blnIsConfirmActionProcessing, setBlnIsConfirmActionProcessing] = useState(false);
  const [strActiveTab, setStrActiveTab] = useState('overview');
  
  // Form state
  const [strTitle, setStrTitle] = useState('');
  const [strUnit, setStrUnit] = useState('');
  const [strDescription, setStrDescription] = useState('');
  const [strFiscalYearId, setStrFiscalYearId] = useState('');
  const [strPlanningPeriodId, setStrPlanningPeriodId] = useState(DEFAULT_PLANNING_PERIOD_ID);
  const [strComment, setStrComment] = useState('');
  const [strFormSchemaId, setStrFormSchemaId] = useState('');
  const [strFormEntryId, setStrFormEntryId] = useState('');
  const [arrAttachedForms, setArrAttachedForms] = useState([]);
  const [arrAttachedFiles, setArrAttachedFiles] = useState([]);
  const attachedFileUrlRef = useRef(new Set());
  const [arrLineItems, setArrLineItems] = useState(initialLineItems);

  // Draft state
  const [strDraftCode, setStrDraftCode] = useState('');
  const [intRequestId, setIntRequestId] = useState(null);
  const canCancelRequest = intRequestId != null;

  // UI state
  const [strCurrentStatus, setStrCurrentStatus] = useState('Draft');
  const [strLastUpdated, setStrLastUpdated] = useState(getBudgetRequestPageTimestamp());
  const [objErrors, setObjErrors] = useState({});
  const [blnIsSaving, setBlnIsSaving] = useState(false);
  const [blnIsSubmitting, setBlnIsSubmitting] = useState(false);

  // Fetch dropdown data from API
  const [arrFiscalYears, setArrFiscalYears] = useState([]);
  const [arrPlanningPeriods, setArrPlanningPeriods] = useState([]);
  const [arrRequestingUnits, setArrRequestingUnits] = useState([]);
  const [arrBudgetCategories, setArrBudgetCategories] = useState([]);
  const [arrFormSchemas, setArrFormSchemas] = useState([]);
  const [arrFormEntries, setArrFormEntries] = useState([]);

  const budgetCategoryOptions = useMemo(
    () => buildBudgetCategoryDropdownOptions(arrBudgetCategories),
    [arrBudgetCategories]
  );

  const categoryCodeToId = useMemo(
    () => buildCategoryCodeToIdMap(arrBudgetCategories),
    [arrBudgetCategories]
  );

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

  const intScopedUnitId = useMemo(() => getScopedRequestingUnitId(user), [user]);

  const requestingUnitOptions = useMemo(
    () => buildRequestingUnitDropdownOptions(arrRequestingUnits),
    [arrRequestingUnits]
  );

  useEffect(() => {
    if (intScopedUnitId != null) {
      setStrUnit(String(intScopedUnitId));
    }
  }, [intScopedUnitId]);

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

  // Workflow steps for budget request
  const workflowSteps = useMemo(
    () => getWorkflowSteps(strCurrentStatus, '', toWorkflowDateLabel(strLastUpdated)),
    [strCurrentStatus, strLastUpdated]
  );

  // Check if there are unsaved changes
  const hasUnsavedChanges = useMemo(() => {
    const hasHeaderChanges =
      (String(strTitle || '').trim() !== '') ||
      (String(strUnit || '').trim() !== '') ||
      (String(strDescription || '').trim() !== '') ||
      (String(strFiscalYearId || '').trim() !== '') ||
      (String(strPlanningPeriodId || '').trim() !== String(DEFAULT_PLANNING_PERIOD_ID)) ||
      (arrAttachedForms.length > 0) ||
      (arrAttachedFiles.length > 0) ||
      (String(strComment || '').trim() !== '');

    if (hasHeaderChanges) return true;

    return JSON.stringify(arrLineItems) !== JSON.stringify(initialLineItems);
  }, [strTitle, strUnit, strDescription, strFiscalYearId, strPlanningPeriodId, arrAttachedForms, arrAttachedFiles, strComment, arrLineItems]);

  // Load dropdown data from API
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
      await seedDefaultSchemas().catch(() => {});
      const arrData = await fetchAllSchemas();
      if (!isMounted) return;
      setArrFormSchemas(Array.isArray(arrData) ? arrData : []);
    };

    loadFiscalYears();
    loadPlanningPeriods();
    loadRequestingUnits();
    loadBudgetCategories();
    loadFormSchemas();
    return () => {
      isMounted = false;
    };
  }, []);

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

  // Validate form data
  // requireLineItems=false > Save Draft (line items optional)
  // requireLineItems=true  > Submit for Review (at least one complete item required)
  const validate = (requireLineItems) => {
    const validationErrors = validateBudgetRequestForm({
      title: strTitle,
      unit: strUnit,
      description: strDescription,
      fiscalYear: strFiscalYearId,
      planningPeriod: strPlanningPeriodId,
      planningPeriodAllowedIds,
      lineItems: arrLineItems,
      comment: strComment,
      requireLineItems,
    });
    setObjErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  };

  const mapBackendValidationErrors = (backendErrors) => {
    setObjErrors((prev) => mergeBackendBudgetRequestValidationErrors(prev, backendErrors));
  };

  const handleApiError = (err) => {
    const status = err?.response?.status;

    if (status === 401) {
      navigate('/login', { replace: true });
      return true;
    }

    if (status === 422) {
      mapBackendValidationErrors(err?.response?.data?.objErrors);
      return true;
    }

    showToast({ message: 'Cannot perform transaction. Error encountered.', variant: 'danger' });
    return true;
  };

  // Build items payload for backend API
  const buildItemsPayload = () => {
    const completeItems = arrLineItems.filter((item) =>
      String(item.name || '').trim() !== '' &&
      String(item.category || '').trim() !== ''
    );

    return completeItems.map((item, idx) => ({
      bri_category_id: categoryCodeToId.get(String(item.category || '').trim()) || null,
      bri_cost_structure: String(item.costStructure || '').trim(),
      bri_description: String(item.name || '').trim(),
      bri_justification: String(item.justification || '').trim() || null,
      bri_planned_amount: item.amount === '' ? null : Number(item.amount),
      bri_sort_order: idx + 1,
    }));
  };

  const persistBudgetRequest = async (options = {}) => {
    const { includeItems = false } = options;

    const payload = {
      br_fiscal_year_id: Number(strFiscalYearId),
      br_planning_period_id: Number(strPlanningPeriodId || DEFAULT_PLANNING_PERIOD_ID),
      br_title: strTitle.trim(),
      br_description: strDescription.trim() || null,
      br_requesting_unit_id: Number(strUnit),
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
      ...(includeItems ? { items: buildItemsPayload() } : {}),
    };

    const res = await createBudgetRequest(payload);

    const brId = res?.data?.br_id ?? null;
    if (brId) {
      setIntRequestId(brId);
    }

    const referenceNo = res?.data?.br_reference_no ?? '';
    if (referenceNo) {
      setStrDraftCode(String(referenceNo));
    }

    return brId;
  };

  const persistLineItems = async (brId) => {
    const completeItems = arrLineItems.filter((item) =>
      String(item.name || '').trim() !== '' &&
      String(item.category || '').trim() !== ''
    );

    for (let i = 0; i < completeItems.length; i += 1) {
      const item = completeItems[i];
      const categoryId = categoryCodeToId.get(String(item.category || '').trim()) || null;

      await createBudgetRequestItem(brId, {
        bri_category_id: categoryId,
        bri_cost_structure: String(item.costStructure || '').trim(),
        bri_description: String(item.name || '').trim(),
        bri_justification: String(item.justification || '').trim() || null,
        bri_planned_amount: item.amount === '' ? null : Number(item.amount),
        bri_sort_order: i + 1,
      });
    }
  };

  // Handle save draft
  const handleSaveDraft = async () => {
    if (blnIsSaving) return;
    if (!validate(false)) return;
    setBlnIsSaving(true);

    try {
      const brId = await persistBudgetRequest({ includeItems: true });
      setStrCurrentStatus('Draft');
      setStrLastUpdated(getBudgetRequestPageTimestamp());
      showToast({ message: 'Draft saved successfully.' });
      if (brId) {
        navigate(`/budget-requests/${brId}/edit`);
      }
    } catch (err) {
      handleApiError(err);
    } finally {
      setBlnIsSaving(false);
    }
  };

  // Handle submit for review
  const handleSubmitForReview = async () => {
    if (blnIsSubmitting) return;
    if (!validate(true)) return;
    setBlnIsSubmitting(true);

    try {
      // If this is the first submit and we have no saved draft yet, create request + items in one call.
      const brId = intRequestId ?? (await persistBudgetRequest({ includeItems: true }));

      if (brId) {
        // If a draft was already created earlier, we still need to create items via item endpoints.
        if (intRequestId) {
          await persistLineItems(brId);
        }
        await submitBudgetRequest(brId, { actor_id: user?.usr_id ?? user?.id ?? null });
      }

      setStrCurrentStatus('Submitted');
      setStrLastUpdated(getBudgetRequestPageTimestamp());
      showToast({ message: 'Submitted for review successfully.' });
      navigate('/budget-requests');
    } catch (err) {
      handleApiError(err);
    } finally {
      setBlnIsSubmitting(false);
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
    setFiscalYear: setStrFiscalYearId,
    setPlanningPeriod: setStrPlanningPeriodId,
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

  const handleCancelRequest = async () => {
    if (!canCancelRequest) {
      navigate('/budget-requests');
      return;
    }

    try {
      await updateBudgetRequest(Number(intRequestId), { br_status: 'cancelled' });
      navigate('/budget-requests');
    } catch (err) {
      const status = err?.response?.status;
      if (status === 401) {
        navigate('/login', { replace: true });
        return;
      }
      window.alert('Cannot perform transaction. Error encountered.');
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

  return (
    <>
      <div className="d-flex align-items-center gap-2 px-4 py-3 border-bottom">
        <Button variant="ghost" size="sm" onClick={handleBackToRequestList} leftIcon={<BsArrowLeft />}>
          Back
        </Button>
        <h5 className="mb-0 fw-semibold">New Budget Request</h5>
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
      </ul>

      {strActiveTab === 'overview' ? <BudgetRequestForm
        mode="create"
        isEditable
        formData={{
          title: strTitle,
          unit: strUnit,
          description: strDescription,
          fiscalYear: strFiscalYearId,
          planningPeriod: strPlanningPeriodId,
          comment: strComment,
          status: strCurrentStatus,
          referenceCode: strDraftCode || 'Will be generated after save',
          currentVersionNumber: null,
        }}
        maxLengths={MAX_LENGTHS}
        errors={objErrors}
        fiscalYearOptions={fiscalYearOptions}
        planningPeriodOptions={planningPeriodOptions}
        requestingUnitOptions={requestingUnitOptions}
        unitFieldDisabled={intScopedUnitId != null}
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
        actions={[
          {
            label: 'Submit for Review',
            leftIcon: <BsSend />,
            onClick: handleSubmitForReview,
            disabled: blnIsSubmitting || blnIsSaving,
          },
          {
            label: 'Save Request',
            variant: 'outline',
            onClick: handleSaveDraft,
            disabled: blnIsSubmitting || blnIsSaving,
          },
          {
            label: 'Cancel Request',
            variant: 'danger',
            leftIcon: <BsXCircle />,
            onClick: openConfirmActionModal,
            disabled: blnIsSubmitting || blnIsSaving,
          },
        ]}
        onFieldChange={handleSharedFieldChange}
        onLineItemChange={handleSharedLineItemChange}
        onAddLineItem={handleAddNewItemClick}
        onDeleteLineItem={handleDeleteItem}
        formatCurrency={formatBudgetRequestCurrency}
        showAttachedFormsSection={false}
      /> : (
        <BudgetRequestAttachedFormsTab
          canEdit
          title="Attached Forms"
          attachmentMode="both"
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
              {blnIsConfirmActionProcessing ? 'Cancelling...' : 'Cancel Request'}
            </Button>
          </div>
        )}
      >
        <p className="mb-0">
          {canCancelRequest
            ? 'This will mark the budget request as cancelled.'
            : 'This request has not been saved yet. Leave this page without creating it?'}
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
