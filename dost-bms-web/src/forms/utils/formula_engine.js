/**
 * System Name: Budget Management System
 * Module Name: Forms Module
 *
 * Purpose of this file:
 * Provide helper functions and utility methods for formula_engine.
 *
 * Author(s): QUT Group 27
 *
 * Copyright (C) 2026
 * by the Department of Science and Technology - Central Office
 * Developed by Team 27, Queensland University of Technology
 * All rights reserved.
 */

import { evaluate } from 'mathjs';

export function computeValue(formula, context) {
  try {
    const result = evaluate(formula, context);
    return typeof result === 'number' && Number.isFinite(result) ? Math.round(result) : 0;
  } catch {
    return 0;
  }
}

export function recomputeRow(row, columns) {
  const updated = { ...row };

  columns
    .filter((col) => col.type === 'computed' && col.formula)
    .forEach((col) => {
      updated[col.key] = computeValue(col.formula, updated);
    });

  return updated;
}
