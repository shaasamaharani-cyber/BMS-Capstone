/**
 * System Name: Budget Management System
 * Module Name: None
 *
 * Purpose of this file:
 * Provide helper functions and utility methods for unified_budget_workflow_lanes.
 *
 * Author(s): QUT Group 27
 *
 * Copyright (C) 2026
 * by the Department of Science and Technology - Central Office
 * Developed by Team 27, Queensland University of Technology
 * All rights reserved.
 */

const EXTERNAL_TYPES = new Set(['external_approval', 'review']);
const INTERNAL_TYPES = new Set(['internal_approval', 'system']);

function normalizeType(strValue)
{
  return String(strValue || '').trim().toLowerCase();
}

/**
 * @param {string} strAwsType
 * @returns {'internal' | 'external'}
 */
export function laneForUnifiedWorkflowStageType(strAwsType)
{
  const strT = normalizeType(strAwsType);
  if (EXTERNAL_TYPES.has(strT)) return 'external';
  if (INTERNAL_TYPES.has(strT)) return 'internal';
  return 'internal';
}

function findStageDefinitionForStep(objStep, arrStageDefinitions)
{
  if (!Array.isArray(arrStageDefinitions) || arrStageDefinitions.length === 0) return null;

  const strId = String(objStep?.stepKey || '').trim().toLowerCase();
  const strTitle = String(objStep?.title || '').trim().toLowerCase();

  return arrStageDefinitions.find((objRow) => {
    const strRowId = String(objRow?.aws_id || '').trim().toLowerCase();
    const strRowName = String(objRow?.aws_name || '').trim().toLowerCase();
    return strRowId === strId || strRowName === strTitle;
  }) || null;
}

/**
 * @param {object} objStep — display step (stepKey, title, type from workflow engine)
 * @param {Array<{ aws_id: string, aws_name: string, aws_type: string }>} arrStageDefinitions — from GET /approval-workflow-stages
 * @returns {'internal' | 'external'}
 */
export function getUnifiedWorkflowStepLane(objStep, arrStageDefinitions = [])
{
  const strFromStep = normalizeType(objStep?.type);
  if (EXTERNAL_TYPES.has(strFromStep) || INTERNAL_TYPES.has(strFromStep)) {
    return EXTERNAL_TYPES.has(strFromStep) ? 'external' : 'internal';
  }

  const objStage = findStageDefinitionForStep(objStep, arrStageDefinitions);
  const strFromStage = normalizeType(objStage?.aws_type);
  if (EXTERNAL_TYPES.has(strFromStage) || INTERNAL_TYPES.has(strFromStage)) {
    return EXTERNAL_TYPES.has(strFromStage) ? 'external' : 'internal';
  }

  return 'internal';
}

/**
 * @param {object[]} arrSteps
 * @param {Array<{ aws_id: string, aws_name: string, aws_type: string }>} arrStageDefinitions
 * @returns {{ internalSteps: object[], externalSteps: object[] }}
 */
export function splitUnifiedWorkflowStepsByLane(arrSteps, arrStageDefinitions = [])
{
  const arrInternal = [];
  const arrExternal = [];

  if (!Array.isArray(arrSteps)) {
    return { internalSteps: arrInternal, externalSteps: arrExternal };
  }

  arrSteps.forEach((objStep) => {
    if (getUnifiedWorkflowStepLane(objStep, arrStageDefinitions) === 'external') {
      arrExternal.push(objStep);
    } else {
      arrInternal.push(objStep);
    }
  });

  return { internalSteps: arrInternal, externalSteps: arrExternal };
}


function normalizeStageLabel(strValue)
{
  return String(strValue || '').trim().toLowerCase();
}

function findWorkflowStepByKey(arrSteps, ...arrIdentifiers)
{
  if (!Array.isArray(arrSteps)) {
    return null;
  }

  const arrNormalizedIds = arrIdentifiers.map((strId) => normalizeStageLabel(strId));

  return arrSteps.find((objStep) => {
    const strKey = normalizeStageLabel(objStep?.stepKey);
    const strTitle = normalizeStageLabel(objStep?.title);
    return arrNormalizedIds.some((strId) => strKey === strId || strTitle === strId);
  }) || null;
}

/**
 * True when the Secretary workflow step is completed (internal sign-off through Secretary).
 *
 * @param {object[]} arrWorkflow
 * @returns {boolean}
 */
export function isUnifiedBudgetSecretaryStageApproved(arrWorkflow = [])
{
  const objSecretary = findWorkflowStepByKey(arrWorkflow, 'secretary');
  return String(objSecretary?.status || '').toLowerCase() === 'done';
}

/**
 * True when every internal-lane workflow step is completed (through Secretary).
 *
 * @param {object[]} arrWorkflow
 * @param {Array<{ aws_id: string, aws_name: string, aws_type: string }>} arrStageDefinitions
 * @returns {boolean}
 */
export function isUnifiedBudgetInternallyApproved(arrWorkflow = [], arrStageDefinitions = [])
{
  const { internalSteps } = splitUnifiedWorkflowStepsByLane(arrWorkflow, arrStageDefinitions);

  if (internalSteps.length === 0) {
    return false;
  }

  return internalSteps.every(
    (objStep) => String(objStep?.status || '').toLowerCase() === 'done'
  );
}

/**
 * External Stage Update panel: visible when internal approval is complete (Secretary approved)
 * and the budget is in external review — not rejected / not returned to Internal Consolidation.
 *
 * @param {object|null} objRecord
 * @param {object[]} arrWorkflow
 * @param {Array<{ aws_id: string, aws_name: string, aws_type: string }>} arrStageDefinitions
 * @returns {boolean}
 */
export function isExternalStageUpdatePanelVisible(
  objRecord,
  arrWorkflow = [],
  arrStageDefinitions = []
)
{
  if (!objRecord) {
    return false;
  }

  const strStatus = String(objRecord.status || '').trim().toUpperCase();
  if (strStatus === 'REJECTED') {
    return false;
  }

  const objDraft = findWorkflowStepByKey(arrWorkflow, 'draft', 'internal consolidation');
  const strDraftAction = String(objDraft?.actionText || '').toLowerCase();
  const blnReturnedForRevision = String(objDraft?.status || '').toLowerCase() === 'current'
    && (/returned/.test(strDraftAction) || strDraftAction === 'resubmit');
  if (blnReturnedForRevision) {
    return false;
  }

  if (!isUnifiedBudgetSecretaryStageApproved(arrWorkflow)) {
    return false;
  }

  return isUnifiedBudgetInternallyApproved(arrWorkflow, arrStageDefinitions);
}

/**
 * True when the full approval workflow is complete (President approved or all stages done).
 *
 * @param {object[]} arrWorkflow
 * @param {Array<{ aws_id: string, aws_name: string, aws_type: string }>} arrStageDefinitions
 * @returns {boolean}
 */
export function isUnifiedBudgetWorkflowFullyApproved(arrWorkflow = [], arrStageDefinitions = [])
{
  if (!Array.isArray(arrWorkflow) || arrWorkflow.length === 0) {
    return false;
  }

  const objPresident = findWorkflowStepByKey(arrWorkflow, 'president');
  if (String(objPresident?.status || '').toLowerCase() === 'done') {
    return true;
  }

  const { internalSteps, externalSteps } = splitUnifiedWorkflowStepsByLane(arrWorkflow, arrStageDefinitions);
  const arrTrackable = [...internalSteps, ...externalSteps];

  if (arrTrackable.length === 0) {
    return false;
  }

  return arrTrackable.every(
    (objStep) => String(objStep?.status || '').toLowerCase() === 'done'
  );
}
