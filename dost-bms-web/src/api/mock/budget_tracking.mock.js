/**
 * System Name: Budget Management System
 * Module Name: API Layer
 *
 * Purpose of this file:
 * Mock data and simulated responses for budget_tracking.
 *
 * Author(s): QUT Group 27
 *
 * Copyright (C) 2026
 * by the Department of Science and Technology - Central Office
 * Developed by Team 27, Queensland University of Technology
 * All rights reserved.
 */

// Raw mock data only — no functions, no logic.
// Cloned from budgetConsolidation.mock.js; only records with status PENDING or COMPLETED.
// Replace with real API responses when the backend is ready.

export const mockTrackingBudgets = [
  {
    id: 1,
    title: 'Unified Budget for FY 2026',
    code: 'UR-2026-001',
    requestingUnit: 'Budget Division',
    periodStart: 'Jan2026',
    periodEnd: 'Jan2027',
    status: 'PENDING',
    stage: 'Congress',
    lastUpdated: 'Apr 10, 2026',
    currentVersion: 1,
    approvalVersions: [],
  },
  {
    id: 2,
    title: 'Unified Budget for FY 2025',
    code: 'UR-2025-001',
    requestingUnit: 'Budget Division',
    periodStart: 'Jan2025',
    periodEnd: 'Jan2026',
    status: 'COMPLETED',
    stage: 'President',
    lastUpdated: 'Dec 15, 2024',
    currentVersion: 1,
    approvalVersions: [],
  },
  {
    id: 3,
    title: 'Unified Budget for FY 2024',
    code: 'UR-2024-001',
    requestingUnit: 'Budget Division',
    periodStart: 'Jan2024',
    periodEnd: 'Jan2025',
    status: 'COMPLETED',
    stage: 'Completed',
    lastUpdated: 'Dec 15, 2023',
    currentVersion: 1,
    approvalVersions: [],
  },
  {
    id: 4,
    title: 'Unified Budget for FY 2023',
    code: 'UR-2023-001',
    requestingUnit: 'Budget Division',
    periodStart: 'Jan2023',
    periodEnd: 'Jan2024',
    status: 'COMPLETED',
    stage: 'Completed',
    lastUpdated: 'Dec 16, 2022',
    currentVersion: 1,
    approvalVersions: [],
  },
  {
    id: 6,
    title: 'Unified Budget for FY 2027',
    code: 'UR-2026-002',
    requestingUnit: 'Budget Division',
    periodStart: 'Jan2026',
    periodEnd: 'Jan2027',
    status: 'PENDING',
    stage: 'Congress',
    lastUpdated: 'Apr 30, 2026',
    currentVersion: 1,
    approvalVersions: [],
  },
];

export const mockTrackingSummaryStats = {
  ps: '₱10M',
  mooe: '₱40M',
};
