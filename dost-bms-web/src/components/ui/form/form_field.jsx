/**
 * System Name: Budget Management System
 * Module Name: Components Module
 *
 * Purpose of this file:
 * Labelled form field wrapper that wires a label, hint text, and error message to a single child input.
 *
 * Author(s): QUT Group 27
 *
 * Copyright (C) 2026
 * by the Department of Science and Technology - Central Office
 * Developed by Team 27, Queensland University of Technology
 * All rights reserved.
 */

import React, { cloneElement, isValidElement } from 'react';
import PropTypes from 'prop-types';

export default function FormField({ 
  label, 
  required, 
  error, 
  hint, 
  children, 
  id, 
  className = '' 
}) {
  const child = isValidElement(children) ? children : null;
  const targetId = id || (child && child.props.id) || (child && child.props.name);

  // Auto-inject error state into child Input component
  const enhancedChild = child ? cloneElement(child, {
    id: targetId,
    error: error || child.props.error,
    required: required || child.props.required
  }) : children;

  return (
    <div className={`form-group mb-3 ${className}`}>
      {label && (
        <label htmlFor={targetId} className="form-label d-block mb-1" style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500, color: 'var(--color-text-primary)' }}>
          {label} {required && <span style={{ color: 'var(--color-status-rejected-border)' }}>*</span>}
        </label>
      )}
      
      {enhancedChild}

      {error ? (
        <div style={{ color: 'var(--color-status-rejected-border)', fontSize: 'var(--font-size-xs)', marginTop: '4px' }}>
          {error}
        </div>
      ) : hint ? (
        <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)', marginTop: '4px' }}>
          {hint}
        </div>
      ) : null}
    </div>
  );
}

FormField.propTypes = {
  label: PropTypes.string,
  required: PropTypes.bool,
  error: PropTypes.string,
  hint: PropTypes.string,
  children: PropTypes.node.isRequired,
  id: PropTypes.string,
  className: PropTypes.string
};
