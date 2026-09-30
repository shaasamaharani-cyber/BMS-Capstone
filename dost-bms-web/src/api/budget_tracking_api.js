/**
 * System Name: Budget Management System
 * Module Name: API Layer
 *
 * Purpose of this file:
 * Fetch unified budget tracking list, summary statistics, and filter options (stages, statuses, fiscal years).
 *
 * Author(s): QUT Group 27
 *
 * Copyright (C) 2026
 * by the Department of Science and Technology - Central Office
 * Developed by Team 27, Queensland University of Technology
 * All rights reserved.
 */

// TODO: replace mock imports with real axios/fetch calls when the backend is ready.
import { mockTrackingBudgets, mockTrackingSummaryStats } from './mock/budget_tracking.mock.js';

const API_DELAY_MS = 120;
const TRACKING_STORAGE_KEY = 'bms.budgetTracking.store.v1';
const ALLOWED_STATUSES = new Set(['PENDING', 'COMPLETED']);

const wait = (ms = API_DELAY_MS) => new Promise((resolve) => { setTimeout(resolve, ms); });

const getFiscalYearFromPeriod = (periodStart) => {
  const match = String(periodStart || '').match(/\d{4}/);
  return match ? match[0] : '';
};

const readTrackingStore = () => {
  try {
    const raw = localStorage.getItem(TRACKING_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(TRACKING_STORAGE_KEY, JSON.stringify(mockTrackingBudgets));
      return [...mockTrackingBudgets];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      localStorage.setItem(TRACKING_STORAGE_KEY, JSON.stringify(mockTrackingBudgets));
      return [...mockTrackingBudgets];
    }

    // Merge: add any mock records missing from the persisted store.
    const existingIds = new Set(parsed.map((item) => String(item.id)));
    const missing = mockTrackingBudgets.filter((item) => !existingIds.has(String(item.id)));
    const merged = [...parsed, ...missing];
    localStorage.setItem(TRACKING_STORAGE_KEY, JSON.stringify(merged));
    return merged;
  } catch {
    return [...mockTrackingBudgets];
  }
};

let trackingStore = readTrackingStore();

/**
 * Fetch tracking budgets (PENDING and COMPLETED only).
 * Optionally filters by stage, status, and fiscal year.
 *
 * @param {{ stage?: string, status?: string, fiscalYear?: string }} [filters={}]
 * @returns {Promise<{ data: object[], total: number }>}
 */
export async function getTrackingBudgets(filters = {}) {
  await wait();

  const filtered = trackingStore.filter((item) => {
    const status = String(item.status || '').toUpperCase();
    if (!ALLOWED_STATUSES.has(status)) return false;
    if (filters.stage && item.stage !== filters.stage) return false;
    if (filters.status && status !== String(filters.status).toUpperCase()) return false;
    if (filters.fiscalYear) {
      const fy = item.fiscalYear || getFiscalYearFromPeriod(item.periodStart);
      if (fy !== filters.fiscalYear) return false;
    }
    return true;
  });

  return { data: filtered, total: filtered.length };
}

/**
 * Fetch unique stage values from tracking records.
 *
 * @returns {Promise<string[]>}
 */
export async function getTrackingStageOptions() {
  await wait();
  const stages = trackingStore
    .filter((item) => ALLOWED_STATUSES.has(String(item.status || '').toUpperCase()))
    .map((item) => String(item.stage || '').trim())
    .filter(Boolean);
  return [...new Set(stages)].sort((a, b) => a.localeCompare(b));
}

/**
 * Fetch unique fiscal year values from tracking records.
 *
 * @returns {Promise<string[]>}
 */
export async function getTrackingFiscalYearOptions() {
  await wait();
  const years = trackingStore
    .filter((item) => ALLOWED_STATUSES.has(String(item.status || '').toUpperCase()))
    .map((item) => item.fiscalYear || getFiscalYearFromPeriod(item.periodStart))
    .filter(Boolean);
  return [...new Set(years)].sort((a, b) => a.localeCompare(b));
}

/**
 * Status options are fixed for the tracking page.
 *
 * @returns {Promise<string[]>}
 */
export async function getTrackingStatusOptions() {
  await wait();
  return ['PENDING', 'COMPLETED'];
}

/**
 * Summary statistics for the Budget Tracking dashboard.
 * Counts are derived from the live store; budget totals come from the mock.
 *
 * @returns {Promise<{ inProgress: number, completed: number, ps: string, mooe: string }>}
 */
export async function getTrackingSummaryStats() {
  await wait();
  const inProgress = trackingStore.filter(
    (item) => String(item.status || '').toUpperCase() === 'PENDING'
  ).length;
  const completed = trackingStore.filter(
    (item) => String(item.status || '').toUpperCase() === 'COMPLETED'
  ).length;
  return {
    inProgress,
    completed,
    ps: mockTrackingSummaryStats.ps,
    mooe: mockTrackingSummaryStats.mooe,
  };
}
