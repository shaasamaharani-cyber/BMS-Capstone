/**
 * System Name: Budget Management System
 * Module Name: API Layer
 *
 * Purpose of this file:
 * Budget request line item CRUD API calls.
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


export async function getBudgetRequestItems(intBrId, objParams = {})
{
  const objResponse = await client.get(
    ENDPOINTS.BUDGET_REQUEST_ITEMS.INDEX(intBrId),
    { params: objParams }
  );

  return objResponse.data;
}


export async function getBudgetRequestItemById(intBrId, intItemId)
{
  const objResponse = await client.get(
    ENDPOINTS.BUDGET_REQUEST_ITEMS.SHOW(intBrId, intItemId)
  );

  return objResponse.data;
}


export async function createBudgetRequestItem(intBrId, objData)
{
  const objResponse = await client.post(
    ENDPOINTS.BUDGET_REQUEST_ITEMS.STORE(intBrId),
    objData
  );

  return objResponse.data;
}


export async function updateBudgetRequestItem(intBrId, intItemId, objData)
{
  const objResponse = await client.put(
    ENDPOINTS.BUDGET_REQUEST_ITEMS.UPDATE(intBrId, intItemId),
    objData
  );

  return objResponse.data;
}


export async function deleteBudgetRequestItem(intBrId, intItemId)
{
  const objResponse = await client.delete(
    ENDPOINTS.BUDGET_REQUEST_ITEMS.DESTROY(intBrId, intItemId)
  );

  return objResponse.data;
}
