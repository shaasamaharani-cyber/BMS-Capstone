/**
 * System Name: Budget Management System
 * Module Name: Forms Module
 *
 * Purpose of this file:
 * Renders the header section of a form entry — maps schema headerFields to labelled input controls.
 *
 * Author(s): QUT Group 27
 *
 * Copyright (C) 2026
 * by the Department of Science and Technology - Central Office
 * Developed by Team 27, Queensland University of Technology
 * All rights reserved.
 */

import styles from './flexible_forms.module.css';

function renderControl(field, value, onChange) {
  if (field.type === 'select') {
    return (
      <select className="form-select" value={value ?? ''} onChange={(event) => onChange(event.target.value)}>
        <option value="">Select</option>
        {(field.options || []).map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    );
  }

  if (field.type === 'readonly') {
    return <input className="form-control" value={value ?? ''} readOnly />;
  }

  if (field.type === 'number') {
    return (
      <input
        className="form-control"
        type="number"
        min="0"
        step="any"
        value={value ?? 0}
        onKeyDown={(event) => {
          if (event.key === '-' || event.key === 'e' || event.key === 'E') event.preventDefault();
        }}
        onChange={(event) => {
          const nextValue = Number(event.target.value);
          onChange(Number.isFinite(nextValue) ? Math.max(0, nextValue) : 0);
        }}
      />
    );
  }

  return (
    <input
      className="form-control"
      type={field.type === 'date' ? 'date' : 'text'}
      value={value ?? ''}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

export default function HeaderFields({
  fields = [],
  values = {},
  onChange,
  entryName,
  onEntryNameChange,
}) {
  return (
    <div className={styles.headerGrid}>
      {onEntryNameChange ? (
        <div className={styles.span3}>
          <label className={styles.fieldLabel}>
            Name
            <span className="text-danger ms-1">*</span>
          </label>
          <input
            className="form-control"
            type="text"
            value={entryName ?? ''}
            onChange={(event) => onEntryNameChange(event.target.value)}
            placeholder="Entry name"
          />
        </div>
      ) : null}
      {fields.map((field) => (
        <div key={field.key} className={styles[`span${field.span || 1}`] || styles.span1}>
          <label className={styles.fieldLabel}>
            {field.label}
            {field.required ? <span className="text-danger ms-1">*</span> : null}
          </label>
          {renderControl(field, values[field.key], (value) => onChange(field.key, value))}
        </div>
      ))}
    </div>
  );
}
