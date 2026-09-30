/**
 * System Name: Budget Management System
 * Module Name: None
 *
 * Purpose of this file:
 * Provide helper functions and utility methods for consolidation_line_rows.
 *
 * Author(s): QUT Group 27
 *
 * Copyright (C) 2026
 * by the Department of Science and Technology - Central Office
 * Developed by Team 27, Queensland University of Technology
 * All rights reserved.
 */

import { COST_STRUCTURE_OPTIONS, DEFAULT_COST_STRUCTURE, normalizeCostStructure } from './cost_structure';
import { toAmount } from './helpers';

const getCostStructure = (value) =>
  normalizeCostStructure(value) || DEFAULT_COST_STRUCTURE;

/** Default category iteration order for consolidation tables */
export const CONSOLIDATION_CATEGORY_ORDER = ['PS', 'MOOE', 'CO', 'TAG'];

/**
 * @param {Array<{
 *   requestId?: string,
 *   requestTitle?: string,
 *   requestingUnit?: string,
 *   items?: Array<object>
 * }>} sections
 * @param {{ categoryOrder?: string[] }} [options]
 * @returns {Array<object>}
 */
export function buildConsolidationLineRows(sections, options = {}) {
  const categoryOrder = options.categoryOrder || CONSOLIDATION_CATEGORY_ORDER;
  const rows = [];
  const list = Array.isArray(sections) ? sections : [];

  const byUnit = new Map();
  list.forEach((section) => {
    const rawUnit = String(section.requestingUnit || 'Unknown Unit').trim();
    const requestingUnit = rawUnit !== '' ? rawUnit : 'Unknown Unit';
    if (!byUnit.has(requestingUnit)) {
      byUnit.set(requestingUnit, []);
    }
    byUnit.get(requestingUnit).push(section);
  });

  let unitSeq = 0;
  byUnit.forEach((unitSections, requestingUnit) => {
    unitSeq += 1;

    let unitSubtotal = 0;
    unitSections.forEach((section) => {
      const items = Array.isArray(section.items) ? section.items : [];
      unitSubtotal += items.reduce((sum, item) => sum + toAmount(item.amount), 0);
    });

    const hasItems = unitSections.some((section) => (section.items || []).length > 0);

    rows.push({
      rowType: 'unit-header',
      id: `unit-h-${unitSeq}`,
      unitKey: requestingUnit,
      requestingUnit,
      subtotal: unitSubtotal,
      hasItems,
    });

    unitSections.forEach((section) => {
      const requestId = String(section.requestId || '').trim() || `REQ-${rows.length}`;
      const items = Array.isArray(section.items) ? section.items : [];
      const sectionSubtotal = items.reduce((sum, item) => sum + toAmount(item.amount), 0);

      rows.push({
        rowType: 'request-header',
        id: `req-h-${requestId}`,
        unitKey: requestingUnit,
        requestId,
        sourceRequestId: section.sourceRequestId,
        requestTitle: section.requestTitle || 'Untitled Request',
        requestingUnit,
        subtotal: sectionSubtotal,
        hasItems: items.length > 0,
      });

      const costStructures = [
        ...new Set([
          ...COST_STRUCTURE_OPTIONS,
          ...items
            .map((item) => getCostStructure(item.costStructure))
            .filter((value) => !COST_STRUCTURE_OPTIONS.includes(value)),
        ]),
      ];

      costStructures.forEach((costStructure, costIdx) => {
        const itemsInCostStructure = items.filter(
          (item) => getCostStructure(item.costStructure) === costStructure
        );
        if (itemsInCostStructure.length === 0) return;

        rows.push({
          rowType: 'cost-structure',
          id: `cost-${requestId}-${costIdx}`,
          costStructure,
          requestId,
          sourceRequestId: section.sourceRequestId,
          requestingUnit,
        });

        categoryOrder.forEach((category) => {
          const itemsInCategory = itemsInCostStructure.filter((item) => item.category === category);
          if (itemsInCategory.length === 0) {
            return;
          }

          rows.push({
            rowType: 'category',
            id: `cat-${requestId}-${costIdx}-${category}`,
            category,
            costStructure,
            requestId,
            requestingUnit,
          });

          itemsInCategory.forEach((item) => {
            rows.push({
              rowType: 'item',
              id: `item-${item.id}`,
              sourceItemId: item.sourceItemId,
              requestId: item.requestId || requestId,
              sourceRequestId: item.sourceRequestId || section.sourceRequestId,
              requestingUnit: item.requestingUnit || requestingUnit,
              category: item.category,
              costStructure: getCostStructure(item.costStructure),
              name: item.name,
              amount: toAmount(item.amount),
              justification: item.justification,
            });
          });
        });
      });
    });
  });

  return rows;
}
