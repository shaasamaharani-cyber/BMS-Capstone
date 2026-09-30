/**
 * System Name: Budget Management System
 * Module Name: Components Module
 *
 * Purpose of this file:
 * Month or quarter grid selector used for planning-period and fiscal-year range inputs.
 *
 * Author(s): QUT Group 27
 *
 * Copyright (C) 2026
 * by the Department of Science and Technology - Central Office
 * Developed by Team 27, Queensland University of Technology
 * All rights reserved.
 */

import { useState } from 'react';
import PropTypes from 'prop-types';
import styles from './calendar_selector.module.css';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];

export default function CalendarSelector({ mode = 'month', value, onChange, label }) {
  const [currentYear, setCurrentYear] = useState(
    (value instanceof Date ? value.getFullYear() : (value?.start?.getFullYear() || new Date().getFullYear()))
  );

  const handleSelect = (idx) => {
    if (mode === 'month') {
      onChange(new Date(currentYear, idx, 1));
    } else if (mode === 'quarter') {
      // Return start of the quarter
      onChange(new Date(currentYear, idx * 3, 1));
    }
  };

  const isSelected = (idx) => {
    if (!value || value.start) return false; // Range logic skipped for simplicity
    if (mode === 'month') {
      return value.getFullYear() === currentYear && value.getMonth() === idx;
    }
    if (mode === 'quarter') {
        return value.getFullYear() === currentYear && Math.floor(value.getMonth() / 3) === idx;
    }
    return false;
  };

  const items = mode === 'quarter' ? QUARTERS : MONTHS;

  return (
    <div className={styles.container}>
      {label && <label className={styles.label}>{label}</label>}
      <div className={styles.header}>
        <button type="button" onClick={() => setCurrentYear(y => y - 1)}>&lt;</button>
        <span>{currentYear}</span>
        <button type="button" onClick={() => setCurrentYear(y => y + 1)}>&gt;</button>
      </div>
      <div className={styles.gridContainer}>
        {items.map((item, idx) => (
          <div
            key={item}
            className={`${styles.cell} ${isSelected(idx) ? styles.selected : ''}`}
            onClick={() => handleSelect(idx)}
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

CalendarSelector.propTypes = {
  mode: PropTypes.oneOf(['month', 'quarter', 'year', 'range']),
  value: PropTypes.any,
  onChange: PropTypes.func.isRequired,
  label: PropTypes.string
};
