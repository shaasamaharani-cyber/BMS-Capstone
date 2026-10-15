/**
 * System Name: Budget Management System
 * Module Name: Utilities Module
 *
 * Purpose of this file:
 * Pre-submission checks for the unified budget request: required fields, no negative amounts, every question answered,
 * every required form complete, signed copies uploaded, and form totals that agree with the request totals.
 * These run in the browser for now; the Laravel backend must repeat them because the browser is not a trusted place.
 *
 * Author(s): QUT Group T214
 *
 * Copyright (C) 2026
 * by the Department of Science and Technology - Central Office
 * All rights reserved.
 */

import { CATEGORY_FORM_MAP, getFormCompletion, getFormDefinition } from '../bp_forms/bp_form_fields.js';
import { BP_FORM_CATALOG, FORM_ENGINE, FORM_LEVEL, getFormById } from '../bp_forms/bp_form_catalog.js';
import { countUnansweredQuestions } from '../bp_forms/bp_form_rules.js';
import { validateTitle } from './input_validation.js';

export const STEP_IDS = ['details', 'questions', 'forms', 'fill', 'review'];

const isCompleteLineItem = (objItem) => String(objItem.name || '').trim() !== '' && objItem.amount !== '' && objItem.amount !== null;

/**
 * Compare the request totals with the totals captured when the forms were generated (step 4).
 * If someone edits a line item afterwards, the two disagree and the forms must be regenerated.
 */
export function buildTotalsCheck(objTotals, objSnapshot, arrRequiredFormIds, arrEnabledFormIds = BP_FORM_CATALOG.map((objForm) => objForm.id), arrApplicableFormIds) {
  return CATEGORY_FORM_MAP.map((objMap) => {
    const numRequestTotal = objTotals[objMap.totalKey] || 0;
    const blnHasForm = arrRequiredFormIds.includes(objMap.formId);
    const objForm = getFormById(objMap.formId);

    if (numRequestTotal === 0) return { ...objMap, requestTotal: 0, formTotal: 0, formCode: objForm?.code, status: 'none' };
    if (!arrEnabledFormIds.includes(objMap.formId)) return { ...objMap, requestTotal: numRequestTotal, formTotal: null, formCode: objForm?.code, status: 'disabled' };
    if (!blnHasForm && arrApplicableFormIds && !arrApplicableFormIds.includes(objMap.formId)) return { ...objMap, requestTotal: numRequestTotal, formTotal: null, formCode: objForm?.code, status: 'not_required' };
    if (!blnHasForm) return { ...objMap, requestTotal: numRequestTotal, formTotal: null, formCode: objForm?.code, status: 'no_form' };
    if (!objSnapshot) return { ...objMap, requestTotal: numRequestTotal, formTotal: null, formCode: objForm?.code, status: 'not_generated' };

    const numFormTotal = objSnapshot.totals[objMap.totalKey] || 0;
    return { ...objMap, requestTotal: numRequestTotal, formTotal: numFormTotal, formCode: objForm?.code, status: numFormTotal === numRequestTotal ? 'match' : 'stale' };
  });
}

/** Returns the list of things still blocking submission: [{ id, step, message }]. An empty list means ready. */
export function collectSubmissionIssues({ arrCatalog = BP_FORM_CATALOG, objRequest, arrLineItems, objAnswers, arrRequired, objContext, objSigned, objTotalsCheck, arrCycleDocs = [], arrSupporting = [] }) {
  const arrIssues = [];
  const add = (strId, strStep, strMessage) => arrIssues.push({ id: strId, step: strStep, message: strMessage });

  // Step 1 - details
  if (!String(objRequest.title || '').trim()) add('title', 'details', 'Enter a title for the request.');
  // Same character rule as consolidated budget titles (ITD Security Standard §2.11)
  else if (validateTitle(objRequest.title)) add('title', 'details', validateTitle(objRequest.title));
  if (!objRequest.unitId) add('unit', 'details', 'Choose the requesting unit.');
  if (!objRequest.fiscalYearId) add('fy', 'details', 'Choose the fiscal year.');
  if (!objRequest.fundingSource) add('funding', 'details', 'Choose the funding source (it decides whether BP Form 203 applies).');

  const arrCompleteItems = arrLineItems.filter(isCompleteLineItem);
  if (arrCompleteItems.length === 0) add('items', 'details', 'Add at least one budget line item with an amount.');
  if (arrCompleteItems.some((objItem) => Number(objItem.amount) < 0)) add('negative', 'details', 'Amounts cannot be negative in a budget request.');
  if (arrCompleteItems.some((objItem) => Number(objItem.amount) === 0)) add('zero', 'details', 'Remove line items with a zero amount or enter an amount.');

  // Step 2 - questions
  const intUnanswered = countUnansweredQuestions(objAnswers);
  if (intUnanswered > 0) add('questions', 'questions', `${intUnanswered} proposal question${intUnanswered === 1 ? '' : 's'} still unanswered.`);

  // Step 4 - every request-level form filled in (agency-level forms are completed by other offices at consolidation)
  arrRequired.forEach((objEntry) => {
    const objForm = getFormById(objEntry.formId, arrCatalog);
    if (objForm?.level === FORM_LEVEL.AGENCY) return;
    const objCompletion = getFormCompletion(objEntry.formId, objContext);
    if (!objCompletion.complete) {
      add(`form-${objEntry.formId}`, 'fill', `${objForm?.code} is incomplete.${objCompletion.errors?.length ? ` ${objCompletion.errors.map((error) => `${error.label}: ${error.message}`).join(' ')}` : ` ${objCompletion.filled} of ${objCompletion.total} required fields are complete.`}`);
    }
  });

  // Step 5 - signed copies for generated and custom manual request forms, and totals
  arrRequired.forEach((objEntry) => {
    const objForm = getFormById(objEntry.formId, arrCatalog);
    if ([FORM_ENGINE.DYNAMIC, FORM_ENGINE.MANUAL].includes(objForm?.engine) && objForm.level === FORM_LEVEL.REQUEST && !objSigned[objEntry.formId]) {
      add(`signed-${objEntry.formId}`, 'review', `Upload the signed copy of ${objForm.code}.`);
    } else if (objForm?.level === FORM_LEVEL.REQUEST && objSigned[objEntry.formId]?.formDefinition && objSigned[objEntry.formId].formDefinition !== JSON.stringify(getFormDefinition(objEntry.formId, objContext))) {
      add(`signed-${objEntry.formId}`, 'review', `${objForm.code} fields changed. Complete the updated form and replace its signed copy.`);
    }
  });

  // Supporting documents the budget cycle marks as required (DOST answer 7)
  arrCycleDocs.filter((objDoc) => objDoc.required).forEach((objDoc) => {
    if (!arrSupporting.some((objFile) => objFile.docName === objDoc.name)) add(`doc-${objDoc.name}`, 'review', `Upload the ${objDoc.name}.`);
  });

  objTotalsCheck.forEach((objRow) => {
    if (objRow.status === 'no_form') add(`total-${objRow.category}`, 'forms', `${objRow.category} amounts are not covered by any form. Add ${objRow.formCode} to the required forms.`);
    if (objRow.status === 'stale') add(`total-${objRow.category}`, 'fill', `${objRow.category} total changed after the forms were generated. Regenerate the forms.`);
    if (objRow.status === 'not_generated') add(`total-${objRow.category}`, 'fill', `Open the forms step so ${objRow.formCode} can be generated.`);
  });

  return arrIssues;
}
