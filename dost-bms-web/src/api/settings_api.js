/**
 * System Name: Budget Management System
 * Module Name: API Layer
 *
 * Purpose of this file:
 * Calls for the administrator's Settings page: alert thresholds, approval stages, requesting units,
 * fiscal years and the list of setting changes.
 *
 * Author(s): QUT Group T214
 *
 * Copyright (C) 2026
 * by the Department of Science and Technology - Central Office
 * All rights reserved.
 */

import client from './client';

const dataOf = (objResponse) => objResponse.data?.data ?? objResponse.data;

export const getAppSettings = async () => dataOf(await client.get('/settings'));
export const updateAppSettings = async (objSettings) => dataOf(await client.put('/settings', objSettings));
export const getSettingsChanges = async () => dataOf(await client.get('/settings/changes'));

// All stages, including those turned off (the consolidation pages ask for active ones only)
export const getAllApprovalStages = async () => dataOf(await client.get('/approval-workflow-stages'));
export const updateApprovalStage = async (intId, blnActive) => dataOf(await client.put(`/approval-workflow-stages/${intId}`, { aws_is_active: blnActive ? 1 : 0 }));

export const getAllRequestingUnits = async () => dataOf(await client.get('/requesting-units'));
export const createRequestingUnit = async (strName) => dataOf(await client.post('/requesting-units', { ru_name: strName }));
export const updateRequestingUnit = async (intId, objChanges) => dataOf(await client.put(`/requesting-units/${intId}`, objChanges));

export const getAllFiscalYears = async () => dataOf(await client.get('/fiscal-years'));
export const createFiscalYear = async (intYear) => dataOf(await client.post('/fiscal-years', { fy_year: intYear }));
export const updateFiscalYear = async (intId, blnActive) => dataOf(await client.put(`/fiscal-years/${intId}`, { fy_is_active: blnActive ? 1 : 0 }));

export const getBudgetCategoryList = async () => dataOf(await client.get('/budget-categories'));
