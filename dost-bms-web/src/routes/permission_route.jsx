/**
 * System Name: Budget Management System
 * Module Name: Routing Module
 *
 * Purpose of this file:
 * Route guard that checks a required permission string against the current user role before rendering a page.
 *
 * Author(s): QUT Group 27
 *
 * Copyright (C) 2026
 * by the Department of Science and Technology - Central Office
 * Developed by Team 27, Queensland University of Technology
 * All rights reserved.
 */

import { Navigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useAuth } from '../context/auth_context';
import { useHasPermission } from '../hooks/use_permissions';

export default function PermissionRoute({ permission, redirectTo = '/dashboard', children }) {
  const { isLoading, user } = useAuth();
  const hasAccess = useHasPermission(permission);

  // Wait for auth hydration (initial load OR post-login /me flight)
  if (isLoading || !user) return null;
  if (!hasAccess) return <Navigate to={redirectTo} replace />;
  return children;
}

PermissionRoute.propTypes = {
  permission: PropTypes.oneOfType([PropTypes.string, PropTypes.arrayOf(PropTypes.string)]).isRequired,
  redirectTo: PropTypes.string,
  children:   PropTypes.node.isRequired,
};
