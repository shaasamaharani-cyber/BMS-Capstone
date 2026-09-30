/**
 * System Name: Budget Management System
 * Module Name: Utilities Module
 *
 * Purpose of this file:
 * Provide helper functions and utility methods for input_validation.
 *
 * Author(s): QUT Group 27
 *
 * Copyright (C) 2026
 * by the Department of Science and Technology - Central Office
 * Developed by Team 27, Queensland University of Technology
 * All rights reserved.
 */

/**
 * Input Validation Utility
 *
 * Implements client-side input validation aligned with the ITD Security Standard §2:
 *   §2.5  — All validation failures result in input rejection.
 *   §2.9  — Validate against a whitelist of allowed characters.
 *   §2.10 — Validate expected data types, data range, and data length.
 *   §2.11 — Detect potentially hazardous characters.
 *   §2.12 — Detect null bytes, CRLF injection, and path traversal sequences.
 *
 * NOTE (§2.1): Client-side validation is a UX safeguard only.
 * All inputs MUST also be validated server-side on a trusted system.
 */

// ---------------------------------------------------------------------------
// §2.10 — Maximum field lengths
// ---------------------------------------------------------------------------
export const MAX_LENGTHS = {
  title: 255,
  unit: 255,
  description: 2000,
  lineItemName: 255,
  justification: 1000,
  comment: 1000,
};

// ---------------------------------------------------------------------------
// §2.11 — Hazardous characters that require additional controls
// (< > " ' % ( ) & + \ ! |)
// ---------------------------------------------------------------------------
const HAZARDOUS_CHARS_RE = /[<>"'%()&+\\!|]/;
const COST_STRUCTURE_OPTIONS = new Set([
  'General Administration and Support',
  'Support to Operations',
  'Operations',
]);

// ---------------------------------------------------------------------------
// §2.12 — Dangerous byte / pattern sequences
// ---------------------------------------------------------------------------
const NULL_BYTE_RE = /\x00|%00/i;
const PATH_TRAVERSAL_RE = /\.\.[/\\]|%c0%ae|%2e%2e[%2f%5c]/i;
// CRLF — \r is rejected in all fields; \n is allowed in multiline fields only
const CR_RE = /\r/;

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** §2.12 — Returns true if value contains null bytes, path traversal, or CR. */
function hasDangerousPatterns(value) {
  return NULL_BYTE_RE.test(value) || PATH_TRAVERSAL_RE.test(value) || CR_RE.test(value);
}

/** §2.11 — Returns true if value contains hazardous characters. */
function hasHazardousChars(value) {
  return HAZARDOUS_CHARS_RE.test(value);
}

/** §2.10 — Returns true if value exceeds the allowed maximum length. */
function exceedsMaxLength(value, max) {
  return value.length > max;
}

// ---------------------------------------------------------------------------
// Per-field validators — each returns an error string or '' if valid
// ---------------------------------------------------------------------------

/**
 * Validate the budget request title.
 * §2.9  whitelist: printable characters excluding dangerous sequences
 * §2.10 length: 1–255
 * §2.11 hazardous character detection
 * §2.12 null byte / path traversal / CR detection
 */
export function validateTitle(value) {
  const v = value ?? '';
  if (!v.trim()) return 'Title is required.';
  if (hasDangerousPatterns(v))
    return 'Title contains invalid characters or patterns (null bytes, path sequences, or carriage returns are not allowed).';
  if (hasHazardousChars(v))
    return `Title contains potentially unsafe characters (< > " ' % ( ) & + \\ ! |). Remove them before saving.`;
  if (exceedsMaxLength(v.trim(), MAX_LENGTHS.title))
    return `Title must not exceed ${MAX_LENGTHS.title} characters.`;
  return '';
}

/**
 * Validate the requesting unit.
 * §2.10 length: 1–255
 * §2.11/§2.12 same as title
 */
export function validateUnit(value) {
  const v = value ?? '';
  if (!String(v).trim()) return 'Requesting Unit is required.';

  // When unit is a dropdown selection, it is an ID.
  const num = Number(v);
  if (!Number.isNaN(num) && Number.isInteger(num)) {
    if (num < 1) return 'Requesting Unit must be a valid selection.';
    return '';
  }

  // Backward-compatible: if unit is still passed as free text, validate it safely.
  if (hasDangerousPatterns(String(v)))
    return 'Requesting Unit contains invalid characters or patterns.';
  if (hasHazardousChars(String(v)))
    return `Requesting Unit contains potentially unsafe characters (< > " ' % ( ) & + \\ ! |).`;
  if (exceedsMaxLength(String(v).trim(), MAX_LENGTHS.unit))
    return `Requesting Unit must not exceed ${MAX_LENGTHS.unit} characters.`;
  return '';
}

/**
 * Validate description (optional multiline field).
 * \n is permitted; \r, null bytes, and path traversal are not.
 * §2.10 length: 0–2000
 * §2.12 null byte / path traversal / CR detection
 */
export function validateDescription(value) {
  const v = value ?? '';
  if (!v) return '';
  if (NULL_BYTE_RE.test(v) || PATH_TRAVERSAL_RE.test(v) || CR_RE.test(v))
    return 'Description contains invalid characters or patterns.';
  if (exceedsMaxLength(v, MAX_LENGTHS.description))
    return `Description must not exceed ${MAX_LENGTHS.description} characters.`;
  return '';
}

/**
 * Validate fiscal year selection.
 * §2.9  whitelist: must be one of the explicitly allowed year strings
 * §2.10 data type: string representation of a 4-digit year
 */
const CURRENT_FISCAL_YEAR = new Date().getFullYear();
const FISCAL_YEAR_RANGE_COUNT = 7;

export const ALLOWED_FISCAL_YEARS = Array.from(
  { length: FISCAL_YEAR_RANGE_COUNT },
  (_, index) => String(CURRENT_FISCAL_YEAR + index)
);

export function validateFiscalYear(value) {
  if (!value) return 'Fiscal Year is required.';

  const num = Number(value);
  if (Number.isNaN(num) || !Number.isInteger(num)) {
    return 'Fiscal Year must be a valid selection.';
  }

  // When the value looks like a 4-digit year, enforce the stricter year rules.
  if (String(value).length === 4) {
    if (num < CURRENT_FISCAL_YEAR) {
      return `Fiscal Year must be ${CURRENT_FISCAL_YEAR} or later.`;
    }
    if (!ALLOWED_FISCAL_YEARS.includes(String(value)))
      return 'Please select a valid fiscal year from the list.';
    return '';
  }

  // Otherwise treat as a fiscal year ID (fy_id).
  if (num < 1) return 'Fiscal Year must be a valid selection.';
  return '';
}

/**
 * Validate planning period selection (reference id from planning-periods).
 *
 * @param {string|number} value Selected pp_id
 * @param {string[]|null} arrAllowedIds Whitelist of allowed pp_id strings; omit when unknown
 * @returns {string} Error message or empty string when valid
 */
export function validatePlanningPeriod(value, arrAllowedIds = null) {
  const str = String(value ?? '').trim();
  if (str === '') return 'Planning period is required.';
  if (!/^\d+$/.test(str)) return 'Planning period must be a valid selection.';
  if (Array.isArray(arrAllowedIds) && arrAllowedIds.length > 0 && !arrAllowedIds.includes(str)) {
    return 'Please select a valid planning period from the list.';
  }
  return '';
}

/**
 * Validate a line item name (required if row exists).
 * §2.9/§2.10/§2.11/§2.12 same as title
 */
export function validateLineItemName(value) {
  const v = value ?? '';
  if (!v.trim()) return 'Item name is required.';
  if (hasDangerousPatterns(v))
    return 'Item name contains invalid characters or patterns.';
  if (hasHazardousChars(v))
    return `Item name contains potentially unsafe characters (< > " ' % ( ) & + \\ ! |).`;
  if (exceedsMaxLength(v.trim(), MAX_LENGTHS.lineItemName))
    return `Item name must not exceed ${MAX_LENGTHS.lineItemName} characters.`;
  return '';
}

/**
 * Validate a line item amount.
 * §2.10 data type: numeric; range: 0 – 999,999,999,999
 */
export function validateLineItemAmount(value) {
  if (value === '' || value === null || value === undefined)
    return 'Amount is required.';
  const num = Number(value);
  if (Number.isNaN(num)) return 'Amount must be a valid number.';
  if (num < 0) return 'Amount must be zero or a positive number.';
  if (num > 999_999_999_999) return 'Amount exceeds the maximum allowed value (999,999,999,999).';
  return '';
}

export function validateCostStructure(value) {
  const v = String(value || '').trim();
  if (!v) return 'Cost Structure is required.';
  if (!COST_STRUCTURE_OPTIONS.has(v)) return 'Please select a valid Cost Structure.';
  return '';
}

/**
 * Validate justification (optional multiline field).
 * §2.10/§2.12 same rules as description
 */
export function validateJustification(value) {
  const v = value ?? '';
  if (!v) return '';
  if (NULL_BYTE_RE.test(v) || PATH_TRAVERSAL_RE.test(v) || CR_RE.test(v))
    return 'Justification contains invalid characters or patterns.';
  if (exceedsMaxLength(v, MAX_LENGTHS.justification))
    return `Justification must not exceed ${MAX_LENGTHS.justification} characters.`;
  return '';
}

/**
 * Validate comment (optional multiline field).
 * §2.10/§2.12 same rules as description
 */
export function validateComment(value) {
  const v = value ?? '';
  if (!v) return '';
  if (NULL_BYTE_RE.test(v) || PATH_TRAVERSAL_RE.test(v) || CR_RE.test(v))
    return 'Comment contains invalid characters or patterns.';
  if (exceedsMaxLength(v, MAX_LENGTHS.comment))
    return `Comment must not exceed ${MAX_LENGTHS.comment} characters.`;
  return '';
}

// ---------------------------------------------------------------------------
// Full-form validator
// §2.5 — All validation failures result in rejection (returns non-empty errors)
// ---------------------------------------------------------------------------

/**
 * Validate all Budget Request form fields.
 *
 * @param {{ title, unit, description, fiscalYear, planningPeriod, planningPeriodAllowedIds, lineItems, comment, requireLineItems }} fields
 *   requireLineItems — when true (Submit for Review), at least one complete line item is required.
 *                      when false (Save Draft), the line items section may be empty.
 * @returns {{ [field]: string }} — Empty object means the form is valid.
 *   lineItemErrors: Array<{ name?, amount?, costStructure?, justification? }> indexed by row
 */
export function validateBudgetRequestForm({
  title,
  unit,
  description,
  fiscalYear,
  planningPeriod,
  planningPeriodAllowedIds,
  lineItems,
  comment,
  requireLineItems = true,
}) {
  const errors = {};

  const titleErr = validateTitle(title ?? '');
  if (titleErr) errors.title = titleErr;

  const unitErr = validateUnit(unit ?? '');
  if (unitErr) errors.unit = unitErr;

  const descErr = validateDescription(description ?? '');
  if (descErr) errors.description = descErr;

  const fyErr = validateFiscalYear(fiscalYear);
  if (fyErr) errors.fiscalYear = fyErr;

  const ppErr = validatePlanningPeriod(planningPeriod ?? '', planningPeriodAllowedIds ?? null);
  if (ppErr) errors.planningPeriod = ppErr;

  const commentErr = validateComment(comment ?? '');
  if (commentErr) errors.comment = commentErr;

  // Line items — security checks always run on whatever rows exist;
  // the "at least one complete item" requirement is enforced only on submit.
  const hasRows = lineItems && lineItems.length > 0;

  if (!hasRows) {
    if (requireLineItems) {
      errors.lineItems = 'At least 1 budget line item is required before submitting.';
    }
  } else {
    const lineItemErrors = [];
    let hasAtLeastOneComplete = false;

    lineItems.forEach((item, idx) => {
      const hasName = String(item.name ?? '').trim() !== '';
      const hasAmount = !(item.amount === '' || item.amount === null || typeof item.amount === 'undefined');
      const hasJustification = String(item.justification ?? '').trim() !== '';
      const isEffectivelyEmptyRow = !hasName && !hasAmount && !hasJustification;

      // For drafts, completely empty rows are allowed and should not block saving.
      if (!requireLineItems && isEffectivelyEmptyRow) {
        return;
      }

      const rowErrors = {};
      const nameErr = validateLineItemName(item.name ?? '');
      const amountErr = validateLineItemAmount(item.amount);
      const costStructureErr = validateCostStructure(item.costStructure ?? item.bri_cost_structure ?? '');
      const justErr = validateJustification(item.justification ?? '');

      if (nameErr) rowErrors.name = nameErr;
      if (amountErr) rowErrors.amount = amountErr;
      if (costStructureErr) rowErrors.costStructure = costStructureErr;
      if (justErr) rowErrors.justification = justErr;

      if (Object.keys(rowErrors).length > 0) {
        lineItemErrors[idx] = rowErrors;
      }

      if (!nameErr && !amountErr && !costStructureErr && item.category) {
        hasAtLeastOneComplete = true;
      }
    });

    if (lineItemErrors.some(Boolean)) {
      errors.lineItemErrors = lineItemErrors;
    }

    if (requireLineItems && !hasAtLeastOneComplete) {
      errors.lineItems = 'At least 1 line item must have a valid Item Name, Category, Cost Structure, and Amount before submitting.';
    }
  }

  return errors;
}
