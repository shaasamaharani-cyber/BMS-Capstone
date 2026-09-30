/**
 * System Name: Budget Management System
 * Module Name: API Layer
 *
 * Purpose of this file:
 * Requesting unit API calls.
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


export async function getRequestingUnits(objParams = {})
{
  const objResponse = await client.get(ENDPOINTS.REQUESTING_UNITS.INDEX, { params: objParams });

  return objResponse.data;
}

