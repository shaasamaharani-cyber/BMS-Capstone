/**
 * System Name: Budget Management System
 * Module Name: Components Module
 *
 * Purpose of this file:
 * Summary metric card displaying a label, large value, optional subtitle, accent border, and progress bar.
 *
 * Author(s): QUT Group 27
 *
 * Copyright (C) 2026
 * by the Department of Science and Technology - Central Office
 * Developed by Team 27, Queensland University of Technology
 * All rights reserved.
 */

import PropTypes from 'prop-types';

/**
 * MetricCard — Summary banner used in the Budget Consolidation page.
 *
 * Props:
 *   label       {string} — Small muted label shown above the value (e.g. "Total Requests to Review")
 *   value       {string|number} — Large bold figure (e.g. "15", "40M")
 *   subtitle    {string} — Optional secondary line below the value (e.g. "Files Pending")
 *   accentColor {string} — CSS color for the bottom border accent (e.g. "#2980b9")
 *   progress    {number|null} — Optional progress percentage (0-100)
 */
export default function MetricCard({ label, value, subtitle, accentColor, progress }) {
  return (
    <div
      className="card shadow-sm h-100"
      style={{ borderBottom: `3px solid ${accentColor}`, borderRadius: '10px' }}
    >
      <div className="card-body py-3 px-4">
        <p
          className="text-muted text-uppercase mb-2"
          style={{ fontSize: '11px', letterSpacing: '0.06em', fontWeight: 500 }}
        >
          {label}
        </p>
        <p className="metric-card-value">
          {value}
        </p>
        {subtitle && (
          <p className="text-muted mb-0 mt-1" style={{ fontSize: '12px' }}>
            {subtitle}
          </p>
        )}
        {typeof progress === 'number' && (
          <div className="mt-2">
            <div className="progress" style={{ height: '6px' }}>
              <div
                className="progress-bar"
                role="progressbar"
                style={{ width: `${Math.max(0, Math.min(100, progress))}%`, backgroundColor: accentColor }}
                aria-valuenow={Math.round(progress)}
                aria-valuemin="0"
                aria-valuemax="100"
              />
            </div>
            <p className="text-muted mb-0 mt-1" style={{ fontSize: '11px' }}>
              {Math.round(progress)}%
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

MetricCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  subtitle: PropTypes.string,
  accentColor: PropTypes.string,
  progress: PropTypes.number,
};

MetricCard.defaultProps = {
  subtitle: null,
  accentColor: '#6c757d',
  progress: null,
};
