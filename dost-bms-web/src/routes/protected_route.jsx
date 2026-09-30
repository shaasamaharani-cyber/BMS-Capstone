/**
 * System Name: Budget Management System
 * Module Name: Routing Module
 *
 * Purpose of this file:
 * Guard protected routes by checking localStorage session token.
 *
 * Author(s): QUT Group 27
 *
 * Copyright (C) 2026
 * by the Department of Science and Technology - Central Office
 * Developed by Team 27, Queensland University of Technology
 * All rights reserved.
 */

import PropTypes from 'prop-types';
import { Navigate } from 'react-router-dom';
import { isAuthenticated } from '../utils/auth';

export default function ProtectedRoute({ children })
{
  if (!isAuthenticated())
  {
    return <Navigate to="/login" replace />;
  }

  return children;
}

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

