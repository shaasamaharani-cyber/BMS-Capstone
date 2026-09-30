/**
 * System Name: Budget Management System
 * Module Name: Utilities Module
 *
 * Purpose of this file:
 * Provide helper functions and utility methods for workflow_utils.
 *
 * Author(s): QUT Group 27
 *
 * Copyright (C) 2026
 * by the Department of Science and Technology - Central Office
 * Developed by Team 27, Queensland University of Technology
 * All rights reserved.
 */

const statusTextColors = {
  pending: '#92400E',
  reviewed: '#1E40AF',
  draft: '#374151',
  rejected: '#991B1B',
  approved: '#166534',
};

const getStatusColor = (statusText) => {
  const normalized = String(statusText || '').toLowerCase();
  if (normalized.includes('rejected')) return statusTextColors.rejected;
  if (normalized.includes('approved')) return statusTextColors.approved;
  if (normalized.includes('reviewed')) return statusTextColors.reviewed;
  if (normalized.includes('pending')) return statusTextColors.pending;
  if (normalized.includes('draft')) return statusTextColors.draft;
  return '#6B7280';
};

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
  actorRole,
  actorName,
  comment,
  statusColor: getStatusColor(statusText),
});

const GENERIC_ACTOR_LABELS = new Set([
  'budget officer',
  'executive',
  'system',
  'user',
  'approver',
  'reviewer',
]);

/**
 * True when the value is a workflow stage label, not a person's name.
 *
 * @param {string} strValue
 * @returns {boolean}
 */
export function isWorkflowStageTitleLabel(strValue) {
  const strNormalized = String(strValue || '').trim().toLowerCase();
  if (!strNormalized) {
    return false;
  }
  if (WORKFLOW_STAGE_TITLE_LABELS.has(strNormalized)) {
    return true;
  }
  return /^(internal consolidation|finance|planning director|usec|secretary|dbm|congress|senate|plenary|president)/i.test(strNormalized);
}

/**
 * @param {string} strValue
 * @returns {boolean}
 */
function isLikelyPersonActorName(strValue) {
  const strTrimmed = String(strValue || '').trim();
  if (!strTrimmed) {
    return false;
  }
  if (GENERIC_ACTOR_LABELS.has(strTrimmed.toLowerCase())) {
    return false;
  }
  if (isWorkflowStageTitleLabel(strTrimmed)) {
    return false;
  }
  return true;
}

/**
 * Resolves the real person name for workflow audit (never a stage title).
 *
 * @param {{ actorName?: string, user?: object|null }} objInput
 * @returns {string}
 */
export function resolveWorkflowActorName(objInput = {}) {
  const arrCandidates = [
    objInput?.actorName,
    objInput?.user?.usr_name,
    objInput?.user?.name,
    objInput?.user?.full_name,
  ];

  for (const strCandidate of arrCandidates) {
    if (isLikelyPersonActorName(strCandidate)) {
      return String(strCandidate).trim();
    }
  }

  return '';
}

/**
 * @param {object|null} objUser
 * @returns {string}
 */
export function getWorkflowActorNameFromUser(objUser) {
  return resolveWorkflowActorName({ user: objUser });
}

const WORKFLOW_STEP_NOTE_FIELDS = ['comment', 'actionNote', 'remark', 'remarks', 'officialRemarks'];

/**
 * Removes remark/comment fields from a workflow step payload (not shown on timeline).
 *
 * @param {object} objStep
 * @returns {object}
 */
export function stripWorkflowStepNotes(objStep = {}) {
  if (!objStep || typeof objStep !== 'object') {
    return objStep;
  }

  const objNext = { ...objStep };
  WORKFLOW_STEP_NOTE_FIELDS.forEach((strField) => {
    if (Object.prototype.hasOwnProperty.call(objNext, strField)) {
      delete objNext[strField];
    }
  });
  return objNext;
}

/**
 * @param {object[]} arrSteps
 * @returns {object[]}
 */
export function stripWorkflowStepsNotes(arrSteps = []) {
  if (!Array.isArray(arrSteps)) {
    return [];
  }

  return arrSteps.map((objStep) => stripWorkflowStepNotes(objStep));
}

const formatActionWithActor = (strVerb, strActorName) => {
  const strPerson = resolveWorkflowActorName({ actorName: strActorName });
  if (strPerson) {
    return `${strVerb} by ${strPerson}`;
  }
  return strVerb;
};

const findUnifiedBudgetDraftStep = (arrWorkflow = []) => {
  if (!Array.isArray(arrWorkflow)) {
    return null;
  }

  return arrWorkflow.find((objStep) => canonicalStepKey(objStep) === 'draft') || null;
};

/**
 * True when the budget was rejected or returned and awaits resubmission.
 *
 * @param {object[]} arrWorkflow
 * @param {string} strStatus
 * @returns {boolean}
 */
export function isUnifiedBudgetAwaitingResubmit(arrWorkflow = [], strStatus = '') {
  const strNormStatus = String(strStatus || '').trim().toLowerCase();
  if (strNormStatus === 'rejected') {
    return true;
  }

  const objDraft = findUnifiedBudgetDraftStep(arrWorkflow);
  if (!objDraft) {
    return false;
  }

  const strAction = String(objDraft.actionText || '').trim().toLowerCase();
  const strStepStatus = String(objDraft.status || '').trim().toLowerCase();

  if (strStepStatus === 'current' && (/returned|resubmit/.test(strAction))) {
    return true;
  }

  return false;
}

/**
 * Submit / resubmit button and toast labels for unified budget consolidation.
 *
 * @param {object[]} arrWorkflow
 * @param {string} strStatus
 * @param {{ forToast?: boolean }} [objOptions]
 * @returns {string}
 */
export function getUnifiedBudgetSubmitActionLabel(
  arrWorkflow = [],
  strStatus = '',
  objOptions = {}
) {
  const blnResubmit = isUnifiedBudgetAwaitingResubmit(arrWorkflow, strStatus);

  if (objOptions.forToast === true) {
    return blnResubmit
      ? 'Resubmitted for approval successfully.'
      : 'Submitted for approval successfully.';
  }

  return blnResubmit ? 'Resubmit for Approval' : 'Submit for Approval';
}

/**
 * Workflow action type when sending a unified budget for approval.
 *
 * @param {object[]} arrWorkflow
 * @param {string} strStatus
 * @returns {'submit'|'resubmit'}
 */
export function resolveUnifiedBudgetSubmitWorkflowAction(arrWorkflow = [], strStatus = '') {
  return isUnifiedBudgetAwaitingResubmit(arrWorkflow, strStatus) ? 'resubmit' : 'submit';
}

/**
 * Formats workflow action label for display (Approved by … / Rejected by …).
 *
 * @param {object} step
 * @returns {string}
 */
export const formatUnifiedWorkflowActionText = (step) => {
  const strText = String(step?.actionText || '').trim();
  const strStatus = String(step?.status || '').toLowerCase();
  const strPerson = resolveWorkflowActorName({ actorName: step?.actorName });

  if (strStatus === 'current' && canonicalStepKey(step) === 'draft') {
    if (/returned|resubmit/i.test(strText)) {
      return 'Resubmit';
    }
    if (/^submit$/i.test(strText) || /draft\s*created/i.test(strText) || strText === '') {
      return 'Submit';
    }
  }

  if (strText.toLowerCase() === 'pending') {
    return 'Pending Approval';
  }

  if (strText && /\bby\b/i.test(strText)) {
    const objByMatch = strText.match(/\bby\s+(.+)$/i);
    const strByPart = String(objByMatch?.[1] || '').trim();
    if (isLikelyPersonActorName(strByPart)) {
      return strText;
    }
    if (strPerson) {
      return strText.replace(/\bby\s+.+$/i, `by ${strPerson}`);
    }
    return strText.replace(/\s+by\s+.+$/i, '').trim() || strText;
  }

  if (strStatus === 'rejected' || /rejected/i.test(strText)) {
    return formatActionWithActor('Rejected', strPerson);
  }

  if (strStatus === 'done') {
    if (/^approved$/i.test(strText) || strText === '') {
      return formatActionWithActor('Approved', strPerson);
    }
    if (/^submitted$/i.test(strText)) {
      return formatActionWithActor('Submitted', strPerson);
    }
    if (/submitted\s+by/i.test(strText)) {
      return strText;
    }
    if (/^resubmitted$/i.test(strText)) {
      return formatActionWithActor('Resubmitted', strPerson);
    }
    if (/resubmitted/i.test(strText)) {
      if (/\bby\b/i.test(strText)) {
        return strText;
      }
      return formatActionWithActor('Resubmitted', strPerson);
    }
    if (/returned/i.test(strText)) {
      return strText;
    }
    if (strText) {
      return strText;
    }
    return formatActionWithActor('Approved', strPerson);
  }

  return strText;
};

const FALLBACK_UNIFIED_WORKFLOW_STEPS = [
  { stepKey: 'draft', title: 'Internal Consolidation', type: 'system' },
  { stepKey: 'finance_planning_director', title: 'Finance / Planning Director', type: 'internal_approval' },
  { stepKey: 'usec', title: 'USEC', type: 'internal_approval' },
  { stepKey: 'secretary', title: 'Secretary', type: 'internal_approval' },
  { stepKey: 'dbm', title: 'DBM', type: 'review' },
  { stepKey: 'congress_committee', title: 'Congress Committee', type: 'external_approval' },
  { stepKey: 'senate_committee', title: 'Senate Committee', type: 'external_approval' },
  { stepKey: 'plenary_congress', title: 'Plenary Congress', type: 'external_approval' },
  { stepKey: 'plenary_senate', title: 'Plenary Senate', type: 'external_approval' },
  { stepKey: 'president', title: 'President', type: 'external_approval' },
];

const WORKFLOW_STAGE_TITLE_LABELS = new Set(
  FALLBACK_UNIFIED_WORKFLOW_STEPS.flatMap((objStep) => [
    String(objStep.title || '').trim().toLowerCase(),
    String(objStep.stepKey || '').trim().toLowerCase().replace(/_/g, ' '),
  ]).filter(Boolean)
);

const isValidStageDefinition = (item) =>
  (item && item.aws_id !== undefined && item.aws_name !== undefined);

const normalizeStageDefinition = (item, idx) => ({
  aws_id: String(item?.aws_id || ''),
  aws_name: String(item?.aws_name || ''),
  aws_type: String(item?.aws_type || 'approval'),
  aws_sequence_order: Number(item?.aws_sequence_order) || (idx + 1),
});

const resolveStageDefinitions = (stageDefinitions = []) => {
  const legacyStageDefinitions = FALLBACK_UNIFIED_WORKFLOW_STEPS.map((step, idx) => ({
    aws_id: String(step.stepKey),
    aws_name: String(step.title),
    aws_type: String(step.type),
    aws_sequence_order: idx + 1,
  }));
  const source = Array.isArray(stageDefinitions) && stageDefinitions.some(isValidStageDefinition)
    ? stageDefinitions
    : legacyStageDefinitions;

  return source
    .map(normalizeStageDefinition)
    .filter((item) => item.aws_id !== '' && item.aws_name !== '')
    .sort((a, b) => a.aws_sequence_order - b.aws_sequence_order);
};

export const createEmptyUnifiedWorkflow = (stageDefinitions = []) =>
  resolveStageDefinitions(stageDefinitions).map((stage) => ({
    stepKey: stage.aws_id,
    title: stage.aws_name,
    type: stage.aws_type,
    status: 'locked',
    actionText: '',
    actionAt: '',
    actorRole: '',
    actorName: '',
  }));

const withActionMeta = (step) => {
  const objStep = stripWorkflowStepNotes(step);
  const strActionLabel = formatUnifiedWorkflowActionText(objStep);
  return {
    ...withMeta(
      objStep.title,
      objStep.status,
      strActionLabel,
      objStep.actionAt || '',
      objStep.actorRole || '',
      '',
      objStep.actorName || ''
    ),
    stepKey: objStep.stepKey,
    type: objStep.type,
    actorRole: objStep.actorRole || '',
    actorName: objStep.actorName || '',
  };
};

const normalizeStageIdentifier = (value) =>
  String(value || '').trim().toLowerCase().replace(/\s+/g, '_');

const matchesStepIdentifier = (step, identifiers = []) => {
  const arrCandidates = [
    normalizeStageIdentifier(step?.stepKey),
    normalizeStageIdentifier(step?.title),
  ];
  return identifiers.some((id) => arrCandidates.includes(normalizeStageIdentifier(id)));
};

const setStep = (steps, stepIdentifiers, updates) => {
  const arrIdentifiers = Array.isArray(stepIdentifiers) ? stepIdentifiers : [stepIdentifiers];
  return steps.map((step) => (
    matchesStepIdentifier(step, arrIdentifiers) ? { ...step, ...updates } : step
  ));
};

const STEP_ALIASES = {
  draft: ['draft', 'pcmd_consolidation', 'pcmd consolidation'],
  pending_approval: ['pending_approval', 'pending approval'],
  finance_planning_director: ['finance_planning_director', 'finance director', 'finance', 'finance / planning director'],
  usec: ['usec'],
  secretary: ['secretary', 'head', 'head_of_agency', 'head of agency'],
  dbm: ['dbm'],
  congress_committee: ['congress_committee', 'congress committee', 'congress'],
  senate_committee: ['senate_committee', 'senate committee', 'senate'],
  plenary_congress: ['plenary_congress', 'congress plenary', 'plenary congress'],
  plenary_senate: ['plenary_senate', 'senate plenary', 'plenary senate'],
  president: ['president', 'endorsed_president', 'philipines president', 'philippines president'],
  approved: ['approved'],
};

const ACTION_STAGE_ALIASES = {
  finance: 'finance_planning_director',
  finance_planning_director: 'finance_planning_director',
  usec: 'usec',
  secretary: 'secretary',
  head: 'secretary',
  dbm: 'dbm',
  congress: 'congress_committee',
  congress_committee: 'congress_committee',
  senate: 'senate_committee',
  senate_committee: 'senate_committee',
  plenary_congress: 'plenary_congress',
  plenary_senate: 'plenary_senate',
  president: 'president',
};

const canonicalStepKey = (step) => {
  const candidates = [
    normalizeStageIdentifier(step?.stepKey),
    normalizeStageIdentifier(step?.title),
  ];

  return Object.entries(STEP_ALIASES).find(([, aliases]) =>
    aliases.some((alias) => candidates.includes(normalizeStageIdentifier(alias)))
  )?.[0] || candidates[0] || '';
};

const findStepIndex = (steps, canonicalKey) =>
  steps.findIndex((step) => canonicalStepKey(step) === canonicalKey);

const firstWorkflowStepKey = (steps) => canonicalStepKey(steps[0]) || 'draft';

const resolveActionStage = (actionType) => {
  const match = String(actionType || '').match(/^(.+)_(approve|reject)$/);
  if (!match) return null;
  return ACTION_STAGE_ALIASES[normalizeStageIdentifier(match[1])] || null;
};

const getActorRole = (step, fallback = 'Budget Officer') =>
  step?.title || step?.actorRole || fallback;

const advanceWorkflow = ({ steps, fromKey, actionAt, actorName = '', rejected = false }) => {
  const strActorName = resolveWorkflowActorName({ actorName });
  const fromIndex = findStepIndex(steps, fromKey);
  if (fromIndex < 0) return steps;

  const returnIndex = findStepIndex(steps, 'draft');

  if (rejected && returnIndex >= 0) {
    return steps.map((step, intIndex) => {
      if (intIndex === returnIndex) {
        return {
          ...step,
          status: 'current',
          actionText: 'Resubmit',
          actionAt,
          actorRole: getActorRole(step),
          actorName: step.actorName || '',
        };
      }
      if (intIndex === fromIndex) {
        return {
          ...step,
          status: 'rejected',
          actionText: formatActionWithActor('Rejected', strActorName),
          actionAt,
          actorRole: getActorRole(step),
          actorName: strActorName,
        };
      }
      if (intIndex < fromIndex) {
        const strPrevStatus = String(step.status || '').toLowerCase();
        if (strPrevStatus === 'done') {
          const strActionText = String(step.actionText || '').trim();
          const strPrevPerson = resolveWorkflowActorName({ actorName: step.actorName });
          const strPrevAction = (/approved/i.test(strActionText) && /\bby\b/i.test(strActionText))
            ? formatUnifiedWorkflowActionText({ ...step, status: 'done', actionText: strActionText })
            : formatActionWithActor('Approved', strPrevPerson);
          return {
            ...step,
            status: 'done',
            actionText: strPrevAction,
            actionAt: step.actionAt || actionAt,
            actorRole: step.actorRole || getActorRole(step),
            actorName: strPrevPerson,
          };
        }
      }
      return {
        ...step,
        status: 'locked',
        actionText: '',
        actionAt: '',
        actorRole: '',
        actorName: '',
      };
    });
  }

  const next = steps.map((step) => ({ ...step }));
  const fromStep = next[fromIndex];

  next[fromIndex] = {
    ...fromStep,
    status: 'done',
    actionText: formatActionWithActor('Approved', strActorName),
    actionAt,
    actorRole: getActorRole(fromStep),
    actorName: strActorName,
  };

  const targetIndex = fromIndex + 1;

  if (targetIndex >= 0 && targetIndex < next.length) {
    const targetStep = next[targetIndex];
    const isApprovedTarget = canonicalStepKey(targetStep) === 'approved';
    next[targetIndex] = {
      ...targetStep,
      status: isApprovedTarget ? 'done' : 'current',
      actionText: isApprovedTarget ? 'Approved' : 'Pending Approval',
      actionAt,
      actorRole: getActorRole(targetStep),
    };
  }

  return next;
};

const getCurrentActionTime = () =>
  new Date().toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

export function applyUnifiedBudgetWorkflowAction(
  currentWorkflow = [],
  actionType,
  actionAt = getCurrentActionTime(),
  actorName = '',
  stageDefinitions = []
) {
  const strActorName = resolveWorkflowActorName({ actorName });
  const defaultTemplate = createEmptyUnifiedWorkflow(stageDefinitions);
  const base = Array.isArray(currentWorkflow) && currentWorkflow.length > 0
    ? defaultTemplate.map((templateStep) => {
      const existingStep = currentWorkflow.find(
        (step) => canonicalStepKey(step) === canonicalStepKey(templateStep)
      );
      return {
        ...templateStep,
        ...(existingStep || {}),
        stepKey: templateStep.stepKey,
        title: templateStep.title,
        type: templateStep.type,
      };
    })
    : defaultTemplate;
  let next = base.map((step) => ({ ...step }));

  if (actionType === '__normalize__') {
    return stripWorkflowStepsNotes(next);
  }

  next = next.map((step) => ({
    ...step,
    status: step.status === 'rejected' ? 'locked' : step.status,
  }));

  if (actionType === 'save_draft') {
    next = setStep(next, firstWorkflowStepKey(next), {
      status: 'current',
      actionText: 'Submit',
      actionAt,
      actorRole: 'Budget Officer',
      actorName: strActorName,
    });
    return stripWorkflowStepsNotes(next);
  }

  if (actionType === 'submit') {
    next = setStep(next, STEP_ALIASES.draft, {
      status: 'done',
      actionText: formatActionWithActor('Submitted', strActorName),
      actionAt,
      actorRole: 'Budget Officer',
      actorName: strActorName,
    });
    next = setStep(next, STEP_ALIASES.finance_planning_director, {
      status: 'current',
      actionText: 'Pending Approval',
      actionAt,
      actorRole: 'Finance / Planning Director',
      actorName: '',
    });
    return stripWorkflowStepsNotes(next);
  }

  if (actionType === 'resubmit') {
    const arrResubmitted = base.map((step) => {
      const strKey = canonicalStepKey(step);
      if (strKey === 'draft') {
        return {
          ...step,
          status: 'done',
          actionText: formatActionWithActor('Resubmitted', strActorName),
          actionAt,
          actorRole: 'Budget Officer',
          actorName: strActorName,
        };
      }
      if (strKey === 'finance_planning_director') {
        return {
          ...step,
          status: 'current',
          actionText: 'Pending Approval',
          actionAt,
          actorRole: 'Finance / Planning Director',
          actorName: '',
        };
      }
      return {
        ...step,
        status: 'locked',
        actionText: '',
        actionAt: '',
        actorRole: '',
        actorName: '',
      };
    });
    return stripWorkflowStepsNotes(arrResubmitted);
  }

  const actionStage = resolveActionStage(actionType);
  if (actionStage) {
    return stripWorkflowStepsNotes(advanceWorkflow({
      steps: next,
      fromKey: actionStage,
      actionAt,
      actorName: strActorName,
      rejected: String(actionType).endsWith('_reject'),
    }));
  }

  return stripWorkflowStepsNotes(next);
}

export const deriveUnifiedWorkflowStage = (workflow = []) => {
  if (!Array.isArray(workflow) || workflow.length === 0) return '—';
  const current = workflow.find((step) => step.status === 'current');
  if (current) return current.title;
  const rejected = workflow.find((step) => step.status === 'rejected');
  if (rejected) return rejected.title;
  const lastDone = [...workflow].reverse().find((step) => step.status === 'done');
  return lastDone?.title || '—';
};

export const createApprovalVersionEntry = ({
  version,
  status,
  workflow,
  startedAt,
  endedAt = '',
  rejectedAtStage = '',
  actionNote = '',
  snapshot = null,
}) => ({
  version,
  status,
  stage: deriveUnifiedWorkflowStage(workflow),
  startedAt,
  endedAt,
  rejectedAtStage,
  actionNote,
  workflow,
  snapshot,
});

export const getActiveApprovalVersion = (approvalVersions = [], currentVersion = 1) =>
(Array.isArray(approvalVersions)
  ? approvalVersions.find((entry) => Number(entry?.version) === Number(currentVersion))
  : null);

export const initializeDraftApprovalVersion = (actionAt = getCurrentActionTime()) => {
  const workflow = applyUnifiedBudgetWorkflowAction([], 'save_draft', actionAt);
  return createApprovalVersionEntry({
    version: 1,
    status: 'DRAFT',
    workflow,
    startedAt: actionAt,
  });
};

export function getUnifiedBudgetWorkflowActionForStep(stepTitle, decision = 'approve') {
  const canonical = canonicalStepKey({ title: stepTitle, stepKey: stepTitle });
  const actionStem = Object.entries(ACTION_STAGE_ALIASES)
    .find(([, stageKey]) => stageKey === canonical)?.[0] || canonical;

  if (['draft', 'pending_approval', 'approved'].includes(canonical)) return '';
  return `${actionStem}_${decision}`;
}

export function isUnifiedBudgetTerminalApprovalAction(actionType) {
  return resolveActionStage(actionType) === 'president' && String(actionType).endsWith('_approve');
}

export function getUnifiedBudgetWorkflowSteps(status, lastUpdated, approvalWorkflow = []) {
  if (Array.isArray(approvalWorkflow) && approvalWorkflow.length > 0) {
    return applyUnifiedBudgetWorkflowAction(approvalWorkflow, '__normalize__').map(withActionMeta);
  }

  const normalizedStatus = String(status || '').toLowerCase();
  const actionDate = lastUpdated || '';
  const fallbackWorkflow = createEmptyUnifiedWorkflow();
  const steps = fallbackWorkflow.map((step, index) =>
    withMeta(step.title, index === 0 ? 'current' : 'locked', index === 0 ? 'Submit' : '')
  );

  if (normalizedStatus === 'draft') {
    return steps;
  }

  if (normalizedStatus === 'in review' || normalizedStatus === 'pending') {
    steps[0] = withMeta(steps[0]?.title || '', 'done', 'Submitted for approval', actionDate);
    steps[1] = withMeta(steps[1]?.title || '', 'current', 'Pending Approval', actionDate);
    return steps;
  }

  if (normalizedStatus === 'approved' || normalizedStatus === 'completed') {
    return steps.map((step) => withMeta(step.title, 'done', 'Approved', actionDate));
  }

  if (normalizedStatus === 'rejected') {
    steps[0] = withMeta(steps[0]?.title || '', 'current', 'Resubmit', actionDate);
    steps[1] = withMeta(steps[1]?.title || '', 'rejected', 'Rejected', actionDate);
    return steps;
  }

  return steps;
}
