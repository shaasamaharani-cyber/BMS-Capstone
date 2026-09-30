/**
 * System Name: Budget Management System
 * Module Name: Core Module
 *
 * Purpose of this file:
 * Holds the whole unified budget request draft in one state object. A new request is also kept in localStorage so a refresh
 * does not lose it; once the request is saved as a draft on the server, the server copy is the one that counts and the local
 * copy is dropped. Signed-copy files are not stored here (too large).
 *
 * Author(s): QUT Group T214
 *
 * Copyright (C) 2026
 * by the Department of Science and Technology - Central Office
 * All rights reserved.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { DEFAULT_COST_STRUCTURE } from '../../utils/cost_structure';
import { DEFAULT_PLANNING_PERIOD_ID } from '../../utils/budget_request_utils';

export const UNIFIED_DRAFT_KEY = 'dost-bms.unified-request.draft';

let intNextItemId = 1000;
export const createEmptyLineItem = (strCategory = 'MOOE') => {
  intNextItemId += 1;
  return { id: intNextItemId, briId: null, name: '', category: strCategory, costStructure: DEFAULT_COST_STRUCTURE, amount: '', justification: '' };
};

export const createInitialDraft = () => ({
  intStep: 0,
  objRequest: {
    title: '',
    unitId: '',
    fiscalYearId: '',
    planningPeriodId: DEFAULT_PLANNING_PERIOD_ID,
    description: '',
    programPap: '',
    location: '',
    implementationStart: '',
    implementationEnd: '',
    fundingSource: '',
    objectives: '',
  },
  arrLineItems: [createEmptyLineItem('PS'), createEmptyLineItem('MOOE')],
  objAnswers: {},
  objOverrides: {},
  objFormValues: {},
  objSnapshot: null,
});

/** What counts as "unsaved changes": everything the user typed, but not the step they are on or internal ids. */
export function getDraftSnapshot(objDraft, objSigned = {}) {
  return JSON.stringify({
    request: objDraft.objRequest,
    items: objDraft.arrLineItems.map((objItem) => [objItem.name, objItem.category, objItem.costStructure, objItem.amount, objItem.justification]),
    answers: objDraft.objAnswers,
    overrides: objDraft.objOverrides,
    formValues: objDraft.objFormValues,
    signed: Object.entries(objSigned).map(([strFormId, objFile]) => [strFormId, objFile.name, objFile.size]),
  });
}

function readStoredDraft() {
  try {
    const strStored = localStorage.getItem(UNIFIED_DRAFT_KEY);
    if (!strStored) return createInitialDraft();
    const objStored = JSON.parse(strStored);
    const objInitial = createInitialDraft();
    return { ...objInitial, ...objStored, objRequest: { ...objInitial.objRequest, ...objStored.objRequest } };
  } catch {
    return createInitialDraft();
  }
}

export function useUnifiedRequestDraft(blnUseLocal) {
  const [objDraft, setObjDraft] = useState(() => (blnUseLocal ? readStoredDraft() : createInitialDraft()));
  const refLocalStopped = useRef(false);

  useEffect(() => {
    if (!blnUseLocal || refLocalStopped.current) return;
    try {
      localStorage.setItem(UNIFIED_DRAFT_KEY, JSON.stringify(objDraft));
    } catch {
      // Storage full or unavailable - the draft just stays in memory
    }
  }, [objDraft, blnUseLocal]);

  const updateDraft = useCallback((objPatch) => {
    setObjDraft((objPrev) => ({ ...objPrev, ...(typeof objPatch === 'function' ? objPatch(objPrev) : objPatch) }));
  }, []);

  const updateRequest = useCallback((objPatch) => {
    setObjDraft((objPrev) => ({ ...objPrev, objRequest: { ...objPrev.objRequest, ...objPatch } }));
  }, []);

  const replaceDraft = useCallback((objNext) => setObjDraft(objNext), []);

  // Once the draft lives on the server, stop writing (and remove) the browser-only copy
  const detachLocal = useCallback(() => {
    refLocalStopped.current = true;
    try {
      localStorage.removeItem(UNIFIED_DRAFT_KEY);
    } catch {
      // nothing to remove
    }
  }, []);

  const resetDraft = useCallback(() => {
    refLocalStopped.current = false;
    try {
      localStorage.removeItem(UNIFIED_DRAFT_KEY);
    } catch {
      // nothing to clear
    }
    setObjDraft(createInitialDraft());
  }, []);

  return { objDraft, updateDraft, updateRequest, replaceDraft, detachLocal, resetDraft };
}
