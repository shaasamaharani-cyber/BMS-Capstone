/**
 * System Name: Budget Management System
 * Module Name: Utilities Module
 *
 * Purpose of this file:
 * Provide helper functions and utility methods for validators.
 *
 * Author(s): QUT Group 27
 *
 * Copyright (C) 2026
 * by the Department of Science and Technology - Central Office
 * Developed by Team 27, Queensland University of Technology
 * All rights reserved.
 */

export const isRequired = (value) => {
  if (value === undefined || value === null) return 'This field is required';
  if (typeof value === 'string' && value.trim() === '') return 'This field is required';
  if (Array.isArray(value) && value.length === 0) return 'Please make a selection';
  return null;
};

export const isValidEmail = (email) => {
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return re.test(String(email).toLowerCase()) ? null : 'Invalid email format';
};
