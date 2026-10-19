/**
 * System Name: Budget Management System
 * Module Name: API Layer
 *
 * Purpose of this file:
 * Fetch persisted budget tracking records, summary statistics and filter options.
 *
 * Author(s): QUT Group 27
 *
 * Copyright (C) 2026
 * by the Department of Science and Technology - Central Office
 * Developed by Team 27, Queensland University of Technology
 * All rights reserved.
 */

import { getUnifiedBudgets } from './budget_consolidation_api';
import { isUnifiedBudgetWorkflowFullyApproved } from '../utils/unified_budget_workflow_lanes';

// Tracking uses the same persisted budgets as consolidation and Director views.
// A Director-approved budget still awaits external results; it is not completed.
async function trackingRows() {
  const response = await getUnifiedBudgets({ per_page: 10000 });
  const rows = Array.isArray(response?.data) ? response.data : [];
  return rows.filter((row) => String(row.status).toUpperCase() !== 'DRAFT').map((row) => {
    const completed = isUnifiedBudgetWorkflowFullyApproved(row.approvalWorkflow);
    return { ...row, status: completed ? 'COMPLETED' : row.status,
      statusLabel: completed ? 'External stages recorded complete' : row.statusLabel };
  });
}

export async function getTrackingBudgets(filters = {}) {
  const data = (await trackingRows()).filter((row) => (!filters.stage || row.stage === filters.stage)
    && (!filters.status || row.status === filters.status)
    && (!filters.fiscalYear || String(row.fiscalYear) === String(filters.fiscalYear)));
  return { data, total: data.length };
}
export async function getTrackingStageOptions() {
  return [...new Set((await trackingRows()).map((row) => row.stage).filter(Boolean))].sort();
}
export async function getTrackingFiscalYearOptions() {
  return [...new Set((await trackingRows()).map((row) => String(row.fiscalYear)).filter(Boolean))].sort();
}
export async function getTrackingStatusOptions() {
  return [...new Set((await trackingRows()).map((row) => row.status))].sort();
}
export async function getTrackingSummaryStats() {
  const rows = await trackingRows();
  const peso = (key) => 'PHP ' + rows.reduce((sum, row) => sum + Number(row.totals?.[key] || 0), 0).toLocaleString('en-PH', { minimumFractionDigits: 2 });
  return { inProgress: rows.filter((row) => row.status !== 'COMPLETED' && row.status !== 'REJECTED').length,
    completed: rows.filter((row) => row.status === 'COMPLETED').length, ps: peso('psTotal'), mooe: peso('mooeTotal') };
}
