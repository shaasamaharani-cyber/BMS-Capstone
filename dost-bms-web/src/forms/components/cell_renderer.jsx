/**
 * System Name: Budget Management System
 * Module Name: Forms Module
 *
 * Purpose of this file:
 * Renders an individual table cell using the column type (text, number, computed, dropdown, date).
 *
 * Author(s): QUT Group 27
 *
 * Copyright (C) 2026
 * by the Department of Science and Technology - Central Office
 * Developed by Team 27, Queensland University of Technology
 * All rights reserved.
 */

import styles from './flexible_forms.module.css';

export default function CellRenderer({ col, row, onChange }) {
  const indent = col.indentKey
    ? { paddingLeft: `${col.indentMap?.[row[col.indentKey]] ?? 12}px` }
    : {};
  const commonStyle = {
    ...indent,
    textAlign: col.align === 'right' ? 'right' : undefined,
  };

  if (col.type === 'computed' || col.type === 'readonly' || col.editable === false) {
    return (
      <span className={styles.computedCell} style={commonStyle}>
        {row[col.key] ?? 0}
      </span>
    );
  }

  if (col.type === 'select') {
    return (
      <select
        className={styles.cellSelect}
        value={row[col.key] ?? ''}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">Select</option>
        {(col.options || []).map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    );
  }

  if (col.type === 'number') {
    const handleNumberChange = (event) => {
      const rawValue = event.target.value;
      if (rawValue === '') {
        onChange(0);
        return;
      }

      const nextValue = Number(rawValue);
      onChange(Number.isFinite(nextValue) ? Math.max(0, nextValue) : 0);
    };

    return (
      <input
        className={styles.cellInput}
        type="number"
        min="0"
        step="any"
        value={row[col.key] ?? 0}
        onKeyDown={(event) => {
          if (event.key === '-' || event.key === 'e' || event.key === 'E') event.preventDefault();
        }}
        onChange={handleNumberChange}
        style={commonStyle}
      />
    );
  }

  if (col.type === 'textarea') {
    return (
      <textarea
        className={styles.cellTextarea}
        value={row[col.key] ?? ''}
        onChange={(event) => onChange(event.target.value)}
      />
    );
  }

  if (col.type === 'date') {
    return (
      <input
        className={styles.cellInput}
        type="date"
        value={row[col.key] ?? ''}
        onChange={(event) => onChange(event.target.value)}
      />
    );
  }

  if (col.type === 'label') {
    return <span className={styles.computedCell} style={commonStyle}>{row[col.key] ?? col.label}</span>;
  }

  return (
    <input
      className={styles.cellInput}
      type="text"
      value={row[col.key] ?? ''}
      style={commonStyle}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}
