/**
 * System Name: Budget Management System
 * Module Name: Utilities Module
 *
 * Purpose of this file:
 * Provide centralized helper functions for type conversion, date parsing, and file handling.
 *
 * Author(s): QUT Group 27
 *
 * Copyright (C) 2026
 * by the Department of Science and Technology - Central Office
 * Developed by Team 27, Queensland University of Technology
 * All rights reserved.
 */

/**
 * Converts a value to a numeric amount, returning 0 if it is not a valid number.
 *
 * @param {*} value
 * @returns {number}
 */
export const toAmount = (value) => {
  const num = Number(value);
  return Number.isNaN(num) ? 0 : num;
};

/**
 * Extracts a 4-digit fiscal year from a date string.
 *
 * @param {string} periodStart
 * @returns {string}
 */
export const getFiscalYear = (periodStart) => {
  const match = String(periodStart || '').match(/\d{4}/);
  return match ? match[0] : '';
};

/**
 * Extracts a 4-digit fiscal year with a fallback option.
 *
 * @param {string} periodStart
 * @param {string|number} fallbackYear
 * @returns {string}
 */
export const toFiscalYear = (periodStart, fallbackYear = String(new Date().getFullYear())) => {
  const match = String(periodStart || '').match(/\d{4}/);
  return match ? match[0] : String(fallbackYear);
};

/**
 * Returns the current timestamp string in standard en-US format.
 *
 * @returns {string}
 */
export const getCurrentTimestamp = () =>
  new Date().toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

/**
 * Reads a File object and returns a Data URL representation.
 *
 * @param {File} file
 * @returns {Promise<string>}
 */
export const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

/**
 * Calculates the next approval version number from a list of version entries.
 *
 * @param {Array} versions
 * @returns {number}
 */
export const getNextApprovalVersionNumber = (versions = []) => {
  const nums = (Array.isArray(versions) ? versions : [])
    .map((entry) => Number(entry?.version))
    .filter(Number.isFinite);

  return nums.length > 0 ? Math.max(...nums) + 1 : 1;
};

/**
 * Extracts initials from user profile details.
 *
 * @param {object} user
 * @returns {string}
 */
export const getInitials = (user) => {
  const first = String(user?.usr_fname || '').trim();
  const last = String(user?.usr_lname || '').trim();
  if (first && last) return `${first[0]}${last[0]}`.toUpperCase();
  const full = String(user?.usr_name || '').trim();
  const parts = full.split(' ').filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  return full ? full[0].toUpperCase() : 'U';
};

/**
 * Formats a user's role name for clean display.
 *
 * @param {object} user
 * @returns {string}
 */
export const formatRoleName = (user) => {
  const raw = String(user?.role?.role_name || '').trim();
  if (!raw) return 'Member';
  return raw.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
};

/**
 * Formats an array of strings into a comma-separated list.
 *
 * @param {Array} value
 * @returns {string}
 */
export const textList = (value = []) => {
  return Array.isArray(value) ? value.join(', ') : '';
};

/**
 * Parses a comma-separated string into an array of trimmed, non-empty strings.
 *
 * @param {string} value
 * @returns {Array<string>}
 */
export const parseTextList = (value) => {
  return String(value || '').split(',').map((item) => item.trim()).filter(Boolean);
};


