/**
 * System Name: Budget Management System
 * Module Name: API Layer
 *
 * Purpose of this file:
 * Admin user management API calls (CRUD, activate, deactivate).
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


export async function getUsers(intPage = 1, intPerPage = 15)
{
  const objResponse = await client.get(ENDPOINTS.USERS.INDEX, {
    params: { page: intPage, per_page: intPerPage },
  });

  return objResponse.data;
}


export async function getUserById(intId)
{
  const objResponse = await client.get(ENDPOINTS.USERS.SHOW(intId));

  return objResponse.data;
}


export async function createUser(objData)
{
  const objResponse = await client.post(ENDPOINTS.USERS.INDEX, objData);

  return objResponse.data;
}


export async function updateUser(intId, objData)
{
  const objResponse = await client.put(ENDPOINTS.USERS.UPDATE(intId), objData);

  return objResponse.data;
}


export async function deleteUser(intId)
{
  const objResponse = await client.delete(ENDPOINTS.USERS.DESTROY(intId));

  return objResponse.data;
}


export async function activateUser(intId)
{
  const objResponse = await client.post(ENDPOINTS.USERS.ACTIVATE(intId));

  return objResponse.data;
}


export async function deactivateUser(intId)
{
  const objResponse = await client.post(ENDPOINTS.USERS.DEACTIVATE(intId));

  return objResponse.data;
}
