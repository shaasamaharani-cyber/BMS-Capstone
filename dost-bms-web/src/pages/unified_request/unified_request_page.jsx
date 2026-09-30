/**
 * System Name: Budget Management System
 * Module Name: Core Module
 *
 * Purpose of this file:
 * Unified budget request wizard. The budget request is the single starting point: the user enters the shared information and
 * line items once, answers a few questions, and the system works out which BP forms are needed, generates and pre-fills them,
 * checks the totals, collects signed copies and submits. The request can be saved as a draft at any step and reopened later
 * from the Budget Requests list, so nobody has to start again. A returned request is fixed in the same wizard.
 *
 * Author(s): QUT Group T214
 *
 * Copyright (C) 2026
 * by the Department of Science and Technology - Central Office
 * All rights reserved.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BsArrowLeft, BsArrowRight } from 'react-icons/bs';
import {
  createBudgetRequest,
  createBudgetRequestItem,
  deleteBudgetRequestItem,
  getBudgetCategories,
  getBudgetRequestById,
  getFiscalYears,
  getPlanningPeriods,
  getRequestingUnits,
  submitBudgetRequest,
  updateBudgetRequest,
} from '../../api';
import { Button, Modal, ProgressSteps, useToast } from '../../components/ui';
import BudgetRequestTotalsSummary from '../../components/shared/budget_request_totals_summary';
import { useAuth } from '../../context/auth_context';
import { getScopedRequestingUnitId } from '../../utils/requesting_unit_scope';
import { readFileAsDataUrl } from '../../utils/helpers';
import {
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
} from '../../utils/budget_request_utils';
import { BP_FORM_CATALOG, FORM_LEVEL, getEnabledFormIds, getFormById } from '../../bp_forms/bp_form_catalog';
import { evaluateRequiredForms, countUnansweredQuestions } from '../../bp_forms/bp_form_rules';
import { getFormCompletion, resolveCommonValues } from '../../bp_forms/bp_form_fields';
import { buildTotalsCheck, collectSubmissionIssues, STEP_IDS } from '../../utils/unified_request_checks';
import { createEmptyLineItem, createInitialDraft, getDraftSnapshot, useUnifiedRequestDraft } from './use_unified_request_draft';
import StepRequestDetails from './step_request_details';
import StepProposalQuestions from './step_proposal_questions';
import StepRequiredForms from './step_required_forms';
import StepPrefilledForms from './step_prefilled_forms';
import StepReviewSubmit from './step_review_submit';
import styles from './unified_request.module.css';

const CATEGORY_KEYS = ['psTotal', 'mooeTotal', 'coTotal', 'tagTotal'];
const EDITABLE_STATUSES = ['draft', 'rejected'];
const SIGNED_NAME_PATTERN = /^Signed - (.+?) - (.+)$/;

const STEP_TITLES = [
  { id: 'details', label: 'Request details', description: 'Enter once' },
  { id: 'questions', label: 'Questions', description: 'About the proposal' },
  { id: 'forms', label: 'Required forms', description: 'Chosen for you' },
  { id: 'fill', label: 'Pre-filled forms', description: 'Complete the rest' },
  { id: 'review', label: 'Review & submit', description: 'Check and sign' },
];

// A line item is only stored once it has a name and an amount; empty rows stay on screen only
const isPersistableItem = (objItem) => String(objItem.name || '').trim() !== '' && objItem.amount !== '';

// Signed copies travel as request attachments named "Signed - <form code> - <file name>"
function signedFromAttachedFiles(arrFiles) {
  const objSigned = {};
  (arrFiles || []).forEach((objFile) => {
    const arrMatch = String(objFile.name || '').match(SIGNED_NAME_PATTERN);
    const objForm = arrMatch ? BP_FORM_CATALOG.find((objCandidate) => objCandidate.code === arrMatch[1]) : null;
    if (objForm) objSigned[objForm.id] = { id: objFile.id, name: arrMatch[2], size: objFile.size, type: objFile.type, lastModified: objFile.lastModified, url: objFile.url };
  });
  return objSigned;
}

export default function UnifiedRequestPage() {
  const navigate = useNavigate();
  const { id: strRouteId } = useParams();
  const { showToast } = useToast();
  const { user } = useAuth();
  const { objDraft, updateDraft, updateRequest, replaceDraft, detachLocal, resetDraft } = useUnifiedRequestDraft(!strRouteId);
  const { intStep, objRequest, arrLineItems, objAnswers, objOverrides, objFormValues, objSnapshot } = objDraft;

  const [arrFiscalYears, setArrFiscalYears] = useState([]);
  const [arrPlanningPeriods, setArrPlanningPeriods] = useState([]);
  const [arrRequestingUnits, setArrRequestingUnits] = useState([]);
  const [arrBudgetCategories, setArrBudgetCategories] = useState([]);
  const [objSigned, setObjSigned] = useState({});
  const [strSelectedFormId, setStrSelectedFormId] = useState('');
  const [strComment, setStrComment] = useState('');
  const [blnSubmitting, setBlnSubmitting] = useState(false);

  // Server-side draft state
  const [intRequestId, setIntRequestId] = useState(strRouteId ? Number(strRouteId) : null);
  const [objRequestMeta, setObjRequestMeta] = useState({ referenceNo: '', status: '' });
  const [blnLoadingDraft, setBlnLoadingDraft] = useState(Boolean(strRouteId));
  const [blnSavingDraft, setBlnSavingDraft] = useState(false);
  const [blnLeaveModalOpen, setBlnLeaveModalOpen] = useState(false);
  const [strSavedSnapshot, setStrSavedSnapshot] = useState(() => (strRouteId ? null : getDraftSnapshot(createInitialDraft())));
  const refServerItemIds = useRef([]);
  const refLoadedId = useRef(null);
  const refAlive = useRef(true);

  useEffect(() => {
    refAlive.current = true;
    return () => { refAlive.current = false; };
  }, []);

  const intScopedUnitId = useMemo(() => getScopedRequestingUnitId(user), [user]);

  // Reference data comes from the same API the rest of the system uses
  useEffect(() => {
    let blnMounted = true;
    (async () => {
      const [arrCategories, arrYears, arrPeriods, arrUnits] = await Promise.all([
        fetchBudgetCategoriesForPage(getBudgetCategories),
        fetchFiscalYearsForBudgetPage(getFiscalYears),
        fetchPlanningPeriodsForPage(getPlanningPeriods),
        fetchRequestingUnitsForBudgetPage(getRequestingUnits),
      ]);
      if (!blnMounted) return;
      setArrBudgetCategories(arrCategories);
      setArrFiscalYears(arrYears);
      setArrPlanningPeriods(arrPeriods);
      setArrRequestingUnits(arrUnits);
    })();
    return () => { blnMounted = false; };
  }, []);

  // Reopen a saved draft (or a returned request) from the server
  useEffect(() => {
    if (!strRouteId || refLoadedId.current === strRouteId) return;
    refLoadedId.current = strRouteId;

    (async () => {
      try {
        const [objResponse, arrCategories] = await Promise.all([getBudgetRequestById(strRouteId), fetchBudgetCategoriesForPage(getBudgetCategories)]);
        const objData = objResponse?.data ?? objResponse;
        if (!refAlive.current) return;

        if (!EDITABLE_STATUSES.includes(String(objData.br_status).toLowerCase())) {
          showToast({ message: 'This request has already been submitted and can no longer be edited.', variant: 'warning' });
          navigate(`/budget-requests/${strRouteId}`, { replace: true });
          return;
        }

        const objStored = objData.br_unified_request || {};
        const objInitial = createInitialDraft();
        const mapIdToCode = buildCategoryIdToCodeMap(arrCategories);
        const arrItems = [...(objData.items || [])]
          .sort((objA, objB) => Number(objA.bri_sort_order) - Number(objB.bri_sort_order))
          .map((objItem) => ({
            ...createEmptyLineItem(),
            briId: objItem.bri_id,
            name: objItem.bri_description || '',
            category: mapIdToCode.get(Number(objItem.bri_category_id)) || 'MOOE',
            costStructure: objItem.bri_cost_structure,
            amount: objItem.bri_planned_amount === null || objItem.bri_planned_amount === undefined ? '' : String(objItem.bri_planned_amount),
            justification: objItem.bri_justification || '',
          }));

        const objLoaded = {
          ...objInitial,
          intStep: Number(objStored.step) || 0,
          objRequest: {
            ...objInitial.objRequest,
            // Requests submitted before drafts existed only stored the resolved common values, so rebuild the shared fields from those
            ...(objStored.request || {
              programPap: objStored.common?.programPap || '',
              location: objStored.common?.location || '',
              implementationStart: objStored.common?.implementationStart || '',
              implementationEnd: objStored.common?.implementationEnd || '',
              fundingSource: objStored.common?.fundingSource || '',
              objectives: objStored.common?.objectives || '',
            }),
            title: objData.br_title || '',
            unitId: String(objData.br_requesting_unit_id || ''),
            fiscalYearId: String(objData.br_fiscal_year_id || ''),
            planningPeriodId: String(objData.br_planning_period_id || DEFAULT_PLANNING_PERIOD_ID),
            description: objData.br_description || '',
          },
          arrLineItems: arrItems.length > 0 ? arrItems : objInitial.arrLineItems,
          objAnswers: objStored.answers || {},
          objOverrides: objStored.overrides || {},
          objFormValues: objStored.formValues || {},
          objSnapshot: objStored.snapshot || (objStored.totalsAtGeneration ? { totals: objStored.totalsAtGeneration, generatedAt: null } : null),
        };
        const objLoadedSigned = signedFromAttachedFiles(objData.br_attached_files);

        refServerItemIds.current = arrItems.map((objItem) => objItem.briId);
        replaceDraft(objLoaded);
        setObjSigned(objLoadedSigned);
        setStrSavedSnapshot(getDraftSnapshot(objLoaded, objLoadedSigned));
        setObjRequestMeta({ referenceNo: objData.br_reference_no || '', status: String(objData.br_status || '').toLowerCase() });
        setIntRequestId(Number(strRouteId));
        setBlnLoadingDraft(false);
      } catch {
        if (!refAlive.current) return;
        showToast({ message: 'Cannot perform transaction. Error encountered.', variant: 'danger' });
        navigate('/budget-requests', { replace: true });
      }
    })();
  }, [strRouteId, navigate, replaceDraft, showToast]);

  // A requester is bound to one unit, so the field is filled and locked for them
  useEffect(() => {
    if (blnLoadingDraft) return;
    if (intScopedUnitId != null && String(intScopedUnitId) !== objRequest.unitId) {
      updateRequest({ unitId: String(intScopedUnitId) });
    }
  }, [intScopedUnitId, objRequest.unitId, updateRequest, blnLoadingDraft]);

  const objOptions = useMemo(() => ({
    units: buildRequestingUnitDropdownOptions(arrRequestingUnits),
    fiscalYears: buildFiscalYearDropdownOptions(arrFiscalYears),
    planningPeriods: buildPlanningPeriodDropdownOptions(arrPlanningPeriods),
  }), [arrRequestingUnits, arrFiscalYears, arrPlanningPeriods]);

  const categoryCodeToId = useMemo(() => buildCategoryCodeToIdMap(arrBudgetCategories), [arrBudgetCategories]);

  const objTotals = useMemo(() => computeBudgetLineItemTotals(arrLineItems), [arrLineItems]);
  const strUnitName = arrRequestingUnits.find((objUnit) => String(objUnit.ru_id) === objRequest.unitId)?.ru_name || '';
  const strFiscalYearLabel = String(arrFiscalYears.find((objYear) => String(objYear.fy_id) === objRequest.fiscalYearId)?.fy_year || '');

  const objCommon = useMemo(
    () => resolveCommonValues(objRequest, { unitName: strUnitName, fiscalYearLabel: strFiscalYearLabel }),
    [objRequest, strUnitName, strFiscalYearLabel]
  );

  const arrEnabledFormIds = useMemo(() => getEnabledFormIds(Number(strFiscalYearLabel) || null), [strFiscalYearLabel]);

  const { arrRequired, arrNotInCycle } = useMemo(
    () => evaluateRequiredForms(objAnswers, objTotals, objCommon, arrEnabledFormIds, objOverrides),
    [objAnswers, objTotals, objCommon, arrEnabledFormIds, objOverrides]
  );

  const objContext = useMemo(
    () => ({ common: objCommon, totals: objTotals, lineItems: arrLineItems, formValues: objFormValues }),
    [objCommon, objTotals, arrLineItems, objFormValues]
  );

  // Forms are "generated" the first time the user opens step 4 (and again on request); the totals are captured then
  const blnSnapshotStale = Boolean(objSnapshot) && CATEGORY_KEYS.some((strKey) => (objSnapshot.totals[strKey] || 0) !== (objTotals[strKey] || 0));

  useEffect(() => {
    if (STEP_IDS[intStep] === 'fill' && !objSnapshot && !blnLoadingDraft) {
      updateDraft({ objSnapshot: { totals: { ...objTotals }, generatedAt: new Date().toISOString() } });
    }
  }, [intStep, objSnapshot, objTotals, updateDraft, blnLoadingDraft]);

  const arrTotalsCheck = useMemo(
    () => buildTotalsCheck(objTotals, objSnapshot, arrRequired.map((objEntry) => objEntry.formId)),
    [objTotals, objSnapshot, arrRequired]
  );

  const arrIssues = useMemo(
    () => collectSubmissionIssues({ objRequest, arrLineItems, objAnswers, arrRequired, objContext, objSigned, objTotalsCheck: arrTotalsCheck }),
    [objRequest, arrLineItems, objAnswers, arrRequired, objContext, objSigned, arrTotalsCheck]
  );

  const objHints = useMemo(() => {
    const objResult = {};
    if (objTotals.tagTotal > 0) objResult.hasClimate = 'You entered a TAG amount in the line items, which usually means climate-related spending.';
    if (['foreign_grant', 'foreign_loan'].includes(objRequest.fundingSource)) objResult.proposalTier = 'Foreign-funded proposals are usually Tier 2 (new or expanded).';
    return objResult;
  }, [objTotals.tagTotal, objRequest.fundingSource]);

  const blnDirty = strSavedSnapshot !== null && getDraftSnapshot(objDraft, objSigned) !== strSavedSnapshot;

  const arrRequestLevel = arrRequired.filter((objEntry) => getFormById(objEntry.formId)?.level === FORM_LEVEL.REQUEST);
  const intCompleteForms = arrRequestLevel.filter((objEntry) => getFormCompletion(objEntry.formId, objContext).complete).length;
  const intGoToStep = (strStepId) => updateDraft({ intStep: Math.max(0, STEP_IDS.indexOf(strStepId)) });

  const arrStepper = STEP_TITLES.map((objStep, intIndex) => {
    let strStatus = 'pending';
    if (intIndex === intStep) strStatus = 'active';
    else if (intIndex < intStep) strStatus = arrIssues.some((objIssue) => objIssue.step === objStep.id) ? 'error' : 'completed';
    return { ...objStep, status: strStatus };
  });

  // ── handlers ──
  const handleAnswerChange = (strKey, strValue) => updateDraft((objPrev) => ({ objAnswers: { ...objPrev.objAnswers, [strKey]: strValue } }));

  const handleOverride = (strFormId, objOverride) => updateDraft((objPrev) => ({ objOverrides: { ...objPrev.objOverrides, [strFormId]: objOverride } }));

  const handleUndoOverride = (strFormId) => updateDraft((objPrev) => {
    const objNext = { ...objPrev.objOverrides };
    delete objNext[strFormId];
    return { objOverrides: objNext };
  });

  const handleFormValueChange = (strFormId, strKey, value) => updateDraft((objPrev) => ({
    objFormValues: { ...objPrev.objFormValues, [strFormId]: { ...(objPrev.objFormValues[strFormId] || {}), [strKey]: value } },
  }));

  const handleRegenerate = () => updateDraft({ objSnapshot: { totals: { ...objTotals }, generatedAt: new Date().toISOString() } });

  const handleSignedChange = async (strFormId, objFile) => {
    const strDataUrl = await readFileAsDataUrl(objFile);
    setObjSigned((objPrev) => ({ ...objPrev, [strFormId]: { id: `${strFormId}-${objFile.name}-${objFile.size}`, name: objFile.name, size: objFile.size, type: objFile.type || 'File', lastModified: objFile.lastModified, dataUrl: strDataUrl } }));
  };

  const handleStartOver = () => {
    resetDraft();
    setObjSigned({});
    setStrComment('');
    setStrSavedSnapshot(getDraftSnapshot(createInitialDraft()));
    showToast({ message: 'Started a new request.' });
  };

  const buildHeaderPayload = () => ({
    br_fiscal_year_id: Number(objRequest.fiscalYearId),
    br_planning_period_id: Number(objRequest.planningPeriodId || DEFAULT_PLANNING_PERIOD_ID),
    br_title: objRequest.title.trim(),
    br_description: objRequest.description.trim() || null,
    br_requesting_unit_id: Number(objRequest.unitId),
    br_attached_files: Object.entries(objSigned).map(([strFormId, objFile]) => ({ ...objFile, name: `Signed - ${getFormById(strFormId)?.code} - ${objFile.name}` })),
    // Everything the forms need, so a saved draft reopens exactly where it was and the backend can rebuild the forms
    br_unified_request: {
      request: objRequest,
      step: intStep,
      snapshot: objSnapshot,
      common: objCommon,
      answers: objAnswers,
      requiredForms: arrRequired.map((objEntry) => ({ formId: objEntry.formId, ruleIds: objEntry.ruleIds, reasons: objEntry.reasons })),
      overrides: objOverrides,
      formValues: objFormValues,
      totalsAtGeneration: objSnapshot?.totals || null,
    },
  });

  const toItemPayload = (objItem, intIndex) => ({
    bri_category_id: categoryCodeToId.get(objItem.category) || null,
    bri_cost_structure: objItem.costStructure,
    bri_description: objItem.name.trim(),
    bri_justification: String(objItem.justification || '').trim() || null,
    bri_planned_amount: Number(objItem.amount),
    bri_sort_order: intIndex + 1,
  });

  /**
   * Save the request on the server (create it the first time, update it after that) and return its id.
   * Used by both "Save as draft" and "Submit for review", so a submitted request is always exactly what was last saved.
   */
  const persistToServer = async () => {
    const arrPersistable = arrLineItems.filter(isPersistableItem);
    const objHeader = buildHeaderPayload();
    let intId = intRequestId;
    let arrSavedItems;
    let arrSavedFiles;

    if (!intId) {
      const objCreated = await createBudgetRequest({ ...objHeader, items: arrPersistable.map(toItemPayload) });
      intId = objCreated?.data?.br_id;
      arrSavedFiles = objCreated?.data?.br_attached_files;
      // Read the stored items back so each line item knows its server id
      const objReadBack = await getBudgetRequestById(intId);
      const arrStored = [...((objReadBack?.data ?? objReadBack).items || [])].sort((objA, objB) => Number(objA.bri_sort_order) - Number(objB.bri_sort_order));
      arrSavedItems = arrLineItems.map((objItem) => (isPersistableItem(objItem) ? { ...objItem, briId: arrStored[arrPersistable.indexOf(objItem)]?.bri_id ?? null } : objItem));
      setObjRequestMeta({ referenceNo: objCreated?.data?.br_reference_no || '', status: 'draft' });
    } else {
      // New rows first (they need a server id), then remove the rows the user deleted, then save everything else in one update
      arrSavedItems = [];
      for (const objItem of arrLineItems) {
        if (isPersistableItem(objItem) && !objItem.briId) {
          const objNewItem = await createBudgetRequestItem(intId, toItemPayload(objItem, arrPersistable.indexOf(objItem)));
          arrSavedItems.push({ ...objItem, briId: objNewItem?.data?.bri_id ?? null });
        } else {
          arrSavedItems.push(objItem);
        }
      }
      const arrKeptIds = arrSavedItems.map((objItem) => objItem.briId).filter(Boolean);
      for (const intOldId of refServerItemIds.current) {
        if (!arrKeptIds.includes(intOldId)) await deleteBudgetRequestItem(intId, intOldId);
      }
      const arrItemPayloads = arrSavedItems.filter(isPersistableItem).map((objItem, intIndex) => ({ ...toItemPayload(objItem, intIndex), bri_id: objItem.briId }));
      const objUpdated = await updateBudgetRequest(intId, { ...objHeader, items: arrItemPayloads });
      arrSavedFiles = objUpdated?.data?.br_attached_files;
    }

    refServerItemIds.current = arrSavedItems.map((objItem) => objItem.briId).filter(Boolean);
    const objSavedSigned = signedFromAttachedFiles(arrSavedFiles);
    updateDraft({ arrLineItems: arrSavedItems });
    setObjSigned(objSavedSigned);
    setStrSavedSnapshot(getDraftSnapshot({ ...objDraft, arrLineItems: arrSavedItems }, objSavedSigned));
    setIntRequestId(intId);
    return intId;
  };

  const handleSaveDraft = async (blnLeaveAfter = false) => {
    if (blnSavingDraft) return false;
    if (!objRequest.title.trim() || !objRequest.unitId || !objRequest.fiscalYearId) {
      showToast({ message: 'To save a draft, enter a title, the requesting unit and the fiscal year first.', variant: 'warning' });
      intGoToStep('details');
      return false;
    }

    setBlnSavingDraft(true);
    try {
      const blnWasNew = !intRequestId;
      const intId = await persistToServer();
      if (blnWasNew) {
        detachLocal();
        refLoadedId.current = String(intId);
      }
      showToast({ message: 'Draft saved. You can continue later from Budget Requests.' });
      if (blnLeaveAfter) navigate('/budget-requests');
      else if (blnWasNew) navigate(`/budget-requests/unified/${intId}`, { replace: true });
      return true;
    } catch {
      showToast({ message: 'Cannot perform transaction. Error encountered.', variant: 'danger' });
      return false;
    } finally {
      setBlnSavingDraft(false);
    }
  };

  const handleSubmit = async () => {
    if (blnSubmitting || arrIssues.length > 0) return;
    setBlnSubmitting(true);
    try {
      const intId = await persistToServer();
      await submitBudgetRequest(intId, { actor_id: user?.usr_id ?? user?.id ?? null, comment: strComment.trim() || undefined });
      detachLocal();
      showToast({ message: 'Budget request submitted for review.' });
      navigate('/budget-requests');
    } catch {
      showToast({ message: 'Cannot perform transaction. Error encountered.', variant: 'danger' });
    } finally {
      setBlnSubmitting(false);
    }
  };

  const handleBack = () => {
    if (blnDirty) setBlnLeaveModalOpen(true);
    else navigate('/budget-requests');
  };

  const handleSaveAndLeave = async () => {
    setBlnLeaveModalOpen(false);
    await handleSaveDraft(true);
  };

  if (blnLoadingDraft) {
    return <div className={styles.page}><section className={styles.card}><p className={styles.emptyCell}>Loading your draft...</p></section></div>;
  }

  const strStepId = STEP_IDS[intStep];
  const intUnanswered = countUnansweredQuestions(objAnswers);
  const strStatusText = objRequestMeta.status === 'rejected' ? 'returned by the reviewer - fix it and submit again' : 'saved draft';

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div className={styles.titleRow}>
          <Button variant="ghost" size="sm" leftIcon={<BsArrowLeft />} onClick={handleBack}>Back</Button>
          <div>
            <h5 className="mb-0 fw-semibold">{intRequestId ? 'Edit Budget Request' : 'New Budget Request'}</h5>
            <p className={styles.pageSubtitle}>
              {intRequestId
                ? `${objRequestMeta.referenceNo} - ${strStatusText}${blnDirty ? ' - unsaved changes' : ''}`
                : 'Enter the information once. The system decides which BP forms you need and fills them in for you.'}
            </p>
          </div>
        </div>
        <div className={styles.headerActions}>
          {!intRequestId && <Button variant="ghost" size="sm" onClick={handleStartOver}>Start over</Button>}
          <Button variant="outline" size="sm" loading={blnSavingDraft} onClick={() => handleSaveDraft(false)}>Save as draft</Button>
        </div>
      </header>

      <ProgressSteps steps={arrStepper} size="sm" />

      <div className={styles.layout}>
        <main className={styles.main}>
          {strStepId === 'details' && (
            <StepRequestDetails objRequest={objRequest} arrLineItems={arrLineItems} objOptions={objOptions} blnUnitLocked={intScopedUnitId != null} onRequestChange={updateRequest} onLineItemsChange={(arrNext) => updateDraft({ arrLineItems: arrNext })} />
          )}
          {strStepId === 'questions' && (
            <StepProposalQuestions objAnswers={objAnswers} objHints={objHints} intRequiredCount={arrRequired.length} onAnswerChange={handleAnswerChange} />
          )}
          {strStepId === 'forms' && (
            <StepRequiredForms arrRequired={arrRequired} arrNotInCycle={arrNotInCycle} objOverrides={objOverrides} arrEnabledFormIds={arrEnabledFormIds} strFiscalYearLabel={strFiscalYearLabel} onOverride={handleOverride} onUndoOverride={handleUndoOverride} />
          )}
          {strStepId === 'fill' && (
            <StepPrefilledForms arrRequired={arrRequired} objContext={objContext} blnSnapshotStale={blnSnapshotStale} strSelectedFormId={strSelectedFormId} onSelectForm={setStrSelectedFormId} onFormValueChange={handleFormValueChange} onRegenerate={handleRegenerate} />
          )}
          {strStepId === 'review' && (
            <StepReviewSubmit
              arrIssues={arrIssues}
              arrTotalsCheck={arrTotalsCheck}
              arrRequired={arrRequired}
              objSigned={objSigned}
              objSummary={{ title: objRequest.title, unitName: strUnitName, fiscalYearLabel: strFiscalYearLabel, itemCount: arrLineItems.filter((objItem) => String(objItem.name || '').trim() !== '').length, formCount: arrRequired.length, grandTotal: objTotals.grandTotal }}
              strComment={strComment}
              blnSubmitting={blnSubmitting}
              blnSavingDraft={blnSavingDraft}
              onSignedChange={handleSignedChange}
              onCommentChange={setStrComment}
              onGoToStep={intGoToStep}
              onSubmit={handleSubmit}
              onSaveDraft={() => handleSaveDraft(false)}
            />
          )}

          <div className={styles.navRow}>
            <Button variant="outline" leftIcon={<BsArrowLeft />} disabled={intStep === 0} onClick={() => updateDraft({ intStep: intStep - 1 })}>Back</Button>
            {intStep < STEP_IDS.length - 1 && <Button rightIcon={<BsArrowRight />} onClick={() => updateDraft({ intStep: intStep + 1 })}>Next</Button>}
          </div>
        </main>

        <aside className={styles.side}>
          <BudgetRequestTotalsSummary totals={objTotals} />
          <div className={styles.sideCard}>
            <p className={styles.sideLabel}>BP forms</p>
            <p className={styles.sideValue}>{arrRequired.length} required</p>
            <p className={styles.sideNote}>{intCompleteForms} of {arrRequestLevel.length} request forms complete</p>
            <p className={styles.sideNote}>{arrRequired.length - arrRequestLevel.length} agency-level, completed by other offices</p>
            {intUnanswered > 0 && <p className={styles.sideNote}>{intUnanswered} question{intUnanswered === 1 ? '' : 's'} unanswered</p>}
          </div>
          <div className={styles.sideCard}>
            <p className={styles.sideLabel}>Ready to submit</p>
            <p className={arrIssues.length === 0 ? styles.sideOk : styles.sideBad}>{arrIssues.length === 0 ? 'Yes' : `${arrIssues.length} item${arrIssues.length === 1 ? '' : 's'} to fix`}</p>
          </div>
        </aside>
      </div>

      <Modal
        open={blnLeaveModalOpen}
        onClose={() => setBlnLeaveModalOpen(false)}
        title="You have unsaved changes"
        footer={(
          <>
            <Button variant="ghost" onClick={() => setBlnLeaveModalOpen(false)}>Stay</Button>
            <Button variant="outline" onClick={() => { setBlnLeaveModalOpen(false); navigate('/budget-requests'); }}>Leave without saving</Button>
            <Button onClick={handleSaveAndLeave}>Save as draft and leave</Button>
          </>
        )}
      >
        <p>
          {intRequestId
            ? 'Your latest changes have not been saved to the draft. If you leave now they will be lost.'
            : 'This request is not in your Budget Requests list yet. If you leave without saving, it stays only on this device and other people cannot see it.'}
        </p>
      </Modal>
    </div>
  );
}
