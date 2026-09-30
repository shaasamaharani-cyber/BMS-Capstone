/**
 * System Name: Budget Management System
 * Module Name: API Layer
 *
 * Purpose of this file:
 * Authentication API calls — login, logout, current user.
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


// Returns { token, user, role, permissions, must_change_password }
export async function login(strEmail, strPassword)
{
  const objResponse = await client.post(ENDPOINTS.AUTH.LOGIN, {
    usr_email:    strEmail,
    usr_password: strPassword,
  });

  return objResponse.data;
}


// Revokes the current Sanctum token server-side
export async function logout()
{
  const objResponse = await client.post(ENDPOINTS.AUTH.LOGOUT);

  return objResponse.data;
}


// Returns { user, role, permissions }
export async function me()
{
  const objResponse = await client.get(ENDPOINTS.AUTH.ME);

  return objResponse.data;
}
