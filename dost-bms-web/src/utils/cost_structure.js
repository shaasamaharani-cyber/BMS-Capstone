/**
 * System Name: Budget Management System
 * Module Name: Utilities Module
 *
 * Purpose of this file:
 * Provide helper functions and utility methods for cost_structure.
 *
 * Author(s): QUT Group 27
 *
 * Copyright (C) 2026
 * by the Department of Science and Technology - Central Office
 * Developed by Team 27, Queensland University of Technology
 * All rights reserved.
 */

export const COST_STRUCTURE_OPTIONS = [
  'General Administration and Support',
  'Support to Operations',
  'Operations',
];

export const DEFAULT_COST_STRUCTURE = COST_STRUCTURE_OPTIONS[0];

// Display abbreviations used in compact UI (e.g. budget line-item tables).
// Data stored in the backend keeps the full name; abbreviations are
// presentation-only.
export const COST_STRUCTURE_ABBREVIATIONS = {
  'General Administration and Support': 'GAS',
  'Support to Operations': 'SO',
  'Operations': 'O',
};

export function normalizeCostStructure(value) {
  const raw = String(value || '').trim();
  return COST_STRUCTURE_OPTIONS.includes(raw) ? raw : '';
}

// Returns the short abbreviation for a cost-structure value, or '' if the
// value is unknown.
export function getCostStructureAbbreviation(value) {
  return COST_STRUCTURE_ABBREVIATIONS[value] || '';
}
