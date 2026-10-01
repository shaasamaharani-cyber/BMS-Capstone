/**
 * System Name: Budget Management System
 * Module Name: Hooks Module
 *
 * Purpose of this file:
 * Custom hook that reads the current user role and permissions from auth context to gate UI actions.
 *
 * Author(s): QUT Group 27
 *
 * Copyright (C) 2026
 * by the Department of Science and Technology - Central Office
 * Developed by Team 27, Queensland University of Technology
 * All rights reserved.
 */

import { useAuth } from '../context/auth_context';
import { getPermissionsForUser } from '../utils/permissions';

export function usePermissions() {
  const { user } = useAuth();
  return getPermissionsForUser(user);
}

// Pass one permission, or a list to allow any of them
export function useHasPermission(permission) {
  const arrPermissions = usePermissions();
  const arrNeeded = Array.isArray(permission) ? permission : [permission];
  return arrNeeded.some((strPermission) => arrPermissions.includes(strPermission));
}
