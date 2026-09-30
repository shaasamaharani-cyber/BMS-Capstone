/**
 * System Name: Budget Management System
 * Module Name: API Layer
 *
 * Purpose of this file:
 * Budget consolidation API calls.
 *
 * Author(s): QUT Group 27
 *
 * Copyright (C) 2026
 * by the Department of Science and Technology - Central Office
 * Developed by Team 27, Queensland University of Technology
 * All rights reserved.
 */

import client from './client';
import { getBudgetRequests } from './budget_requests_api';


const UNIFIED_BUDGETS_ENDPOINT = '/unified-budgets';

const dataRows = (payload) =>
{
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};


export async function getUnifiedBudgets(objFilters = {})
{
  const objResponse = await client.get(UNIFIED_BUDGETS_ENDPOINT, { params: objFilters });

  return objResponse.data;
}


export async function getUnifiedBudgetStageOptions()
{
  const objResponse = await client.get(`${UNIFIED_BUDGETS_ENDPOINT}/options/stages`);

  return dataRows(objResponse.data);
}


export async function getUnifiedBudgetStatusOptions()
{
  const objResponse = await client.get(`${UNIFIED_BUDGETS_ENDPOINT}/options/statuses`);

  return dataRows(objResponse.data);
}


export async function getUnifiedBudgetFiscalYearOptions()
{
  const objResponse = await client.get(`${UNIFIED_BUDGETS_ENDPOINT}/options/fiscal-years`);

  return dataRows(objResponse.data);
}


/**
 * Fetch active approval workflow stages.
 * Uses API when available and falls back to local workflow defaults in the UI.
 *
 * @returns {Promise<Array<{ aws_id: string, aws_name: string, aws_type: string, aws_sequence_order: number }>>}
 */
export async function getApprovalWorkflowStages()
{
  const objResponse = await client.get('/approval-workflow-stages', {
    params: { aws_is_active: 1 },
  });

  const arrRows = dataRows(objResponse.data);

  return arrRows
    .map((objStage, intIdx) => ({
      aws_id:             String(objStage?.aws_id || ''),
      aws_name:           String(objStage?.aws_name || ''),
      aws_type:           String(objStage?.aws_type || 'approval'),
      aws_sequence_order: Number(objStage?.aws_sequence_order) || (intIdx + 1),
    }))
    .filter((objStage) => objStage.aws_id !== '' && objStage.aws_name !== '')
    .sort((objA, objB) => objA.aws_sequence_order - objB.aws_sequence_order);
}


export async function getSummaryStats()
{
  const objResponse = await client.get(`${UNIFIED_BUDGETS_ENDPOINT}/summary-stats`);

  return objResponse.data;
}


export async function createUnifiedBudget(objPayload)
{
  const objResponse = await client.post(UNIFIED_BUDGETS_ENDPOINT, objPayload);

  return objResponse.data;
}


export async function getUnifiedBudgetById(strId)
{
  const objResponse = await client.get(`${UNIFIED_BUDGETS_ENDPOINT}/${strId}`);

  return objResponse.data;
}


export async function updateUnifiedBudget(strId, objUpdates = {})
{
  const objResponse = await client.put(`${UNIFIED_BUDGETS_ENDPOINT}/${strId}`, objUpdates);

  return objResponse.data;
}


export async function getBudgetRequestsByIds(arrIds = [])
{
  const objResult = await getBudgetRequests({ ids: arrIds.join(',') });

  return dataRows(objResult);
}


export async function approveUnifiedBudget(strId, objData = {})
{
  const objResponse = await client.post(`${UNIFIED_BUDGETS_ENDPOINT}/${strId}/approve`, objData);

  return objResponse.data;
}


export async function rejectUnifiedBudget(strId, objData = {})
{
  const objResponse = await client.post(`${UNIFIED_BUDGETS_ENDPOINT}/${strId}/reject`, objData);

  return objResponse.data;
}
