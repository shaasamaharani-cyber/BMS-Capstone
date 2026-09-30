/**
 * System Name: Budget Management System
 * Module Name: API Layer
 *
 * Purpose of this file:
 * CRUD calls for flexible form schemas and form entries, including schema seeding helpers.
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

const dataRows = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const dataOne = (payload) => payload?.data ?? payload;

export async function fetchAllSchemas() {
  const response = await client.get(ENDPOINTS.FORM_SCHEMAS.INDEX);
  return dataRows(response.data);
}

export async function fetchSchema(id) {
  const response = await client.get(ENDPOINTS.FORM_SCHEMAS.SHOW(id));
  return dataOne(response.data);
}

export async function createSchema(schemaObj) {
  const response = await client.post(ENDPOINTS.FORM_SCHEMAS.STORE, schemaObj);
  return dataOne(response.data);
}

export async function updateSchema(id, schemaObj) {
  const response = await client.put(ENDPOINTS.FORM_SCHEMAS.UPDATE(id), schemaObj);
  return dataOne(response.data);
}

export async function deleteSchema(id) {
  const response = await client.delete(ENDPOINTS.FORM_SCHEMAS.DESTROY(id));
  return response.data;
}

export async function fetchEntriesBySchema(schemaId, params = {}) {
  const response = await client.get(ENDPOINTS.FORM_ENTRIES.INDEX, { params: { ...params, schemaId } });
  return response.data;
}

export async function fetchEntry(id) {
  const response = await client.get(ENDPOINTS.FORM_ENTRIES.SHOW(id));
  return dataOne(response.data);
}

export async function createEntry(entryObj) {
  const response = await client.post(ENDPOINTS.FORM_ENTRIES.STORE, entryObj);
  return dataOne(response.data);
}

export async function updateEntry(id, entryObj) {
  const response = await client.put(ENDPOINTS.FORM_ENTRIES.UPDATE(id), entryObj);
  return dataOne(response.data);
}

export async function deleteEntry(id) {
  const response = await client.delete(ENDPOINTS.FORM_ENTRIES.DESTROY(id));
  return response.data;
}
