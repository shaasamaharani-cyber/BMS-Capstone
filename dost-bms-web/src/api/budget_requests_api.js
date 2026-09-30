/**
 * System Name: Budget Management System
 * Module Name: API Layer
 *
 * Purpose of this file:
 * Budget request CRUD and workflow API calls.
 *
 * Author(s): QUT Group 27
 *
 * Copyright (C) 2026
 * by the Department of Science and Technology - Central Office
 * Developed by Team 27, Queensland University of Technology
 * All rights reserved.
 */

import client from './client';
import { ENDPOINTS } from './endpoints';


export async function getBudgetRequests(objParams = {})
{
  const objResponse = await client.get(ENDPOINTS.BUDGET_REQUESTS.INDEX, { params: objParams });

  return objResponse.data;
}


export async function getBudgetRequestById(intId)
{
  const objResponse = await client.get(ENDPOINTS.BUDGET_REQUESTS.SHOW(intId));

  return objResponse.data;
}


export async function createBudgetRequest(objData)
{
  const objResponse = await client.post(ENDPOINTS.BUDGET_REQUESTS.STORE, objData);

  return objResponse.data;
}


export async function updateBudgetRequest(intId, objData)
{
  const objResponse = await client.put(ENDPOINTS.BUDGET_REQUESTS.UPDATE(intId), objData);

  return objResponse.data;
}


export async function deleteBudgetRequest(intId)
{
  const objResponse = await client.delete(ENDPOINTS.BUDGET_REQUESTS.DESTROY(intId));

  return objResponse.data;
}


export async function submitBudgetRequest(intId, objData = {})
{
  const objResponse = await client.post(ENDPOINTS.BUDGET_REQUESTS.SUBMIT(intId), objData);

  return objResponse.data;
}


export async function reviewBudgetRequest(intId, objData)
{
  const objResponse = await client.post(ENDPOINTS.BUDGET_REQUESTS.REVIEW(intId), objData);

  return objResponse.data;
}


export async function getBudgetRequestVersions(intId)
{
  const objResponse = await client.get(ENDPOINTS.BUDGET_REQUESTS.VERSIONS(intId));

  return objResponse.data;
}


export async function getBudgetRequestVersionDetail(intId, intVersionId)
{
  const objResponse = await client.get(
    ENDPOINTS.BUDGET_REQUESTS.VERSION_DETAIL(intId, intVersionId)
  );

  return objResponse.data;
}


// Convenience wrapper that filters requests with a reviewed/approved status
export async function getReviewedBudgetRequests(objParams = {})
{
  return getBudgetRequests({ ...objParams, status: 'reviewed' });
}


export async function getBudgetReviewList(objParams = {})
{
  const objResponse = await client.get(ENDPOINTS.BUDGET_REVIEW.INDEX, { params: objParams });

  return objResponse.data;
}


// Convenience wrapper that fetches multiple requests by an array of IDs
export async function getBudgetRequestsByIds(arrIds = [])
{
  return getBudgetRequests({ ids: arrIds.join(',') });
}


export async function getBudgetRequestActivity(intId)
{
  const objResponse = await client.get(ENDPOINTS.BUDGET_REQUESTS.ACTIVITY(intId));

  return objResponse.data;
}
