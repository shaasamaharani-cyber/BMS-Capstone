/**
 * System Name: Budget Management System
 * Module Name: Core Module
 *
 * Purpose of this file:
 * Edit page for a draft unified budget consolidation — updates consolidated line items, attached forms, and resubmits.
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
import { BsArrowLeft, BsSend, BsXCircle } from 'react-icons/bs';
import { Button, useToast } from '../../components/ui';
import BudgetConsolidationForm from '../../components/form/budget_consolidation_form';
import BudgetRequestAttachedFormsTab from '../../components/form/budget_request_attached_forms_tab';
import UnifiedBudgetVersionsTab from '../../components/form/unified_budget_versions_tab';
import { fetchAllSchemas, fetchEntriesBySchema } from '../../api/forms_api';
import { getEntryDisplayName } from '../../forms/utils/form_object';
import { seedDefaultSchemas } from '../../forms/utils/seed_default_schemas';
import { DEFAULT_COST_STRUCTURE, normalizeCostStructure } from '../../utils/cost_structure';
import {
  getUnifiedBudgetById,
  updateUnifiedBudget,
  getReviewedBudgetRequests,
  getBudgetRequestsByIds,
  getBudgetCategories,
  getBudgetRequestItems,
  getPlanningPeriods,
} from '../../api';
import {
  ALLOWED_FISCAL_YEARS,
  MAX_LENGTHS,
  validateTitle,
  validateUnit,
  validateDescription,
  validateFiscalYear,
  validatePlanningPeriod,
  validateComment,
  validateLineItemName,
  validateLineItemAmount,
  validateCostStructure,
  validateJustification,
} from '../../utils/input_validation';
import {
  applyUnifiedBudgetWorkflowAction,
  createApprovalVersionEntry,
  deriveUnifiedWorkflowStage,
  getActiveApprovalVersion,
  getUnifiedBudgetWorkflowActionForStep,
  isUnifiedBudgetTerminalApprovalAction,
  getUnifiedBudgetSubmitActionLabel,
  getUnifiedBudgetWorkflowSteps,
  getWorkflowActorNameFromUser,
  resolveUnifiedBudgetSubmitWorkflowAction,
} from '../../utils/workflow_utils';
import { useAuth } from '../../context/auth_context';
import { buildConsolidationLineRows } from '../../utils/consolidation_line_rows';
import { toAmount, toFiscalYear, getCurrentTimestamp, readFileAsDataUrl, getNextApprovalVersionNumber } from '../../utils/helpers';
import {
  ensureBudgetRequestSectionLinks,
  inferConsolidatedSourceItemId,
  markBudgetRequestsConsolidated,
  remapConsolidatedLineItemsAfterSave,
  syncConsolidatedLineItemsToBudgetRequests,
} from '../../utils/sync_consolidated_line_items_to_budget_requests';

import {
  DEFAULT_PLANNING_PERIOD_ID,
  buildPlanningPeriodDropdownOptions,
  fetchPlanningPeriodsForPage,
} from '../../utils/budget_request_utils';

const fmt = (n) => `₱ ${n.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;

const normalizeConsolidatedSections = (raw, fallbackRequestId = 'BR-UNKNOWN', fallbackUnit = 'Unknown Unit') => {
  if (!Array.isArray(raw)) return [];
  if (raw.length === 0) return [];

  const hasSectionShape = raw.some((entry) => Array.isArray(entry?.items));
  if (hasSectionShape) {
    return raw.map((section, sectionIdx) => ensureBudgetRequestSectionLinks({
      requestId: section.requestId || `${fallbackRequestId}-${sectionIdx + 1}`,
      requestTitle: section.requestTitle || 'Unified Source',
      requestingUnit: section.requestingUnit || fallbackUnit,
      sourceRequestId: section.sourceRequestId || section.originalRequestId || section.requestSourceId || '',
      items: (section.items || []).map((item, itemIdx) => ({
        id: item.id || `${section.requestId || fallbackRequestId}-${itemIdx + 1}`,
        sourceItemId: inferConsolidatedSourceItemId(item),
        budgetRequestItemId: inferConsolidatedSourceItemId(item),
        name: item.name ?? item.description ?? '',
        category: item.category || 'PS',
        costStructure: normalizeCostStructure(item.costStructure) || DEFAULT_COST_STRUCTURE,
        amount: toAmount(item.amount),
        justification: item.justification || '',
        requestId: item.requestId || section.requestId || fallbackRequestId,
        requestingUnit: item.requestingUnit || section.requestingUnit || fallbackUnit,
        sourceRequestId: item.sourceRequestId || section.sourceRequestId || '',
      })),
    }));
  }

  const onlyItems = raw.filter((row) => row?.rowType === 'item');
  const grouped = new Map();
  onlyItems.forEach((item, idx) => {
    const requestId = item.requestId || fallbackRequestId;
    const unit = item.requestingUnit || fallbackUnit;
    const key = `${requestId}::${unit}`;
    if (!grouped.has(key)) {
      grouped.set(key, {
        requestId,
        requestTitle: 'Unified Source',
        requestingUnit: unit,
        sourceRequestId: '',
        items: [],
      });
    }
    const budgetRequestItemId = inferConsolidatedSourceItemId(item);
    grouped.get(key).items.push({
      id: item.id || `${requestId}-${idx + 1}`,
      sourceItemId: budgetRequestItemId,
      budgetRequestItemId,
      name: item.name || '',
      category: item.category || 'PS',
      costStructure: normalizeCostStructure(item.costStructure) || DEFAULT_COST_STRUCTURE,
      amount: toAmount(item.amount),
      justification: item.justification || '',
      requestId,
      requestingUnit: unit,
      sourceRequestId: item.sourceRequestId || '',
    });
  });
  return Array.from(grouped.values()).map(ensureBudgetRequestSectionLinks);
};

const mapReviewedRequestToUi = (request) => ({
  id: request?.id ?? request?.br_id,
  code: request?.code ?? request?.br_reference_no ?? '',
  title: request?.title ?? request?.br_title ?? 'Untitled Request',
  unit: request?.unit ?? request?.requesting_unit?.ru_name ?? 'Unknown Unit',
  status: request?.status ?? request?.br_status ?? '',
});

const toApiRows = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};export default function EditBudgetConsolidation() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user } = useAuth();
  const { id } = useParams();

  const [blnIsLoading, setBlnIsLoading] = useState(true);
  const [objRecord, setObjRecord] = useState(null);

  const [strTitle, setStrTitle] = useState('');
  const [strUnit, setStrUnit] = useState('');
  const [strDescription, setStrDescription] = useState('');
  const [strFiscalYear, setStrFiscalYear] = useState('');
  const [strPlanningPeriod, setStrPlanningPeriod] = useState(DEFAULT_PLANNING_PERIOD_ID);
  const [strComment, setStrComment] = useState('');
  const [strStatus, setStrStatus] = useState('DRAFT');
  const [strRefCode, setStrRefCode] = useState('');
  const [strLastUpdated, setStrLastUpdated] = useState('');
  const [arrConsolidatedLineItems, setArrConsolidatedLineItems] = useState([]);
  const [arrReviewedRequestPool, setArrReviewedRequestPool] = useState([]);
  const [objErrors, setObjErrors] = useState({});
  const [arrApprovalWorkflow, setArrApprovalWorkflow] = useState([]);
  const [intCurrentVersion, setIntCurrentVersion] = useState(1);
  const [arrApprovalVersions, setArrApprovalVersions] = useState([]);
  const [objCategoryCodeToIdMap, setObjCategoryCodeToIdMap] = useState(new Map());
  const [objCategoryIdToCodeMap, setObjCategoryIdToCodeMap] = useState(new Map());
  const [arrPlanningPeriods, setArrPlanningPeriods] = useState([]);
  const [strActiveTab, setStrActiveTab] = useState('overview');
  const [strFormSchemaId, setStrFormSchemaId] = useState('');
  const [strFormEntryId, setStrFormEntryId] = useState('');
  const [arrFormSchemas, setArrFormSchemas] = useState([]);
  const [arrFormEntries, setArrFormEntries] = useState([]);
  const [arrAttachedForms, setArrAttachedForms] = useState([]);
  const [arrAttachedFiles, setArrAttachedFiles] = useState([]);
  const [arrInitialAttachedForms, setArrInitialAttachedForms] = useState([]);
  const [arrInitialAttachedFiles, setArrInitialAttachedFiles] = useState([]);
  const [blnIsSavingFiles, setBlnIsSavingFiles] = useState(false);
  const attachedFileUrlRef = useRef(new Set());

  const budgetCategoryOptions = useMemo(() => {
    const arrCodes = [...new Set(Array.from(objCategoryIdToCodeMap.values()))];
    return arrCodes.map((code) => ({ value: code, label: code }));
  }, [objCategoryIdToCodeMap]);

  const fiscalYearOptions = useMemo(
    () => [{ value: '', label: 'Select fiscal year' }, ...ALLOWED_FISCAL_YEARS.map((y) => ({ value: y, label: y }))],
    []
  );

  const planningPeriodOptions = useMemo(
    () => buildPlanningPeriodDropdownOptions(arrPlanningPeriods),
    [arrPlanningPeriods]
  );

  const planningPeriodAllowedIds = useMemo(
    () => planningPeriodOptions.map((opt) => String(opt.value)),
    [planningPeriodOptions]
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

  const isEditable = ['draft', 'rejected'].includes(String(strStatus || '').toLowerCase());
  const hasAttachmentChanges = useMemo(
    () =>
      JSON.stringify(arrAttachedFiles) !== JSON.stringify(arrInitialAttachedFiles) ||
      JSON.stringify(arrAttachedForms) !== JSON.stringify(arrInitialAttachedForms),
    [arrAttachedFiles, arrAttachedForms, arrInitialAttachedFiles, arrInitialAttachedForms]
  );

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setBlnIsLoading(true);
      const [res, reviewedRes, categoryRes] = await Promise.all([
        getUnifiedBudgetById(id),
        getReviewedBudgetRequests(),
        getBudgetCategories({ bcat_is_active: 1 }),
      ]);
      if (!mounted) return;
      const data = res?.data || null;
      const categories = Array.isArray(categoryRes?.data) ? categoryRes.data : [];
      const nextCodeToId = new Map();
      const nextIdToCode = new Map();
      categories.forEach((cat) => {
        const categoryId = Number(cat?.bcat_id ?? cat?.id);
        const categoryCode = String(cat?.bcat_code || '').trim().toUpperCase();
        if (!Number.isNaN(categoryId) && categoryCode) {
          nextCodeToId.set(categoryCode, categoryId);
          nextIdToCode.set(categoryId, categoryCode);
        }
      });
      setObjCategoryCodeToIdMap(nextCodeToId);
      setObjCategoryIdToCodeMap(nextIdToCode);
      const reviewedRows = Array.isArray(reviewedRes?.data) ? reviewedRes.data : [];
      setArrReviewedRequestPool(reviewedRows.map(mapReviewedRequestToUi));
      setObjRecord(data);
      if (data) {
        setStrTitle(data.title || '');
        setStrUnit(data.unit || data.requestingUnit || 'Budget Division');
        setStrDescription(data.description || '');
        setStrFiscalYear(data.fiscalYear || toFiscalYear(data.periodStart));
        setStrPlanningPeriod(String(
          data.planningPeriod ??
            data.ub_planning_period_id ??
            DEFAULT_PLANNING_PERIOD_ID
        ));
        setStrComment(data.comment || '');
        setStrStatus(data.status || 'DRAFT');
        setStrRefCode(data.code || data.id || '');
        setStrLastUpdated(data.lastUpdated || getCurrentTimestamp());
        setArrConsolidatedLineItems(
          normalizeConsolidatedSections(
            data.consolidatedLineItems,
            data.budgetRequestIds?.[0] || data.code || data.id,
            data.unit || data.requestingUnit
          )
        );
        setArrApprovalWorkflow(Array.isArray(data.approvalWorkflow) ? data.approvalWorkflow : []);
        setIntCurrentVersion(Number(data.currentVersion) > 0 ? Number(data.currentVersion) : 1);
        setArrApprovalVersions(Array.isArray(data.approvalVersions) ? data.approvalVersions : []);
        {
          const nextAttachedForms = Array.isArray(data.ub_form_entries)
            ? data.ub_form_entries
            : (Array.isArray(data.attachedForms) ? data.attachedForms : []);
          setArrAttachedForms(nextAttachedForms);
          setArrInitialAttachedForms(nextAttachedForms);
        }
        {
          const nextAttachedFiles = Array.isArray(data.ub_attached_files)
            ? data.ub_attached_files
            : (Array.isArray(data.attachedFiles) ? data.attachedFiles : []);
          setArrAttachedFiles(nextAttachedFiles);
          setArrInitialAttachedFiles(nextAttachedFiles);
        }
      }
      setBlnIsLoading(false);
    };
    load();
    return () => {
      mounted = false;
    };
  }, [id]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      await seedDefaultSchemas().catch(() => {});
      const rows = await fetchAllSchemas();
      if (mounted) setArrFormSchemas(Array.isArray(rows) ? rows : []);
    })().catch(() => {
      if (mounted) setArrFormSchemas([]);
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    if (!strFormSchemaId) {
      setArrFormEntries([]);
      setStrFormEntryId('');
      return () => {
        mounted = false;
      };
    }

    fetchEntriesBySchema(strFormSchemaId)
      .then((rows) => {
        if (!mounted) return;
        const nextRows = Array.isArray(rows) ? rows : (Array.isArray(rows?.data) ? rows.data : []);
        setArrFormEntries(nextRows);
        setStrFormEntryId((prev) => nextRows.some((entry) => entry.id === prev) ? prev : '');
      })
      .catch(() => {
        if (mounted) setArrFormEntries([]);
      });

    return () => {
      mounted = false;
    };
  }, [strFormSchemaId]);

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

  const mapRequestsToSections = (requests = []) =>
    requests.map((request, idx) => {
      const requestCode = request.code || `BR-${String(request.id ?? idx).padStart(3, '0')}`;
      const requestItems = Array.isArray(request.lineItems) ? request.lineItems : [];
      return {
        requestId: requestCode,
        requestTitle: request.title || 'Untitled Request',
        requestingUnit: request.unit || 'Unknown Unit',
        sourceRequestId: request.id,
        items: requestItems.map((item, itemIdx) => {
          const budgetRequestItemId = item.sourceItemId ?? item.id ?? item.bri_id ?? '';
          return {
            id: `${requestCode}-${item.id ?? itemIdx}`,
            sourceItemId: budgetRequestItemId,
            budgetRequestItemId,
            name: item.name ?? item.description ?? '',
            category: item.category || 'PS',
            costStructure: normalizeCostStructure(item.costStructure ?? item.bri_cost_structure) || DEFAULT_COST_STRUCTURE,
            amount: toAmount(item.amount),
            justification: item.justification || '',
            requestId: requestCode,
            requestingUnit: request.unit || 'Unknown Unit',
            sourceRequestId: request.id,
          };
        }),
      };
    });

  const mapRequestItemToUi = (item = {}) => {
    const budgetRequestItemId = item?.sourceItemId ?? item?.id ?? item?.bri_id ?? '';
    return {
      id: item?.id ?? item?.bri_id,
      sourceItemId: budgetRequestItemId,
      budgetRequestItemId,
      name: item?.name ?? item?.bri_description ?? '',
      category: objCategoryIdToCodeMap.get(Number(item?.bri_category_id || item?.category_id))
        || String(item?.category || item?.bcat_code || '').trim().toUpperCase()
        || 'PS',
      costStructure: normalizeCostStructure(item?.costStructure ?? item?.bri_cost_structure) || DEFAULT_COST_STRUCTURE,
      amount: toAmount(item?.amount ?? item?.bri_planned_amount),
      justification: item?.justification ?? item?.bri_justification ?? '',
    };
  };

  const fetchRequestItemsByRequestId = async (requestId) => {
    if (!requestId) return [];
    const response = await getBudgetRequestItems(Number(requestId));
    return toApiRows(response).map(mapRequestItemToUi);
  };

  const flattenedRows = useMemo(
    () => buildConsolidationLineRows(arrConsolidatedLineItems),
    [arrConsolidatedLineItems]
  );

  const { psTotal, mooeTotal, coTotal, tagTotal, grandTotal } = useMemo(() => {
    const totals = { psTotal: 0, mooeTotal: 0, coTotal: 0, tagTotal: 0, grandTotal: 0 };
    flattenedRows.forEach((row) => {
      if (row.rowType !== 'item') return;
      if (row.category === 'PS') totals.psTotal += row.amount;
      if (row.category === 'MOOE') totals.mooeTotal += row.amount;
      if (row.category === 'CO') totals.coTotal += row.amount;
      if (row.category === 'TAG') totals.tagTotal += row.amount;
    });
    totals.grandTotal = totals.psTotal + totals.mooeTotal + totals.coTotal + totals.tagTotal;
    return totals;
  }, [flattenedRows]);

  const selectedBudgetRequestIds = useMemo(
    () =>
      Array.from(
        new Set(
          arrConsolidatedLineItems
            .map((section) => section.sourceRequestId)
            .filter((value) => value !== null && value !== undefined && value !== '')
        )
      ),
    [arrConsolidatedLineItems]
  );

  const workflowSteps = useMemo(
    () => {
      const activeVersion = getActiveApprovalVersion(arrApprovalVersions, intCurrentVersion);
      const activeWorkflow = activeVersion?.workflow || arrApprovalWorkflow;
      return getUnifiedBudgetWorkflowSteps(strStatus, strLastUpdated, activeWorkflow);
    },
    [strStatus, strLastUpdated, arrApprovalWorkflow, arrApprovalVersions, intCurrentVersion]
  );

  const getGeneralValidationErrors = () => {
    const nextErrors = {};
    const titleErr = validateTitle(strTitle);
    const unitErr = validateUnit(strUnit);
    const descErr = validateDescription(strDescription);
    const fyErr = validateFiscalYear(strFiscalYear);
    const ppErr = validatePlanningPeriod(strPlanningPeriod, planningPeriodAllowedIds);
    const commentErr = validateComment(strComment);
    if (titleErr) nextErrors.title = titleErr;
    if (unitErr) nextErrors.unit = unitErr;
    if (descErr) nextErrors.description = descErr;
    if (fyErr) nextErrors.fiscalYear = fyErr;
    if (ppErr) nextErrors.planningPeriod = ppErr;
    if (commentErr) nextErrors.comment = commentErr;
    return nextErrors;
  };

  const getLineItemValidationErrorsById = () => {
    const lineItemErrorsById = {};

    flattenedRows.forEach((row) => {
      if (row.rowType !== 'item') return;

      const rowErrors = {};
      const nameErr = validateLineItemName(row.name ?? '');
      const amountErr = validateLineItemAmount(row.amount);
      const costStructureErr = validateCostStructure(row.costStructure ?? '');
      const justificationErr = validateJustification(row.justification ?? '');

      if (!String(row.category || '').trim()) {
        rowErrors.category = 'Category is required.';
      }
      if (nameErr) rowErrors.name = nameErr;
      if (amountErr) rowErrors.amount = amountErr;
      if (costStructureErr) rowErrors.costStructure = costStructureErr;
      if (justificationErr) rowErrors.justification = justificationErr;

      if (Object.keys(rowErrors).length > 0) {
        lineItemErrorsById[row.id] = rowErrors;
      }
    });

    return lineItemErrorsById;
  };

  const validateBeforeSave = () => {
    const nextErrors = getGeneralValidationErrors();
    const lineItemErrorsById = getLineItemValidationErrorsById();

    if (Object.keys(lineItemErrorsById).length > 0) {
      nextErrors.lineItems = 'Please fix the highlighted budget line item fields.';
      nextErrors.lineItemErrorsById = lineItemErrorsById;
    }

    setObjErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const saveWithStatus = async (nextStatus, successMessage) => {
    if (!objRecord || !validateBeforeSave()) return;
    const actionAt = getCurrentTimestamp();
    const currentStep = arrApprovalWorkflow.find((step) => step?.status === 'current')?.title || '';
    const isApprove = String(nextStatus).toLowerCase() === 'approved';
    const isReject = String(nextStatus).toLowerCase() === 'rejected';
    const activeWorkflowForAction = (() => {
      const activeVersion = getActiveApprovalVersion(arrApprovalVersions, intCurrentVersion);
      return activeVersion?.workflow || arrApprovalWorkflow;
    })();
    let actionType = String(nextStatus).toLowerCase() === 'pending'
      ? resolveUnifiedBudgetSubmitWorkflowAction(activeWorkflowForAction, strStatus)
      : '';
    if (isApprove) actionType = getUnifiedBudgetWorkflowActionForStep(currentStep, 'approve');
    if (isReject) actionType = getUnifiedBudgetWorkflowActionForStep(currentStep, 'reject');
    const resolvedStatus = isUnifiedBudgetTerminalApprovalAction(actionType)
      ? 'APPROVED'
      : String(nextStatus).toUpperCase() === 'REJECTED' || String(actionType).endsWith('_reject')
        ? 'REJECTED'
        : nextStatus;
    const isSubmitOrResubmit = String(nextStatus).toUpperCase() === 'PENDING';
    const nextVersion = isSubmitOrResubmit ? getNextApprovalVersionNumber(arrApprovalVersions) : intCurrentVersion;
    const strActorName = getWorkflowActorNameFromUser(user);
    const nextWorkflow = actionType
      ? applyUnifiedBudgetWorkflowAction(arrApprovalWorkflow, actionType, actionAt, strActorName)
      : arrApprovalWorkflow;
    const nextApprovalVersions = (() => {
      const existing = Array.isArray(arrApprovalVersions) ? [...arrApprovalVersions] : [];
      if (!isSubmitOrResubmit) {
        return existing;
      }
      const versionPayload = createApprovalVersionEntry({
        version: nextVersion,
        status: resolvedStatus,
        workflow: nextWorkflow,
        startedAt: actionAt,
        endedAt: String(resolvedStatus).toUpperCase() === 'APPROVED' ? actionAt : '',
        rejectedAtStage: String(resolvedStatus).toUpperCase() === 'REJECTED' ? currentStep : '',
        snapshot: {
          title: strTitle.trim(),
          description: strDescription.trim(),
          fiscalYear: strFiscalYear,
          totals: { psTotal, mooeTotal, coTotal, tagTotal, grandTotal },
          sectionCount: arrConsolidatedLineItems.length,
          itemCount: arrConsolidatedLineItems.reduce((sum, s) => sum + (Array.isArray(s.items) ? s.items.length : 0), 0),
        },
      });
      return [...existing, versionPayload].sort((a, b) => Number(a.version) - Number(b.version));
    })();
    const expectedLineCount = flattenedRows.filter((row) => row.rowType === 'item').length;
    const lineItemsToSave = arrConsolidatedLineItems;
    const response = await updateUnifiedBudget(objRecord.id, {
      actor_id: user?.id ?? user?.usr_id ?? null,
      title: strTitle.trim(),
      unit: strUnit.trim(),
      description: strDescription.trim(),
      fiscalYear: strFiscalYear,
      planningPeriod: strPlanningPeriod,
      comment: strComment.trim(),
      status: resolvedStatus,
      previousStatus: strStatus,
      stage: deriveUnifiedWorkflowStage(nextWorkflow),
      budgetRequestIds:
        selectedBudgetRequestIds.length > 0
          ? selectedBudgetRequestIds
          : (objRecord.budgetRequestIds || []),
      consolidatedLineItems: lineItemsToSave,
      ub_form_entries: arrAttachedForms,
      ub_form_schema_id: arrAttachedForms[0]?.schemaId || null,
      ub_form_entry_id: arrAttachedForms[0]?.entryId || null,
      approvalWorkflow: nextWorkflow,
      currentVersion: nextVersion,
      approvalVersions: nextApprovalVersions,
      totals: { psTotal, mooeTotal, coTotal, tagTotal, grandTotal },
      ub_attached_files: arrAttachedFiles.map((file) => ({
        id: file.id,
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
        dataUrl: file.dataUrl,
        url: file.url,
      })),
      lastUpdated: actionAt,
    });
    const updated = response?.data;
    if (updated) {
      setObjRecord(updated);
      setStrTitle(updated.title || strTitle);
      setStrUnit(updated.unit || strUnit);
      setStrDescription(updated.description || strDescription);
      setStrFiscalYear(updated.fiscalYear || strFiscalYear);
      setStrPlanningPeriod(String(updated.planningPeriod ?? strPlanningPeriod));
      setStrComment(updated.comment ?? strComment);
      setStrRefCode(updated.code || updated.id || strRefCode);
      const syncResult = await syncConsolidatedLineItemsToBudgetRequests(
        lineItemsToSave,
        objCategoryCodeToIdMap
      );
      if (expectedLineCount > 0 && syncResult.syncedCount === 0) {
        showToast({
          message: 'Consolidation saved, but could not sync line items to source budget requests.',
          variant: 'warning',
        });
      } else if (syncResult.failures.length > 0) {
        showToast({
          message: `Consolidation saved, but ${syncResult.failures.length} line item(s) could not sync to budget requests.`,
          variant: 'warning',
        });
      }
      if (Array.isArray(updated.consolidatedLineItems)) {
        setArrConsolidatedLineItems(normalizeConsolidatedSections(
          remapConsolidatedLineItemsAfterSave(
            lineItemsToSave,
            updated.consolidatedLineItems
          ),
          updated.code || objRecord?.code || strRefCode,
          updated.unit || strUnit
        ));
      }
      setArrApprovalWorkflow(
        Array.isArray(updated.approvalWorkflow) ? updated.approvalWorkflow : nextWorkflow
      );
      setIntCurrentVersion(Number(updated.currentVersion) > 0 ? Number(updated.currentVersion) : nextVersion);
      setArrApprovalVersions(Array.isArray(updated.approvalVersions) ? updated.approvalVersions : nextApprovalVersions);
      {
        const nextAttachedFiles = Array.isArray(updated.ub_attached_files)
          ? updated.ub_attached_files
          : (Array.isArray(updated.attachedFiles) ? updated.attachedFiles : arrAttachedFiles);
        const nextAttachedForms = Array.isArray(updated.ub_form_entries)
          ? updated.ub_form_entries
          : (Array.isArray(updated.attachedForms) ? updated.attachedForms : arrAttachedForms);
        setArrAttachedForms(nextAttachedForms);
        setArrInitialAttachedForms(nextAttachedForms);
        setArrAttachedFiles(nextAttachedFiles);
        setArrInitialAttachedFiles(nextAttachedFiles);
      }
      setStrStatus(updated.status || resolvedStatus);
      setStrLastUpdated(updated.lastUpdated || getCurrentTimestamp());
      if (isSubmitOrResubmit) {
        const markResult = await markBudgetRequestsConsolidated(
          lineItemsToSave.map(ensureBudgetRequestSectionLinks),
          selectedBudgetRequestIds.length > 0
            ? selectedBudgetRequestIds
            : (objRecord.budgetRequestIds || []),
          { actorId: user?.usr_id ?? user?.id ?? null }
        );
        if (markResult.failures.length > 0) {
          showToast({
            message: `Submitted, but ${markResult.failures.length} source budget request(s) could not be marked consolidated.`,
            variant: 'warning',
          });
        }
      }
      showToast({ message: successMessage });
    }
  };

  const handleFieldChange = (field, value) => {
    if (field === 'title') setStrTitle(value);
    if (field === 'unit') setStrUnit(value);
    if (field === 'description') setStrDescription(value);
    if (field === 'fiscalYear') setStrFiscalYear(value);
    if (field === 'planningPeriod') setStrPlanningPeriod(value);
    if (field === 'comment') {
      setStrComment(value);
      if (objErrors.comment) setObjErrors((prev) => ({ ...prev, comment: '' }));
    }
  };

  const handleLineItemChange = (itemId, field, value) => {
    setArrConsolidatedLineItems((prevSections) =>
      prevSections.map((section) => ({
        ...section,
        items: section.items.map((item) => {
          if (`item-${item.id}` !== String(itemId)) return item;
          if (field === 'amount') {
            if (value === '') return { ...item, amount: '' };
            const parsed = Number(value);
            return { ...item, amount: Number.isNaN(parsed) ? item.amount : parsed };
          }
          return { ...item, [field]: value };
        }),
      }))
    );
    setObjErrors((prev) => {
      const nextById = { ...(prev.lineItemErrorsById || {}) };
      const currentRowErrors = { ...(nextById[itemId] || {}) };
      delete currentRowErrors[field];
      if (Object.keys(currentRowErrors).length > 0) nextById[itemId] = currentRowErrors;
      else delete nextById[itemId];
      return {
        ...prev,
        lineItemErrorsById: nextById,
        lineItems: Object.keys(nextById).length > 0 ? prev.lineItems : '',
      };
    });
  };

  const handleAddBudgetRequests = async (requestIds) => {
    if (!isEditable) return;
    const selectedResponse = await getBudgetRequestsByIds(requestIds);
    const selectedRows = toApiRows(selectedResponse).map(mapReviewedRequestToUi);
    const selectedWithItems = await Promise.all(
      selectedRows.map(async (request) => ({
        ...request,
        lineItems: await fetchRequestItemsByRequestId(request?.id ?? request?.br_id),
      }))
    );
    const newSections = mapRequestsToSections(selectedWithItems);
    setArrConsolidatedLineItems((prev) => {
      const existingKeys = new Set(prev.map((section) => String(section.sourceRequestId ?? section.requestId)));
      const deduped = newSections.filter(
        (section) => !existingKeys.has(String(section.sourceRequestId ?? section.requestId))
      );
      return [...prev, ...deduped];
    });
  };

  const refreshReviewedRequests = async () => {
    try {
      const reviewedRes = await getReviewedBudgetRequests();
      const reviewedRows = Array.isArray(reviewedRes?.data) ? reviewedRes.data : [];
      setArrReviewedRequestPool(reviewedRows.map(mapReviewedRequestToUi));
    } catch {
      // Non-blocking: keep the current list if refresh fails.
    }
  };

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

  const handleSaveAttachedFiles = async () => {
    if (!objRecord) return;

    setBlnIsSavingFiles(true);
    try {
      const response = await updateUnifiedBudget(objRecord.id, {
        title: strTitle.trim(),
        unit: strUnit.trim(),
        description: strDescription.trim(),
        fiscalYear: strFiscalYear,
        planningPeriod: strPlanningPeriod,
        comment: strComment.trim(),
        status: strStatus,
        stage: objRecord.stage,
        budgetRequestIds:
          selectedBudgetRequestIds.length > 0
            ? selectedBudgetRequestIds
            : (objRecord.budgetRequestIds || []),
        consolidatedLineItems: arrConsolidatedLineItems,
        ub_form_entries: arrAttachedForms,
        ub_form_schema_id: arrAttachedForms[0]?.schemaId || null,
        ub_form_entry_id: arrAttachedForms[0]?.entryId || null,
        approvalWorkflow: arrApprovalWorkflow,
        currentVersion: intCurrentVersion,
        approvalVersions: arrApprovalVersions,
        totals: { psTotal, mooeTotal, coTotal, tagTotal, grandTotal },
        ub_attached_files: arrAttachedFiles.map((file) => ({
          id: file.id,
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified,
          dataUrl: file.dataUrl,
          url: file.url,
        })),
        lastUpdated: strLastUpdated,
      });
      const updated = response?.data;
      if (updated) {
        setObjRecord(updated);
        const nextAttachedForms = Array.isArray(updated.ub_form_entries)
          ? updated.ub_form_entries
          : (Array.isArray(updated.attachedForms) ? updated.attachedForms : arrAttachedForms);
        const nextAttachedFiles = Array.isArray(updated.ub_attached_files)
          ? updated.ub_attached_files
          : (Array.isArray(updated.attachedFiles) ? updated.attachedFiles : arrAttachedFiles);
        setArrAttachedForms(nextAttachedForms);
        setArrInitialAttachedForms(nextAttachedForms);
        setArrAttachedFiles(nextAttachedFiles);
        setArrInitialAttachedFiles(nextAttachedFiles);
      }
      showToast({ message: 'Attached forms saved successfully.' });
    } finally {
      setBlnIsSavingFiles(false);
    }
  };

  useEffect(() => () => {
    attachedFileUrlRef.current.forEach((previewUrl) => {
      URL.revokeObjectURL(previewUrl);
    });
    attachedFileUrlRef.current.clear();
  }, []);

  if (blnIsLoading) return <div className="p-4">Loading unified budget...</div>;
  if (!objRecord) return (
    <div className="p-4">
      <h5 className="mb-2">Unified budget not found.</h5>
      <Button variant="outline" size="sm" onClick={() => navigate('/budget-consolidation')}>
        Back to list
      </Button>
    </div>
  );

  return (
    <>
      <div className="d-flex align-items-center gap-2 px-4 py-3 border-bottom">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} leftIcon={<BsArrowLeft />}>
          Back
        </Button>
        <h5 className="mb-0 fw-semibold">Edit Budget Consolidation Request</h5>
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
            {arrApprovalVersions.length > 0 ? (
              <span className="badge rounded-pill text-bg-light border ms-2">{arrApprovalVersions.length}</span>
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
        <UnifiedBudgetVersionsTab versions={arrApprovalVersions} />
      ) : strActiveTab === 'attached-files' ? (
        <>
          <BudgetRequestAttachedFormsTab
            canEdit
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
          <div className="d-flex justify-content-end gap-2 px-4 pb-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleSaveAttachedFiles}
              disabled={!hasAttachmentChanges || blnIsSavingFiles}
            >
              {blnIsSavingFiles ? 'Saving Files...' : 'Save Files'}
            </Button>
          </div>
        </>
      ) : (
        <BudgetConsolidationForm
          mode={isEditable ? 'edit' : 'view'}
          formData={{
            title: strTitle,
            unit: strUnit,
            description: strDescription,
            fiscalYear: strFiscalYear,
            planningPeriod: strPlanningPeriod,
            comment: strComment,
            status: strStatus,
            referenceCode: strRefCode,
            currentVersion: intCurrentVersion,
          }}
          errors={objErrors}
          maxLengths={MAX_LENGTHS}
          fiscalYearOptions={fiscalYearOptions}
          planningPeriodOptions={planningPeriodOptions}
          lineRows={flattenedRows}
          lineItemsError={objErrors.lineItems}
          lineItemsFetchError=""
          lineItemsLoading={false}
          totals={{ psTotal, mooeTotal, coTotal, tagTotal, grandTotal }}
          workflowSteps={workflowSteps}
          reviewedRequests={arrReviewedRequestPool}
          addedRequestIds={[
            ...(objRecord?.budgetRequestIds || []),
            ...arrConsolidatedLineItems.map((section) => section.sourceRequestId ?? section.requestId),
          ]}
          onAddBudgetRequests={handleAddBudgetRequests}
          onOpenAddBudgetRequests={refreshReviewedRequests}
          budgetCategoryOptions={budgetCategoryOptions}
          actions={
            isEditable
              ? [
                {
                  label: getUnifiedBudgetSubmitActionLabel(
                    (getActiveApprovalVersion(arrApprovalVersions, intCurrentVersion)?.workflow || arrApprovalWorkflow),
                    strStatus
                  ),
                  leftIcon: <BsSend />,
                  onClick: () => saveWithStatus(
                    'PENDING',
                    getUnifiedBudgetSubmitActionLabel(
                      (getActiveApprovalVersion(arrApprovalVersions, intCurrentVersion)?.workflow || arrApprovalWorkflow),
                      strStatus,
                      { forToast: true }
                    )
                  ),
                },
                { label: 'Save Request', variant: 'outline', onClick: () => saveWithStatus(strStatus, 'Changes saved successfully.') },
                { label: 'Cancel Request', variant: 'danger', leftIcon: <BsXCircle />, onClick: () => saveWithStatus('CANCELLED', 'Request cancelled.') },
              ]
              : [{ label: 'Close', variant: 'outline', onClick: () => navigate('/budget-consolidation') }]
          }
          onFieldChange={handleFieldChange}
          onLineItemChange={handleLineItemChange}
          onCommentSend={() => setStrComment('')}
          formatCurrency={fmt}
        />
      )}

    </>
  );
}
