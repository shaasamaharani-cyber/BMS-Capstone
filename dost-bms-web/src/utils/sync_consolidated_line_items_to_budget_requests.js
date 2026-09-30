/**
 * System Name: Budget Management System
 * Module Name: None
 *
 * Purpose of this file:
 * Provide helper functions and utility methods for sync_consolidated_line_items_to_budget_requests.
 *
 * Author(s): QUT Group 27
 *
 * Copyright (C) 2026
 * by the Department of Science and Technology - Central Office
 * Developed by Team 27, Queensland University of Technology
 * All rights reserved.
 */

import { updateBudgetRequestItem } from '../api/budget_request_items_api';
import { reviewBudgetRequest } from '../api/budget_requests_api';
import { DEFAULT_COST_STRUCTURE, normalizeCostStructure } from './cost_structure';


function isSameConsolidatedRowId(left, right) {
  return String(left) === String(right);
}


export function inferConsolidatedSourceItemId(item) {
  const rowId = item?.id ?? item?.ubi_id;
  const candidates = [
    item?.budgetRequestItemId,
    item?.ubi_budget_request_item_id,
    item?.sourceItemId,
    item?.bri_id,
  ];

  for (const candidate of candidates) {
    if (candidate == null || candidate === '') {
      continue;
    }
    if (rowId != null && rowId !== '' && isSameConsolidatedRowId(candidate, rowId)) {
      continue;
    }
    return candidate;
  }

  const match = String(item?.id || '').match(/-(\d+)$/);
  return match ? match[1] : '';
}


function consolidatedLineItemLinkKey(section, item) {
  const requestId = item?.sourceRequestId ?? section?.sourceRequestId ?? '';
  const budgetItemId = inferConsolidatedSourceItemId(item);
  return `${requestId}::${budgetItemId}`;
}


export function ensureBudgetRequestLineItemLinks(item = {}, section = {}) {
  const sourceRequestId = item.sourceRequestId ?? section.sourceRequestId ?? '';
  const budgetRequestItemId = inferConsolidatedSourceItemId({
    ...item,
    sourceRequestId,
  });

  return {
    ...item,
    requestId: item.requestId || section.requestId || '',
    sourceRequestId,
    sourceItemId: budgetRequestItemId || item.sourceItemId || item.budgetRequestItemId || '',
    budgetRequestItemId: budgetRequestItemId || item.budgetRequestItemId || item.sourceItemId || '',
  };
}


export function ensureBudgetRequestSectionLinks(section = {}) {
  const sourceRequestId = section.sourceRequestId ?? '';

  return {
    ...section,
    sourceRequestId,
    items: (Array.isArray(section.items) ? section.items : []).map((item) => (
      ensureBudgetRequestLineItemLinks(item, section)
    )),
  };
}


/**
 * After save, keep the user's in-memory line item fields (name, amount, etc.)
 * and only adopt stable ids / BR links returned by the server.
 */
export function remapConsolidatedLineItemsAfterSave(previousSections, serverSections) {
  if (!Array.isArray(previousSections) || previousSections.length === 0) {
    return serverSections;
  }
  if (!Array.isArray(serverSections) || serverSections.length === 0) {
    return previousSections;
  }

  const serverByLinkKey = new Map();
  serverSections.forEach((section) => {
    (Array.isArray(section.items) ? section.items : []).forEach((item) => {
      const key = consolidatedLineItemLinkKey(section, item);
      if (!key.endsWith('::')) {
        serverByLinkKey.set(key, { item, section });
      }
    });
  });

  return previousSections.map((section) => {
    const serverSection = serverSections.find((entry) => (
      isSameConsolidatedRowId(entry.sourceRequestId ?? '', section.sourceRequestId ?? '') ||
      isSameConsolidatedRowId(entry.requestId ?? '', section.requestId ?? '')
    ));
    const serverItems = Array.isArray(serverSection?.items) ? serverSection.items : [];

    return ensureBudgetRequestSectionLinks({
      ...section,
      requestId: section.requestId || serverSection?.requestId || '',
      sourceRequestId: section.sourceRequestId || serverSection?.sourceRequestId || '',
      requestTitle: section.requestTitle || serverSection?.requestTitle || 'Untitled Request',
      items: (Array.isArray(section.items) ? section.items : []).map((item, itemIdx) => {
        const key = consolidatedLineItemLinkKey(section, item);
        const match = serverByLinkKey.get(key);
        const serverItem = match?.item || serverItems[itemIdx];

        if (!serverItem) {
          return ensureBudgetRequestLineItemLinks(item, section);
        }

        const budgetRequestItemId = (
          inferConsolidatedSourceItemId(serverItem) ||
          inferConsolidatedSourceItemId(item)
        );

        return ensureBudgetRequestLineItemLinks({
          ...item,
          id: serverItem.id,
          sourceItemId: budgetRequestItemId,
          budgetRequestItemId,
        }, section);
      }),
    });
  });
}


function addSourceBudgetRequestId(setIds, value) {
  const intId = Number(value);
  if (Number.isFinite(intId) && intId > 0) {
    setIds.add(intId);
  }
}

/**
 * Collects unique source budget request ids from consolidation payload sections.
 *
 * @param {object[]} consolidatedLineItems
 * @param {Array<string|number>} arrBudgetRequestIds
 * @returns {number[]}
 */
export function collectSourceBudgetRequestIds(consolidatedLineItems = [], arrBudgetRequestIds = [])
{
  const setIds = new Set();

  (Array.isArray(arrBudgetRequestIds) ? arrBudgetRequestIds : []).forEach((value) => {
    addSourceBudgetRequestId(setIds, value);
  });

  (Array.isArray(consolidatedLineItems) ? consolidatedLineItems : []).forEach((section) => {
    addSourceBudgetRequestId(setIds, section?.sourceRequestId);
    (Array.isArray(section?.items) ? section.items : []).forEach((item) => {
      addSourceBudgetRequestId(setIds, item?.sourceRequestId);
    });
  });

  return [...setIds];
}

/**
 * Marks linked reviewed budget requests as consolidated after unified budget submit.
 *
 * @param {object[]} consolidatedLineItems
 * @param {Array<string|number>} arrBudgetRequestIds
 * @param {{ actorId?: string|number|null }} [objOptions]
 * @returns {Promise<{ updatedCount: number, failures: object[] }>}
 */
export async function markBudgetRequestsConsolidated(
  consolidatedLineItems = [],
  arrBudgetRequestIds = [],
  objOptions = {}
)
{
  const arrRequestIds = collectSourceBudgetRequestIds(consolidatedLineItems, arrBudgetRequestIds);

  if (arrRequestIds.length === 0) {
    return { updatedCount: 0, failures: [] };
  }

  const results = await Promise.allSettled(
    arrRequestIds.map((intRequestId) =>
      reviewBudgetRequest(intRequestId, {
        action: 'validate',
        actor_id: objOptions.actorId ?? null,
      })
    )
  );

  const failures = results
    .map((result, intIndex) => ({ result, requestId: arrRequestIds[intIndex] }))
    .filter(({ result }) => result.status === 'rejected')
    .map(({ result, requestId }) => ({
      requestId,
      reason: result.reason?.message || String(result.reason || 'Update failed'),
    }));

  return {
    updatedCount: results.filter((result) => result.status === 'fulfilled').length,
    failures,
  };
}

export function collectLinkedConsolidatedLineItems(consolidatedLineItems = []) {
  return (Array.isArray(consolidatedLineItems) ? consolidatedLineItems : [])
    .flatMap((section) => (
      (Array.isArray(section.items) ? section.items : []).map((item) => ({
        ...item,
        sourceRequestId: item.sourceRequestId || section.sourceRequestId,
        sourceItemId: inferConsolidatedSourceItemId(item),
      }))
    ))
    .filter((item) => item.sourceRequestId && item.sourceItemId);
}


export async function syncConsolidatedLineItemsToBudgetRequests(
  consolidatedLineItems,
  categoryCodeToIdMap = new Map()
) {
  const linkedItems = collectLinkedConsolidatedLineItems(consolidatedLineItems);

  if (linkedItems.length === 0) {
    return { syncedCount: 0, failures: [] };
  }

  const results = await Promise.allSettled(linkedItems.map((item) => {
    const categoryId = categoryCodeToIdMap.get(String(item.category || '').trim().toUpperCase()) || null;
    return updateBudgetRequestItem(Number(item.sourceRequestId), Number(item.sourceItemId), {
      bri_category_id: categoryId,
      bri_cost_structure: normalizeCostStructure(item.costStructure) || DEFAULT_COST_STRUCTURE,
      bri_description: String(item.name || '').trim(),
      bri_planned_amount: item.amount === '' ? null : Number(item.amount),
      bri_justification: String(item.justification || '').trim() || null,
    });
  }));

  const failures = results
    .map((result, index) => ({ result, item: linkedItems[index] }))
    .filter(({ result }) => result.status === 'rejected')
    .map(({ result, item }) => ({
      sourceRequestId: item.sourceRequestId,
      sourceItemId: item.sourceItemId,
      reason: result.reason?.message || String(result.reason || 'Update failed'),
    }));

  return {
    syncedCount: results.filter((result) => result.status === 'fulfilled').length,
    failures,
  };
}
