/**
 * System Name: Budget Management System
 * Module Name: API Layer
 *
 * Purpose of this file:
 * Read and save quarterly spending reports (Spending Monitoring).
 *
 * Author(s): QUT Group T214
 *
 * Copyright (C) 2026
 * by the Department of Science and Technology - Central Office
 * All rights reserved.
 */

import client from './client';
import { ENDPOINTS } from './endpoints';

export async function getSpendingReports(objParams = {})
{
  const objResponse = await client.get(ENDPOINTS.SPENDING_REPORTS.INDEX, { params: objParams });

  return objResponse.data?.data || [];
}

// objPayload = { lines: [{ category_id, obligation_amount, disbursement_amount, justification }], submit }
export async function saveSpendingReport(intId, objPayload)
{
  const objResponse = await client.put(ENDPOINTS.SPENDING_REPORTS.UPDATE(intId), objPayload);

  return objResponse.data?.data;
}
