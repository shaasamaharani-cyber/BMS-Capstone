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
