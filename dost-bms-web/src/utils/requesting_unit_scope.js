/**
 * System Name: Budget Management System
 * Module Name: None
 *
 * Purpose of this file:
 * Provide helper functions and utility methods for requesting_unit_scope.
 *
 * Author(s): QUT Group 27
 *
 * Copyright (C) 2026
 * by the Department of Science and Technology - Central Office
 * Developed by Team 27, Queensland University of Technology
 * All rights reserved.
 */

export function isRequesterRole(user) {
  return String(user?.role?.role_group || '').toLowerCase() === 'requester';
}

export function getScopedRequestingUnitId(user) {
  if (!isRequesterRole(user)) {
    return null;
  }

  const rawUnitId = user?.usr_requesting_unit_id ?? user?.requesting_unit?.ru_id;
  if (rawUnitId == null || rawUnitId === '') {
    return null;
  }

  const intUnitId = Number(rawUnitId);
  if (!Number.isFinite(intUnitId) || intUnitId <= 0) {
    return null;
  }

  return intUnitId;
}

export function mergeBudgetRequestListParams(params = {}, user = null) {
  const intScopedUnitId = getScopedRequestingUnitId(user);
  if (intScopedUnitId == null) {
    return params;
  }

  return {
    ...params,
    requesting_unit_id: intScopedUnitId,
  };
}

export function getScopedRequestingUnitLabel(user, requestingUnits = []) {
  const intScopedUnitId = getScopedRequestingUnitId(user);
  if (intScopedUnitId == null) {
    return '';
  }

  const fromUser = user?.requesting_unit?.ru_name;
  if (fromUser) {
    return String(fromUser);
  }

  const match = requestingUnits.find((row) => Number(row.ru_id) === intScopedUnitId);
  return match?.ru_name ? String(match.ru_name) : `Unit #${intScopedUnitId}`;
}
