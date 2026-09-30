/**
 * System Name: Budget Management System
 * Module Name: Core Module
 *
 * Purpose of this file:
 * Creation page for a new unified budget consolidation — selects reviewed requests, builds line items, and submits for approval.
 *
 * Author(s): QUT Group 27
 *
 * Copyright (C) 2026
 * by the Department of Science and Technology - Central Office
 * Developed by Team 27, Queensland University of Technology
 * All rights reserved.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  BsArrowLeft,
  BsSend,
  BsXCircle,
} from 'react-icons/bs';
import { Button, useToast } from '../../components/ui';
import BudgetConsolidationForm from '../../components/form/budget_consolidation_form';
import BudgetRequestAttachedFormsTab from '../../components/form/budget_request_attached_forms_tab';
import { fetchAllSchemas, fetchEntriesBySchema } from '../../api/forms_api';
import { getEntryDisplayName } from '../../forms/utils/form_object';
import { seedDefaultSchemas } from '../../forms/utils/seed_default_schemas';
import { DEFAULT_COST_STRUCTURE, normalizeCostStructure } from '../../utils/cost_structure';
import {
  createUnifiedBudget,
  updateUnifiedBudget,
  getApprovalWorkflowStages,
} from '../../api/budget_consolidation_api';
import {
  getBudgetRequestById,
  getReviewedBudgetRequests,
} from '../../api/budget_requests_api';
import { getBudgetRequestItems } from '../../api/budget_request_items_api';
import { getBudgetCategories, getFiscalYears, getPlanningPeriods } from '../../api';
import {
  MAX_LENGTHS,
  validateTitle,
  validateUnit,
  validateDescription,
  validateFiscalYear,
  validatePlanningPeriod,
  validateComment,
} from '../../utils/input_validation';
import {
  applyUnifiedBudgetWorkflowAction,
  createApprovalVersionEntry,
  createEmptyUnifiedWorkflow,
  deriveUnifiedWorkflowStage,
  getActiveApprovalVersion,
  getUnifiedBudgetWorkflowSteps,
  getWorkflowActorNameFromUser,
} from '../../utils/workflow_utils';
import { buildConsolidationLineRows } from '../../utils/consolidation_line_rows';
import {
  ensureBudgetRequestSectionLinks,
  markBudgetRequestsConsolidated,
  remapConsolidatedLineItemsAfterSave,
  syncConsolidatedLineItemsToBudgetRequests,
} from '../../utils/sync_consolidated_line_items_to_budget_requests';

import {
  DEFAULT_PLANNING_PERIOD_ID,
  buildPlanningPeriodDropdownOptions,
  fetchPlanningPeriodsForPage,
  toReviewedRequests,
  extractApiRows as toApiRequests,
} from '../../utils/budget_request_utils';
import { useAuth } from '../../context/auth_context';
import { toAmount, toFiscalYear, getCurrentTimestamp, readFileAsDataUrl, getNextApprovalVersionNumber } from '../../utils/helpers';

const fmt = (n) => `₱ ${n.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;

const getCurrentYear = () => String(new Date().getFullYear());

/**
 * Resolves reviewed requests for a list of IDs without using the paginated
 * index `ids` filter (which can truncate results). Uses the reviewed pool first,
 * then loads each remaining ID via SHOW.
 */
async function resolveReviewedRequestsForIds(arrIds, reviewedRows, mapRequestToUiFn, isReviewedRequestFn) {
  if (!Array.isArray(arrIds) || arrIds.length === 0) {
    return [];
  }
  const strIds = arrIds.map((id) => String(id));
  const idSet = new Set(strIds);
  const fromPool = reviewedRows.filter((row) => idSet.has(String(row.id)));
  const foundSet = new Set(fromPool.map((r) => String(r.id)));
  const missing = strIds.filter((id) => !foundSet.has(id));

  const fetchedList = await Promise.all(
    missing.map(async (strId) => {
      try {
        const envelope = await getBudgetRequestById(Number(strId));
        const data = envelope?.data ?? envelope;
        if (!data || typeof data !== 'object') {
          return null;
        }
        const ui = mapRequestToUiFn(data);
        return isReviewedRequestFn(ui) ? ui : null;
      } catch {
        return null;
      }
    })
  );

  const mergedById = new Map();
  fromPool.filter(isReviewedRequestFn).forEach((row) => {
    mergedById.set(String(row.id), row);
  });
  fetchedList.filter(Boolean).forEach((row) => {
    const key = String(row.id);
    if (!mergedById.has(key)) {
      mergedById.set(key, row);
    }
  });

  return strIds.map((id) => mergedById.get(id)).filter(Boolean);
}



const mapRequestToUi = (request) => ({
  id: request?.id ?? request?.br_id,
  code: request?.code ?? request?.br_reference_no ?? '',
  title: request?.title ?? request?.br_title ?? 'Untitled Request',
  unit: request?.unit ?? request?.requesting_unit?.ru_name ?? 'Unknown Unit',
  periodStart: request?.periodStart ?? request?.fiscal_year?.fy_year ?? '',
  status: request?.status ?? request?.br_status ?? '',
});

const isReviewedRequest = (request) =>
  String(request?.status || '').trim().toLowerCase() === 'reviewed';

const mapRequestsToSections = (requests = []) =>
  requests.filter(isReviewedRequest).map((request, idx) => {
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
          name: item.name || '',
          category: item.category || 'PS',
          costStructure: normalizeCostStructure(item.costStructure) || DEFAULT_COST_STRUCTURE,
          amount: toAmount(item.amount),
          justification: item.justification || '',
          requestId: requestCode,
          requestingUnit: request.unit || 'Unknown Unit',
          sourceRequestId: request.id,
        };
      }),
    };
  });export default function NewBudgetConsolidation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const { user } = useAuth();
  const selectedRequestIds = useMemo(
    () => location.state?.selectedRequestIds ?? [],
    [location.state?.selectedRequestIds]
  );

  const [arrSourceRequests, setArrSourceRequests] = useState([]);
  const [arrReviewedRequestPool, setArrReviewedRequestPool] = useState([]);
  const [arrConsolidatedLineItems, setArrConsolidatedLineItems] = useState([]);
  const [arrFiscalYearOptions, setArrFiscalYearOptions] = useState([{ value: '', label: 'Select fiscal year' }]);
  const [objCategoryIdToCodeMap, setObjCategoryIdToCodeMap] = useState(new Map());
  const [arrStageDefinitions, setArrStageDefinitions] = useState([]);
  const [blnIsCategoryMapReady, setBlnIsCategoryMapReady] = useState(false);
  const [blnLoading, setBlnLoading] = useState(true);
  const [objError, setObjError] = useState(null);
  const [arrPlanningPeriods, setArrPlanningPeriods] = useState([]);

  const [strTitle, setStrTitle] = useState(``);
  const [strUnit, setStrUnit] = useState('');
  const [strDescription, setStrDescription] = useState('');
  const [strFiscalYear, setStrFiscalYear] = useState(getCurrentYear());
  const [strPlanningPeriod, setStrPlanningPeriod] = useState(DEFAULT_PLANNING_PERIOD_ID);
  const [strComment, setStrComment] = useState('');
  const [strCurrentStatus, setStrCurrentStatus] = useState('DRAFT');
  const [strDraftCode, setStrDraftCode] = useState('');
  const [strLastUpdated, setStrLastUpdated] = useState(getCurrentTimestamp());
  const [strSavedUnifiedBudgetId, setStrSavedUnifiedBudgetId] = useState('');
  const [objErrors, setObjErrors] = useState({});
  const [arrApprovalWorkflow, setArrApprovalWorkflow] = useState([]);
  const [intCurrentVersion, setIntCurrentVersion] = useState(1);
  const [arrApprovalVersions, setArrApprovalVersions] = useState([]);
  const [strActiveTab, setStrActiveTab] = useState('overview');
  const [strFormSchemaId, setStrFormSchemaId] = useState('');
  const [strFormEntryId, setStrFormEntryId] = useState('');
  const [arrFormSchemas, setArrFormSchemas] = useState([]);
  const [arrFormEntries, setArrFormEntries] = useState([]);
  const [arrAttachedForms, setArrAttachedForms] = useState([]);
  const [arrAttachedFiles, setArrAttachedFiles] = useState([]);
  const attachedFileUrlRef = useRef(new Set());

  const budgetCategoryOptions = useMemo(() => {
    const arrCodes = [...new Set(Array.from(objCategoryIdToCodeMap.values()))];
    return arrCodes.map((code) => ({ value: code, label: code }));
  }, [objCategoryIdToCodeMap]);

  const categoryCodeToIdMap = useMemo(() => {
    const nextMap = new Map();
    objCategoryIdToCodeMap.forEach((code, id) => {
      nextMap.set(String(code).trim().toUpperCase(), Number(id));
    });
    return nextMap;
  }, [objCategoryIdToCodeMap]);

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

  const mapRequestItemToUi = useCallback((item) => {
    const categoryFromCode = String(
      item?.category ||
      item?.bcat_code ||
      item?.budget_category?.bcat_code ||
      item?.category_ref?.bcat_code ||
      ''
    ).trim().toUpperCase();
    const categoryFromId = objCategoryIdToCodeMap.get(Number(item?.bri_category_id || item?.category_id));
    const resolvedCategory = categoryFromCode || categoryFromId || 'PS';
    const budgetRequestItemId = item?.sourceItemId ?? item?.id ?? item?.bri_id ?? '';
    return {
      id: item?.id ?? item?.bri_id,
      sourceItemId: budgetRequestItemId,
      budgetRequestItemId,
      name: item?.name ?? item?.bri_description ?? '',
      category: resolvedCategory,
      costStructure: normalizeCostStructure(item?.costStructure ?? item?.bri_cost_structure) || DEFAULT_COST_STRUCTURE,
      amount: toAmount(item?.amount ?? item?.bri_planned_amount),
      justification: item?.justification ?? item?.bri_justification ?? '',
    };
  }, [objCategoryIdToCodeMap]);

  const fetchRequestItemsByRequestId = useCallback(async (requestId) => {
    if (!requestId) return [];
    const objRes = await getBudgetRequestItems(Number(requestId));
    return toApiRequests(objRes).map(mapRequestItemToUi);
  }, [mapRequestItemToUi]);

  useEffect(() => {
    let isMounted = true;

    const loadFiscalYears = async () => {
      try {
        const resActive = await getFiscalYears({ fy_is_active: 1 });
        const arrActiveData = Array.isArray(resActive?.data) ? resActive.data : [];
        let arrData = arrActiveData;

        if (arrData.length === 0) {
          const resAll = await getFiscalYears({});
          arrData = Array.isArray(resAll?.data) ? resAll.data : [];
        }

        if (!isMounted) return;
        if (arrData.length === 0) {
          setArrFiscalYearOptions([{ value: '', label: 'Select fiscal year' }]);
          return;
        }

        setArrFiscalYearOptions([
          { value: '', label: 'Select fiscal year' },
          ...arrData.map((fy) => ({ value: String(fy.fy_year), label: String(fy.fy_year) })),
        ]);
      } catch {
        if (!isMounted) return;
        setArrFiscalYearOptions([{ value: '', label: 'Select fiscal year' }]);
      }
    };

    const loadPlanningPeriods = async () => {
      const arrData = await fetchPlanningPeriodsForPage(getPlanningPeriods);
      if (!isMounted) return;
      setArrPlanningPeriods(arrData);
    };

    const loadFormSchemas = async () => {
      await seedDefaultSchemas().catch(() => {});
      const arrData = await fetchAllSchemas();
      if (!isMounted) return;
      setArrFormSchemas(Array.isArray(arrData) ? arrData : []);
    };

    const loadBudgetCategories = async () => {
      try {
        const objResult = await getBudgetCategories({ bcat_is_active: 1 });
        const arrData = Array.isArray(objResult?.data) ? objResult.data : [];
        if (!isMounted) return;
        const objMap = new Map();
        arrData.forEach((cat) => {
          const intId = Number(cat?.bcat_id);
          const strCode = String(cat?.bcat_code || '').trim().toUpperCase();
          if (!Number.isNaN(intId) && strCode !== '') {
            objMap.set(intId, strCode);
          }
        });
        setObjCategoryIdToCodeMap(objMap);
        setBlnIsCategoryMapReady(true);
      } catch {
        if (!isMounted) return;
        setObjCategoryIdToCodeMap(new Map());
        setBlnIsCategoryMapReady(true);
      }
    };

    const loadApprovalStages = async () => {
      try {
        const rows = await getApprovalWorkflowStages();
        if (!isMounted) return;
        setArrStageDefinitions(Array.isArray(rows) ? rows : []);
      } catch {
        if (!isMounted) return;
        setArrStageDefinitions([]);
      }
    };

    loadFiscalYears();
    loadPlanningPeriods();
    loadFormSchemas();
    loadBudgetCategories();
    loadApprovalStages();
    return () => { isMounted = false; };
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

  useEffect(() => {
    if (!Array.isArray(arrApprovalWorkflow) || arrApprovalWorkflow.length > 0) return;
    setArrApprovalWorkflow(createEmptyUnifiedWorkflow(arrStageDefinitions));
  }, [arrStageDefinitions, arrApprovalWorkflow]);

  useEffect(() => {
    if (!blnIsCategoryMapReady) return undefined;

    let isMounted = true;
    const fetchRequests = async () => {
      setBlnLoading(true);
      setObjError(null);
      try {
        const reviewed = await getReviewedBudgetRequests();
        const reviewedRows = toReviewedRequests(reviewed).map(mapRequestToUi);
        if (isMounted) setArrReviewedRequestPool(reviewedRows);

        let requests = [];
        if (Array.isArray(selectedRequestIds) && selectedRequestIds.length > 0) {
          requests = await resolveReviewedRequestsForIds(
            selectedRequestIds,
            reviewedRows,
            mapRequestToUi,
            isReviewedRequest
          );
          if (isMounted && requests.length === 0) {
            showToast({
              message: 'Selected requests are already consolidated. Redirected to Budget Consolidation list.',
              variant: 'warning',
            });
            navigate('/budget-consolidation', { replace: true });
            return;
          }
        } else {
          requests = reviewedRows;
        }

        const requestsWithItems = await Promise.all(
          requests.map(async (request) => ({
            ...request,
            lineItems: await fetchRequestItemsByRequestId(request.id),
          }))
        );

        if (!isMounted) return;
        setArrSourceRequests(requestsWithItems);
      } catch {
        if (!isMounted) return;
        setObjError('Failed to load reviewed budget requests.');
        setArrSourceRequests([]);
      } finally {
        if (isMounted) setBlnLoading(false);
      }
    };
    fetchRequests();
    return () => { isMounted = false; };
  }, [selectedRequestIds, blnIsCategoryMapReady, objCategoryIdToCodeMap, fetchRequestItemsByRequestId, navigate, showToast]);

  useEffect(() => {
    const sections = mapRequestsToSections(arrSourceRequests);

    setArrConsolidatedLineItems(sections);
    if (sections.length > 0 && !strFiscalYear) {
      setStrFiscalYear(toFiscalYear(arrSourceRequests[0]?.periodStart));
    }
  }, [arrSourceRequests, strFiscalYear]);

  const handleAddBudgetRequests = async (requestIds) => {
    const selected = await resolveReviewedRequestsForIds(
      requestIds,
      arrReviewedRequestPool,
      mapRequestToUi,
      isReviewedRequest
    );
    const selectedWithItems = await Promise.all(
      selected.map(async (request) => ({
        ...request,
        lineItems: await fetchRequestItemsByRequestId(request.id),
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
    setArrSourceRequests((prev) => {
      const existing = new Set(prev.map((request) => String(request.id)));
      const deduped = selectedWithItems.filter((request) => !existing.has(String(request.id)));
      return [...prev, ...deduped];
    });
  };

  const refreshReviewedRequests = async () => {
    try {
      const reviewed = await getReviewedBudgetRequests();
      const reviewedRows = toReviewedRequests(reviewed).map(mapRequestToUi);
      setArrReviewedRequestPool(reviewedRows);
    } catch {
      // Non-blocking: keep existing reviewed pool when refresh fails.
    }
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

  const markSelectedBudgetRequestsConsolidated = async (sections = arrConsolidatedLineItems) => {
    const arrLinkedSections = (Array.isArray(sections) ? sections : []).map(ensureBudgetRequestSectionLinks);
    const markResult = await markBudgetRequestsConsolidated(
      arrLinkedSections,
      selectedBudgetRequestIds,
      { actorId: user?.usr_id ?? user?.id ?? null }
    );

    const setMarkedIds = new Set(
      selectedBudgetRequestIds.map((value) => String(value))
    );
    setArrReviewedRequestPool((prev) =>
      prev.filter((request) => !setMarkedIds.has(String(request.id)))
    );

    return markResult;
  };

  const workflowSteps = useMemo(
    () => {
      const activeVersion = getActiveApprovalVersion(arrApprovalVersions, intCurrentVersion);
      const activeWorkflow = activeVersion?.workflow || arrApprovalWorkflow;
      return getUnifiedBudgetWorkflowSteps(strCurrentStatus, strLastUpdated, activeWorkflow);
    },
    [strCurrentStatus, strLastUpdated, arrApprovalWorkflow, arrApprovalVersions, intCurrentVersion]
  );

  const validateGeneral = () => {
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
    setObjErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const validateBeforeSubmit = () => {
    const isGeneralValid = validateGeneral();
    if (!isGeneralValid) return false;

    if (arrSourceRequests.length === 0 || flattenedRows.every((row) => row.rowType !== 'item')) {
      setObjErrors((prev) => ({
        ...prev,
        lineItems: 'At least one reviewed request with line items is required for submission.',
      }));
      return false;
    }
    return true;
  };

  const handleSaveDraft = async () => {
    if (!validateGeneral()) return;
    const actionAt = getCurrentTimestamp();
    const actorName = getWorkflowActorNameFromUser(user);
    const workflowBase = Array.isArray(arrApprovalWorkflow) && arrApprovalWorkflow.length > 0
      ? arrApprovalWorkflow
      : createEmptyUnifiedWorkflow(arrStageDefinitions);
    const nextWorkflow = applyUnifiedBudgetWorkflowAction(
      workflowBase,
      'save_draft',
      actionAt,
      actorName,
      arrStageDefinitions
    );
    const draftVersion = Number(intCurrentVersion) > 0 ? Number(intCurrentVersion) : 1;
    const nextApprovalVersions = Array.isArray(arrApprovalVersions) ? arrApprovalVersions : [];
    const payload = {
      actor_id: user?.id ?? user?.usr_id ?? null,
      title: strTitle.trim(),
      unit: strUnit.trim(),
      fiscalYear: strFiscalYear,
      planningPeriod: strPlanningPeriod,
      description: strDescription.trim(),
      comment: strComment.trim(),
      status: 'DRAFT',
      stage: deriveUnifiedWorkflowStage(nextWorkflow),
      budgetRequestIds: selectedBudgetRequestIds,
      consolidatedLineItems: arrConsolidatedLineItems,
      ub_form_entries: arrAttachedForms,
      ub_form_schema_id: arrAttachedForms[0]?.schemaId || null,
      ub_form_entry_id: arrAttachedForms[0]?.entryId || null,
      approvalWorkflow: nextWorkflow,
      currentVersion: draftVersion,
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
    };
    const expectedLineCount = flattenedRows.filter((row) => row.rowType === 'item').length;
    const lineItemsToSave = arrConsolidatedLineItems;
    const response = strSavedUnifiedBudgetId
      ? await updateUnifiedBudget(strSavedUnifiedBudgetId, { ...payload, consolidatedLineItems: lineItemsToSave })
      : await createUnifiedBudget({ ...payload, consolidatedLineItems: lineItemsToSave });
    const saved = response?.data;
    if (saved?.id) {
      setStrSavedUnifiedBudgetId(saved.id);
      setStrDraftCode(saved.code || saved.id);
      setStrCurrentStatus(saved.status || 'DRAFT');
      setStrLastUpdated(saved.lastUpdated || getCurrentTimestamp());
      setArrApprovalWorkflow(Array.isArray(saved.approvalWorkflow) ? saved.approvalWorkflow : nextWorkflow);
      setIntCurrentVersion(Number(saved.currentVersion) > 0 ? Number(saved.currentVersion) : draftVersion);
      setArrApprovalVersions(Array.isArray(saved.approvalVersions) ? saved.approvalVersions : nextApprovalVersions);
      setStrTitle(saved.title || strTitle);
      setStrUnit(saved.unit || strUnit);
      setStrDescription(saved.description || strDescription);
      setStrComment(saved.comment ?? strComment);
      setStrFiscalYear(saved.fiscalYear || strFiscalYear);
      setStrPlanningPeriod(String(saved.planningPeriod ?? strPlanningPeriod));
      setArrAttachedFiles(Array.isArray(saved.ub_attached_files) ? saved.ub_attached_files : (Array.isArray(saved.attachedFiles) ? saved.attachedFiles : arrAttachedFiles));
      setArrAttachedForms(Array.isArray(saved.ub_form_entries) ? saved.ub_form_entries : (Array.isArray(saved.attachedForms) ? saved.attachedForms : arrAttachedForms));
      const syncResult = await syncConsolidatedLineItemsToBudgetRequests(
        lineItemsToSave,
        categoryCodeToIdMap
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
      if (Array.isArray(saved.consolidatedLineItems)) {
        setArrConsolidatedLineItems(
          remapConsolidatedLineItemsAfterSave(lineItemsToSave, saved.consolidatedLineItems)
            .map(ensureBudgetRequestSectionLinks)
        );
      }
    }
    showToast({ message: 'Request saved successfully.' });
  };

  const handleSubmitForApproval = async () => {
    if (!validateBeforeSubmit()) return;
    const actionAt = getCurrentTimestamp();
    const actorName = getWorkflowActorNameFromUser(user);
    const workflowBase = Array.isArray(arrApprovalWorkflow) && arrApprovalWorkflow.length > 0
      ? arrApprovalWorkflow
      : createEmptyUnifiedWorkflow(arrStageDefinitions);
    const nextWorkflow = applyUnifiedBudgetWorkflowAction(
      workflowBase,
      'submit',
      actionAt,
      actorName,
      arrStageDefinitions
    );
    const nextVersion = getNextApprovalVersionNumber(arrApprovalVersions);
    const nextApprovalVersions = [
      ...(Array.isArray(arrApprovalVersions) ? arrApprovalVersions : []),
      createApprovalVersionEntry({
        version: nextVersion,
        status: 'PENDING',
        workflow: nextWorkflow,
        startedAt: actionAt,
      }),
    ].sort((a, b) => Number(a.version) - Number(b.version));
    const payload = {
      actor_id: user?.id ?? user?.usr_id ?? null,
      title: strTitle.trim(),
      unit: strUnit.trim(),
      fiscalYear: strFiscalYear,
      planningPeriod: strPlanningPeriod,
      description: strDescription.trim(),
      comment: strComment.trim(),
      status: 'PENDING',
      stage: deriveUnifiedWorkflowStage(nextWorkflow),
      budgetRequestIds: selectedBudgetRequestIds,
      consolidatedLineItems: arrConsolidatedLineItems,
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
    };
    const expectedLineCount = flattenedRows.filter((row) => row.rowType === 'item').length;
    const lineItemsToSave = arrConsolidatedLineItems;
    const response = strSavedUnifiedBudgetId
      ? await updateUnifiedBudget(strSavedUnifiedBudgetId, { ...payload, consolidatedLineItems: lineItemsToSave })
      : await createUnifiedBudget({ ...payload, consolidatedLineItems: lineItemsToSave });
    const saved = response?.data;
    if (saved?.id) {
      const markResult = await markSelectedBudgetRequestsConsolidated(lineItemsToSave);
      if (markResult.failures.length > 0) {
        showToast({
          message: `Submitted, but ${markResult.failures.length} source budget request(s) could not be marked consolidated.`,
          variant: 'warning',
        });
      }
      const syncResult = await syncConsolidatedLineItemsToBudgetRequests(
        lineItemsToSave,
        categoryCodeToIdMap
      );
      if (expectedLineCount > 0 && syncResult.syncedCount === 0) {
        showToast({
          message: 'Submitted, but could not sync line items to source budget requests.',
          variant: 'warning',
        });
      } else if (syncResult.failures.length > 0) {
        showToast({
          message: `Submitted, but ${syncResult.failures.length} line item(s) could not sync to budget requests.`,
          variant: 'warning',
        });
      }
      setStrSavedUnifiedBudgetId(saved.id);
      setStrDraftCode(saved.code || saved.id);
      setStrCurrentStatus(saved.status || 'PENDING');
      setStrLastUpdated(saved.lastUpdated || getCurrentTimestamp());
      setArrApprovalWorkflow(Array.isArray(saved.approvalWorkflow) ? saved.approvalWorkflow : nextWorkflow);
      setIntCurrentVersion(Number(saved.currentVersion) > 0 ? Number(saved.currentVersion) : nextVersion);
      setArrApprovalVersions(Array.isArray(saved.approvalVersions) ? saved.approvalVersions : nextApprovalVersions);
      setStrTitle(saved.title || strTitle);
      setStrUnit(saved.unit || strUnit);
      setStrDescription(saved.description || strDescription);
      setStrComment(saved.comment ?? strComment);
      setStrFiscalYear(saved.fiscalYear || strFiscalYear);
      setStrPlanningPeriod(String(saved.planningPeriod ?? strPlanningPeriod));
      setArrAttachedFiles(Array.isArray(saved.ub_attached_files) ? saved.ub_attached_files : (Array.isArray(saved.attachedFiles) ? saved.attachedFiles : arrAttachedFiles));
      setArrAttachedForms(Array.isArray(saved.ub_form_entries) ? saved.ub_form_entries : (Array.isArray(saved.attachedForms) ? saved.attachedForms : arrAttachedForms));
      if (Array.isArray(saved.consolidatedLineItems)) {
        setArrConsolidatedLineItems(
          remapConsolidatedLineItemsAfterSave(lineItemsToSave, saved.consolidatedLineItems)
            .map(ensureBudgetRequestSectionLinks)
        );
      }
      showToast({ message: 'Submitted for approval successfully.' });
      navigate(`/budget-consolidation/${saved.id}`);
    }
  };

  const handleConsolidatedLineItemChange = (itemId, field, value) => {
    setArrConsolidatedLineItems((prevSections) =>
      prevSections.map((section) => ({
        ...section,
        items: section.items.map((item) => {
          if (`item-${item.id}` !== String(itemId)) return item;
          if (field === 'amount') {
            if (value === '') return { ...item, amount: 0 };
            const parsed = Number(value);
            return { ...item, amount: Number.isNaN(parsed) ? item.amount : parsed };
          }
          return { ...item, [field]: value };
        }),
      }))
    );
  };

  const handleFormFieldChange = (field, value) => {
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

  useEffect(() => {
    if (strUnit) return;
    if (!Array.isArray(arrSourceRequests) || arrSourceRequests.length === 0) return;
    const strFirstUnit = String(arrSourceRequests[0]?.unit || '').trim();
    if (strFirstUnit !== '') {
      setStrUnit(strFirstUnit);
    }
  }, [arrSourceRequests, strUnit]);

  return (
    <>
      <div className="d-flex align-items-center gap-2 px-4 py-3 border-bottom">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} leftIcon={<BsArrowLeft />}>
          Back
        </Button>
        <h5 className="mb-0 fw-semibold">New Budget Consolidation Request</h5>
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
            className={`nav-link fw-semibold border-0 bg-transparent${strActiveTab === 'attach-file' ? ' active nav-underline-active-brand' : ''}`}
            onClick={() => setStrActiveTab('attach-file')}
          >
            Attached Forms
            {arrAttachedFiles.length > 0 ? (
              <span className="badge rounded-pill text-bg-light border ms-2">{arrAttachedFiles.length}</span>
            ) : null}
          </button>
        </li>
        <li className="nav-item">
          <span className="nav-link text-muted">Tracking</span>
        </li>
      </ul>

      {strActiveTab === 'overview' ? (
        <BudgetConsolidationForm
          mode="create"
          formData={{
            title: strTitle,
            unit: strUnit,
            description: strDescription,
            fiscalYear: strFiscalYear,
            planningPeriod: strPlanningPeriod,
            comment: strComment,
            status: strCurrentStatus,
            referenceCode: strDraftCode || 'Will be generated after save',
            currentVersionNumber: null,
          }}
          errors={objErrors}
          maxLengths={MAX_LENGTHS}
          fiscalYearOptions={arrFiscalYearOptions}
          planningPeriodOptions={planningPeriodOptions}
          budgetCategoryOptions={budgetCategoryOptions}
          lineRows={flattenedRows}
          lineItemsError={objErrors.lineItems}
          lineItemsFetchError={objError}
          lineItemsLoading={blnLoading}
          totals={{ psTotal, mooeTotal, coTotal, tagTotal, grandTotal }}
          workflowSteps={workflowSteps}
          reviewedRequests={arrReviewedRequestPool}
          addedRequestIds={arrConsolidatedLineItems.map((section) => section.sourceRequestId ?? section.requestId)}
          onAddBudgetRequests={handleAddBudgetRequests}
          onOpenAddBudgetRequests={refreshReviewedRequests}
          actions={[
            { label: 'Submit for Approval', leftIcon: <BsSend />, onClick: handleSubmitForApproval },
            { label: 'Save Request', variant: 'outline', onClick: handleSaveDraft },
            { label: 'Cancel Request', variant: 'danger', leftIcon: <BsXCircle />, onClick: () => navigate(-1) },
          ]}
          onFieldChange={handleFormFieldChange}
          onLineItemChange={handleConsolidatedLineItemChange}
          onCommentSend={() => setStrComment('')}
          formatCurrency={fmt}
        />
      ) : (
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
      )}

    </>
  );
}
