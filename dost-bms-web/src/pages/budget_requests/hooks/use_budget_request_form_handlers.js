/**
 * System Name: Budget Management System
 * Module Name: Budget Requests
 *
 * Purpose of this file:
 * Custom hook that centralises field-change and line-item validation logic for the budget request create/edit forms.
 *
 * Author(s): QUT Group 27
 *
 * Copyright (C) 2026
 * by the Department of Science and Technology - Central Office
 * Developed by Team 27, Queensland University of Technology
 * All rights reserved.
 */

import { useCallback } from 'react';
import {
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
} from '../../../utils/input_validation';
import { DEFAULT_COST_STRUCTURE } from '../../../utils/cost_structure';

export function useBudgetRequestFormHandlers({
  setTitle,
  setUnit,
  setDescription,
  setFiscalYear,
  setPlanningPeriod,
  setComment,
  setLineItems,
  setErrors,
  planningPeriodAllowedIds = null,
}) {
  const handleLineItemChange = useCallback(
    (itemId, field, value) => {
      setLineItems((prevItems) =>
        prevItems.map((item) => {
          if (item.id !== itemId) return item;
          if (field === 'amount') {
            if (value === '') return { ...item, amount: '' };
            const parsed = Number(value);
            return { ...item, amount: Number.isNaN(parsed) ? '' : parsed };
          }
          return { ...item, [field]: value };
        })
      );
    },
    [setLineItems]
  );

  const setLineItemFieldError = useCallback(
    (rowIdx, field, message) => {
      setErrors((prev) => {
        const lineItemErrors = [...(prev.lineItemErrors || [])];
        lineItemErrors[rowIdx] = { ...lineItemErrors[rowIdx], [field]: message };
        return { ...prev, lineItemErrors };
      });
    },
    [setErrors]
  );

  const handleSharedFieldChange = useCallback(
    (field, value) => {
      if (field === 'title') {
        setTitle(value);
        setErrors((prev) => ({ ...prev, title: validateTitle(value) }));
        return;
      }
      if (field === 'unit') {
        setUnit(value);
        setErrors((prev) => ({ ...prev, unit: validateUnit(value) }));
        return;
      }
      if (field === 'description') {
        setDescription(value);
        setErrors((prev) => ({ ...prev, description: validateDescription(value) }));
        return;
      }
      if (field === 'fiscalYear') {
        setFiscalYear(value);
        setErrors((prev) => ({ ...prev, fiscalYear: validateFiscalYear(value) }));
        return;
      }
      if (field === 'planningPeriod') {
        if (typeof setPlanningPeriod === 'function') {
          setPlanningPeriod(value);
        }
        const allowed =
          Array.isArray(planningPeriodAllowedIds) && planningPeriodAllowedIds.length > 0
            ? planningPeriodAllowedIds
            : null;
        setErrors((prev) => ({
          ...prev,
          planningPeriod: validatePlanningPeriod(value, allowed),
        }));
        return;
      }
      if (field === 'comment') {
        setComment(value);
        setErrors((prev) => ({ ...prev, comment: validateComment(value) }));
        return;
      }
    },
    [setTitle, setUnit, setDescription, setFiscalYear, setPlanningPeriod, setComment, setErrors, planningPeriodAllowedIds]
  );

  const handleSharedLineItemChange = useCallback(
    (id, field, value, rowIdx) => {
      handleLineItemChange(id, field, value);
      if (field === 'name') {
        setLineItemFieldError(rowIdx, 'name', validateLineItemName(value));
        return;
      }
      if (field === 'amount') {
        setLineItemFieldError(rowIdx, 'amount', validateLineItemAmount(value));
        return;
      }
      if (field === 'costStructure') {
        setLineItemFieldError(rowIdx, 'costStructure', validateCostStructure(value));
        return;
      }
      if (field === 'justification') {
        setLineItemFieldError(rowIdx, 'justification', validateJustification(value));
      }
    },
    [handleLineItemChange, setLineItemFieldError]
  );

  const handleAddNewItem = useCallback(
    (defaultCategoryCode) => {
      setLineItems((prevItems) => {
        const nextId =
          prevItems.length > 0 ? Math.max(...prevItems.map((item) => item.id)) + 1 : 1;
        return [
          ...prevItems,
          {
            id: nextId,
            name: '',
            category: defaultCategoryCode || 'PS',
            costStructure: DEFAULT_COST_STRUCTURE,
            amount: '',
            justification: '',
          },
        ];
      });
    },
    [setLineItems]
  );

  const handleDeleteItem = useCallback(
    (itemId) => {
      setLineItems((prevItems) => prevItems.filter((item) => item.id !== itemId));
    },
    [setLineItems]
  );

  return {
    handleLineItemChange,
    setLineItemFieldError,
    handleSharedFieldChange,
    handleSharedLineItemChange,
    handleAddNewItem,
    handleDeleteItem,
  };
}
