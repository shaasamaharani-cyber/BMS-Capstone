/**
 * System Name: Budget Management System
 * Module Name: API Layer
 *
 * Purpose of this file:
 * Fetch financial dashboard datasets and filter options.
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

export async function getDashboardData(objFilters = {})
{
  const objResponse = await client.get(ENDPOINTS.DASHBOARD.INDEX, { params: objFilters });

  return objResponse.data?.data || objResponse.data || {};
}
