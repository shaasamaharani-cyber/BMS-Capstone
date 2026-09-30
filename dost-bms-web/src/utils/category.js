/**
 * System Name: Budget Management System
 * Module Name: Utilities Module
 *
 * Purpose of this file:
 * Provide helper functions and utility methods for category.
 *
 * Author(s): QUT Group 27
 *
 * Copyright (C) 2026
 * by the Department of Science and Technology - Central Office
 * Developed by Team 27, Queensland University of Technology
 * All rights reserved.
 */

 
/**
 * Reuses category color tokens from utilities.css (.category-chip-*).
 *
 * @param {string} value
 * @returns {string}
 */

// Category color mapping
export const getCategorySelectClass = (value) => {
  const code = String(value || '')
    .trim()
    .toUpperCase();
  if (code === 'PS') return 'category-chip-ps';
  if (code === 'MOOE') return 'category-chip-mooe';
  if (code === 'CO') return 'category-chip-co';
  if (code === 'TAG') return 'category-chip-tag';
  return 'category-chip';
};