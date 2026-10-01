/**
 * System Name: Budget Management System
 * Module Name: Utilities Module
 *
 * Purpose of this file:
 * Provide helper functions and utility methods for formatters.
 *
 * Author(s): QUT Group 27
 *
 * Copyright (C) 2026
 * by the Department of Science and Technology - Central Office
 * Developed by Team 27, Queensland University of Technology
 * All rights reserved.
 */

export const formatDate = (date, formatStr = 'MMM dd, yyyy') => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';

  const monthsShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthsLong = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const yyyy = d.getFullYear();
  const yy = String(yyyy).slice(-2);
  const m = d.getMonth();
  const mm = String(m + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');

  let result = formatStr;
  result = result.replace('yyyy', yyyy);
  result = result.replace('yy', yy);
  result = result.replace('MMMM', monthsLong[m]);
  result = result.replace('MMM', monthsShort[m]);
  result = result.replace('MM', mm);
  result = result.replace('dd', dd);

  return result;
};

export const formatCurrency = (amount, currency = 'PHP') => {
  if (amount === undefined || amount === null || isNaN(amount)) return '';
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

export const formatPeriod = (start, end) => {
  if (!start || !end) return '';
  const startDate = new Date(start);
  const endDate = new Date(end);
  const monthsFull = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const startStr = `${monthsFull[startDate.getMonth()]}${startDate.getFullYear()}`;
  const endStr = `${monthsFull[endDate.getMonth()]}${endDate.getFullYear()}`;

  return `${startStr} – ${endStr}`;
};

export const formatTimestamp = (value) => {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleString('en-PH', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Manila',
  });
};

export const STATUS_LABELS = {
  draft: 'Draft',
  pending: 'Pending',
  approved: 'Approved',
  reviewed: 'Reviewed',
  rejected: 'Rejected',
  consolidated: 'Consolidated',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

/**
 * Converts a string to Title Case (replaces underscores with spaces, capitalizes first letter of each word).
 *
 * @param {string} value
 * @returns {string}
 */
export const toTitleCase = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/_/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

/**
 * Normalizes a status value to match UI badge labels.
 *
 * @param {string} status
 * @returns {string}
 */
export const getBadgeStatus = (status) => {
  const normalized = String(status || '').trim().toUpperCase();
  if (normalized === 'PENDING')   return 'Pending';
  if (normalized === 'COMPLETED') return 'Completed';
  return normalized;
};

/**
 * Formats a decimal/percentage value into a percentage string (e.g. 95.50%).
 *
 * @param {number|string} numberValue
 * @returns {string}
 */
export const formatRate = (numberValue) => {
  return `${Number(numberValue || 0).toFixed(2)}%`;
};

/**
 * Returns the CSS class name based on the percentage value for rate formatting.
 *
 * @param {number} value
 * @returns {string}
 */
export const getRateClassName = (value) => {
  if (value >= 90) return 'dashboard-rate--green';
  if (value >= 75) return 'dashboard-rate--amber';
  return 'dashboard-rate--red';
};

/**
 * Short peso amount for cards and chart axes, e.g. ₱4.8M, ₱536K, ₱10B.
 */
export function formatShortPeso(dblValue)
{
  const dblAbs = Math.abs(dblValue);
  const strSign = dblValue < 0 ? '-' : '';
  const trim = (dblNumber) => String(Number(dblNumber.toFixed(1)));
  if (dblAbs >= 1e9) return `${strSign}₱${trim(dblAbs / 1e9)}B`;
  if (dblAbs >= 1e6) return `${strSign}₱${trim(dblAbs / 1e6)}M`;
  if (dblAbs >= 1e3) return `${strSign}₱${Math.round(dblAbs / 1e3)}K`;
  return `${strSign}₱${Math.round(dblAbs)}`;
}
