/**
 * System Name: Budget Management System
 * Module Name: Utilities Module
 *
 * Purpose of this file:
 * Provide helper functions and workflow step builders for budget request lifecycles.
 *
 * Author(s): QUT Group 27
 *
 * Copyright (C) 2026
 * by the Department of Science and Technology - Central Office
 * Developed by Team 27, Queensland University of Technology
 * All rights reserved.
 */

import { formatTimestamp } from './formatters';

const statusTextColors = {
  Pending: '#92400E',
  Reviewed: '#1E40AF',
  Draft: '#374151',
  Rejected: '#991B1B',
  Cancelled: '#334155',
  Consolidated: '#5B21B6',
  Submitted: '#374151',
};

const getActionColor = (statusText) => {
  const normalized = String(statusText || '').toLowerCase();
  if (normalized.includes('rejected')) return statusTextColors.Rejected;
  if (normalized.includes('reviewed')) return statusTextColors.Reviewed;
  if (normalized.includes('pending')) return statusTextColors.Pending;
  if (normalized.includes('consolidated')) return statusTextColors.Consolidated;
  if (normalized.includes('cancelled')) return statusTextColors.Cancelled;
  if (normalized.includes('submitted')) return statusTextColors.Submitted;
  if (normalized.includes('draft')) return statusTextColors.Draft;
  return '#6B7280';
};

const formatActorRole = (role) =>
  String(role || '')
    .split('_')
    .filter(Boolean)
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(' ');

const actorLabel = (name) => String(name || '').trim() || 'User';

const withMeta = (
  title,
  status,
  statusText = '',
  actionAt = '',
  actorRole = '',
  comment = '',
  actorName = ''
) => ({
  title,
  status,
  statusText,
  actionAt,
  actorName,
  actorRole: formatActorRole(actorRole),
  comment,
  statusColor: getActionColor(statusText),
});

function formatTime(isoString) {
  return formatTimestamp(isoString);
}

function lastOf(logs, ...actions) {
  return [...logs].reverse().find((l) => actions.includes(l.bral_action)) ?? null;
}

function buildStepsFromLogs(activityLogs, currentStatus) {
  const sorted = [...activityLogs].sort(
    (a, b) => new Date(a.bral_created_at) - new Date(b.bral_created_at)
  );
  const norm = String(currentStatus || '').toLowerCase();

  const createEntry = sorted.find((l) => l.bral_action === 'created');
  const lastSubmit = lastOf(sorted, 'submitted', 'resubmitted');
  const lastReview = lastOf(sorted, 'approved', 'rejected', 'returned');
  const consolidateEntry = sorted.find((l) => l.bral_action === 'consolidated');

  const steps = [
    withMeta('Requesting Unit', 'done', '', '', ''),
    withMeta('Internal Review', 'locked', '', '', ''),
    withMeta('Internal Consolidation', 'locked', '', '', ''),
  ];

  // ── Step 1: Requesting Unit ──────────────────────────────────────────────
  if (lastSubmit) {
    const verb = lastSubmit.bral_action === 'resubmitted' ? 'Resubmitted' : 'Submitted';
    const versionLabel = Number(lastSubmit.bral_version_number) > 0
      ? ` (v${lastSubmit.bral_version_number})`
      : '';
    steps[0] = withMeta(
      'Requesting Unit', 'done',
      `${verb} by ${actorLabel(lastSubmit.bral_actor_name)}${versionLabel}`,
      formatTime(lastSubmit.bral_created_at),
      lastSubmit.bral_actor_role || '',
      '',
      lastSubmit.bral_actor_name || '',
    );
  } else if (createEntry) {
    steps[0] = withMeta(
      'Requesting Unit', norm === 'draft' ? 'current' : 'done',
      `Draft created by ${actorLabel(createEntry.bral_actor_name)}`,
      formatTime(createEntry.bral_created_at),
      createEntry.bral_actor_role || '',
      '',
      createEntry.bral_actor_name || '',
    );
  }

  // ── Step 2: Internal Review ──────────────────────────────────────────────────
  const resubmittedAfterReview = lastSubmit && lastReview &&
    new Date(lastSubmit.bral_created_at) > new Date(lastReview.bral_created_at);

  if (lastReview && !resubmittedAfterReview) {
    const labelMap = { approved: 'Reviewed', rejected: 'Rejected' };
    const nodeStatus = lastReview.bral_action === 'rejected' ? 'rejected'
      : lastReview.bral_action === 'returned' ? 'rejected'
        : 'done';
    steps[1] = withMeta(
      'Internal Review', nodeStatus,
      `${labelMap[lastReview.bral_action]} by ${actorLabel(lastReview.bral_actor_name)}`,
      formatTime(lastReview.bral_created_at),
      lastReview.bral_actor_role || '',
      '',
      lastReview.bral_actor_name || '',
    );
  } else if (lastSubmit && (norm === 'submitted' || norm === 'pending')) {
    steps[1] = withMeta('Internal Review', 'current', 'Pending Review', formatTime(lastSubmit.bral_created_at));
  }

  // ── Step 3: Internal Consolidation ───────────────────────────────────────────
  if (consolidateEntry) {
    steps[2] = withMeta(
      'Internal Consolidation', 'done',
      `Consolidated by ${actorLabel(consolidateEntry.bral_actor_name || 'System')}`,
      formatTime(consolidateEntry.bral_created_at),
      consolidateEntry.bral_actor_role || '',
      '',
      consolidateEntry.bral_actor_name || '',
    );
  } else if ((norm === 'reviewed' || norm === 'approved') && lastReview) {
    steps[2] = withMeta(
      'Internal Consolidation', 'current',
      'Pending Consolidation',
      formatTime(lastReview.bral_created_at),
    );
  }

  return steps;
}

export function getWorkflowSteps(status, _previousStatus, lastUpdated, budgetRequest = null, activityLogs = []) {
  if (Array.isArray(activityLogs) && activityLogs.length > 0) {
    return buildStepsFromLogs(activityLogs, status);
  }

  // ── Fallback: no logs available (new request or logs not yet fetched) ────
  const normalizedStatus = String(status || '').toLowerCase();
  const isFirstDraft = normalizedStatus === 'draft' && !budgetRequest?.br_id;

  const createdAt = budgetRequest?.br_created_at || lastUpdated;
  const updatedAt = budgetRequest?.br_updated_at || lastUpdated;
  const createdWhen = formatTime(createdAt) || String(lastUpdated || '');
  const updatedWhen = formatTime(updatedAt) || String(lastUpdated || '');

  const steps = [
    withMeta('Requesting Unit', isFirstDraft ? 'current' : 'done', isFirstDraft ? '' : `Draft on ${createdWhen}`, ''),
    withMeta('Internal Review', 'locked'),
    withMeta('Internal Consolidation', 'locked'),
  ];

  if (normalizedStatus === 'submitted' || normalizedStatus === 'pending') {
    steps[0] = withMeta('Requesting Unit', 'done', 'Submitted', updatedWhen);
    steps[1] = withMeta('Internal Review', 'current', 'Pending Review', updatedWhen);
  } else if (normalizedStatus === 'rejected') {
    steps[0] = withMeta('Requesting Unit', 'done', 'Submitted', updatedWhen);
    steps[1] = withMeta('Internal Review', 'rejected', 'Rejected', updatedWhen);
  } else if (normalizedStatus === 'reviewed' || normalizedStatus === 'approved') {
    steps[0] = withMeta('Requesting Unit', 'done', 'Submitted', updatedWhen);
    steps[1] = withMeta('Internal Review', 'done', 'Reviewed', updatedWhen);
    steps[2] = withMeta('Internal Consolidation', 'current', 'Pending Consolidation', updatedWhen);
  } else if (normalizedStatus === 'consolidated') {
    steps[0] = withMeta('Requesting Unit', 'done', 'Submitted', updatedWhen);
    steps[1] = withMeta('Internal Review', 'done', 'Reviewed', updatedWhen);
    steps[2] = withMeta('Internal Consolidation', 'done', 'Consolidated', updatedWhen);
  }

  return steps;
}


/**
 * Maps dynamic status copy to Bootstrap text utilities (same rules as ApprovalWorkflowTimeline).
 *
 * @param {string} statusText
 * @returns {string}
 */

// Workflow status color mapping
export const getWorkflowStatusClass = (statusText) => {
  const normalized = String(statusText || '').toLowerCase();
  if (normalized.includes('rejected')) return 'text-danger fw-bold';
  if (normalized.includes('cancelled') || normalized.includes('canceled') || normalized.includes('budget')) return 'text-secondary';
  if (normalized.includes('reviewed')) return 'text-primary';
  if (normalized.includes('approved')) return 'text-success';

  if (
    normalized === 'submit'
    || normalized === 'resubmit'
    || /\bsubmitted\s+by\b/.test(normalized)
    || /\bresubmitted\s+by\b/.test(normalized)
    || /\bresubmitted\s+at\b/.test(normalized)
  ) {
    return 'workflow-status-draft-text';
  }
  if (normalized.includes('pending')) return 'text-warning';
  if (normalized.includes('consolidated')) return 'workflow-status-consolidated-text';
  if (normalized.includes('completed') || normalized.includes('president')) {
    return 'text-success';
  }
  return 'text-muted';
};
