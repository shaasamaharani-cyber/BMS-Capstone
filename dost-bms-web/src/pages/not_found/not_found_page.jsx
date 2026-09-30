/**
 * System Name: Budget Management System
 * Module Name: Core Module
 *
 * Purpose of this file:
 * 404 Not Found page displayed when a route does not match any registered path.
 *
 * Author(s): QUT Group 27
 *
 * Copyright (C) 2026
 * by the Department of Science and Technology - Central Office
 * Developed by Team 27, Queensland University of Technology
 * All rights reserved.
 */

import { Typography } from '../../components/ui';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div style={{ padding: 'var(--space-10)', textAlign: 'center' }}>
      <Typography variant="h1" color="primary" className="mb-4">404</Typography>
      <Typography variant="h3" className="mb-4">Page Not Found</Typography>
      <Link to="/dashboard" className="btn btn-primary">Return to Dashboard</Link>
    </div>
  );
}
