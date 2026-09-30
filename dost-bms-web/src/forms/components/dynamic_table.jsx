/**
 * System Name: Budget Management System
 * Module Name: Forms Module
 *
 * Purpose of this file:
 * Editable table component for schema-driven form sections with add/remove row support and computed columns.
 *
 * Author(s): QUT Group 27
 *
 * Copyright (C) 2026
 * by the Department of Science and Technology - Central Office
 * Developed by Team 27, Queensland University of Technology
 * All rights reserved.
 */

import CellRenderer from './cell_renderer';
import styles from './flexible_forms.module.css';
import { recomputeRow } from '../utils/formula_engine';

function buildGroupCells(columns) {
  const groups = [];
  columns.forEach((column) => {
    const label = column.group || '';
    const previous = groups.at(-1);
    if (previous && previous.label === label) {
      previous.colSpan += 1;
    } else {
      groups.push({ label, colSpan: 1 });
    }
  });
  return groups;
}

function createBlankRow(columns) {
  const blank = { id: crypto.randomUUID(), level: 1, style: 'normal' };
  columns.forEach((column) => {
    blank[column.key] = ['number', 'computed'].includes(column.type) ? 0 : '';
  });
  return recomputeRow(blank, columns);
}

function createChildRow(schema, rows, parentIndex) {
  const columns = schema?.columns || [];
  const parent = rows[parentIndex];
  const childLevel = Number(parent?.level || 0) + 1;
  const nextSectionIndex = rows.findIndex((row, index) =>
    index > parentIndex && Number(row.level || 0) <= Number(parent?.level || 0)
  );
  const endIndex = nextSectionIndex === -1 ? rows.length : nextSectionIndex;
  const siblingCount = rows
    .slice(parentIndex + 1, endIndex)
    .filter((row) => Number(row.level || 0) === childLevel && row.style !== 'label' && row.style !== 'total')
    .length;
  const child = createBlankRow(columns);

  return {
    ...child,
    level: childLevel,
    autoNumbered: true,
    [schema.childLabelKey || 'pap']: `${siblingCount + 1}.`,
  };
}

function getRowLevel(row) {
  return Number(row?.level || 0);
}

function getSectionEnd(rows, startIndex, level) {
  const nextSectionIndex = rows.findIndex((row, index) =>
    index > startIndex && getRowLevel(row) <= level
  );
  return nextSectionIndex === -1 ? rows.length : nextSectionIndex;
}

function canAddChildFromRow(schema, row, labelKey) {
  if (row?.allowAddChild === true) return true;
  if (row?.allowAddChild === false) return false;

  const label = String(row?.[labelKey] || '').trim().toLowerCase();
  return Boolean(schema?.hierarchical)
    && row?.style === 'label'
    && ['activities', 'projects'].includes(label);
}

function isAutoNumberLabel(value) {
  return /^\d+\.$/.test(String(value || '').trim());
}

function renumberChildRows(schema, rows, labelKey) {
  const updated = rows.map((row) => ({ ...row }));

  updated.forEach((parent, parentIndex) => {
    if (!canAddChildFromRow(schema, parent, labelKey)) return;

    const parentLevel = getRowLevel(parent);
    const childLevel = parentLevel + 1;
    const endIndex = getSectionEnd(updated, parentIndex, parentLevel);
    let nextNumber = 1;

    for (let index = parentIndex + 1; index < endIndex; index += 1) {
      const row = updated[index];
      const isDirectChild = getRowLevel(row) === childLevel;
      const canRenumber = row?.autoNumbered === true || isAutoNumberLabel(row?.[labelKey]);

      if (isDirectChild && row?.style !== 'label' && row?.style !== 'total' && canRenumber) {
        updated[index] = {
          ...row,
          autoNumbered: true,
          [labelKey]: `${nextNumber}.`,
        };
        nextNumber += 1;
      }
    }
  });

  return updated;
}

export default function DynamicTable({ schema, rows = [], onChange }) {
  const columns = schema?.columns || [];
  const groupCells = buildGroupCells(columns);
  const hasGroups = groupCells.some((group) => group.label);
  const labelKey = schema?.childLabelKey || columns.find((column) => column.indentKey)?.key || 'pap';

  function handleCellChange(rowId, key, value) {
    const updated = rows.map((row) => {
      if (row.id !== rowId) return row;
      const patched = { ...row, [key]: value };
      if (key === labelKey) {
        patched.autoNumbered = isAutoNumberLabel(value);
      }
      return recomputeRow(patched, columns);
    });
    onChange(updated);
  }

  function addRow() {
    onChange([...rows, createBlankRow(columns)]);
  }

  function addChildRow(parentIndex) {
    const child = createChildRow(schema, rows, parentIndex);
    const insertAt = getSectionEnd(rows, parentIndex, getRowLevel(rows[parentIndex]));
    onChange([
      ...rows.slice(0, insertAt),
      child,
      ...rows.slice(insertAt),
    ]);
  }

  function deleteRow(rowId) {
    onChange(renumberChildRows(
      schema,
      rows.filter((row) => row.id !== rowId),
      labelKey
    ));
  }

  function subtotal(column) {
    if (!['number', 'computed'].includes(column.type)) return '';
    return rows
      .filter((row) => row.style !== 'total')
      .reduce((sum, row) => sum + Number(row[column.key] || 0), 0);
  }

  return (
    <div className={styles.tableWrap}>
      <table className={styles.dynamicTable}>
        <colgroup>
          {columns.map((column) => (
            <col key={column.key} style={{ width: column.width ? `${column.width}px` : undefined }} />
          ))}
          <col className={styles.actionCol} />
        </colgroup>
        <thead>
          {hasGroups && (
            <tr>
              {groupCells.map((group, index) => (
                <th key={`${group.label}-${index}`} colSpan={group.colSpan}>
                  {group.label}
                </th>
              ))}
              <th rowSpan="2" aria-label="Actions" className={styles.actionCell} />
            </tr>
          )}
          <tr>
            {columns.map((column) => (
              <th key={column.key} style={{ width: column.width ? `${column.width}px` : undefined }}>
                {column.label}
              </th>
            ))}
            {!hasGroups && <th aria-label="Actions" className={styles.actionCell} />}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length + 1} className="text-center text-muted py-4">
                No rows yet.
              </td>
            </tr>
          ) : rows.map((row) => (
            <tr key={row.id}>
              {columns.map((column) => (
                <td key={column.key} style={{ textAlign: column.align === 'right' ? 'right' : undefined }}>
                  <CellRenderer
                    col={column}
                    row={row}
                    onChange={(value) => handleCellChange(row.id, column.key, value)}
                  />
                </td>
              ))}
              <td className={styles.actionCell}>
                {canAddChildFromRow(schema, row, labelKey) ? (
                  <button
                    type="button"
                    className={`${styles.actionButton} ${styles.addButton} no-print`}
                    onClick={() => addChildRow(rows.findIndex((item) => item.id === row.id))}
                    title="Add child row"
                    aria-label="Add child row"
                  >
                    +
                  </button>
                ) : null}
                <button
                  type="button"
                  className={`${styles.actionButton} ${styles.deleteButton} no-print`}
                  onClick={() => deleteRow(row.id)}
                  aria-label="Delete row"
                  title="Delete row"
                >
                  x
                </button>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            {columns.map((column, index) => (
              <td key={column.key} className={column.align === 'right' ? 'text-end fw-bold' : 'fw-bold'}>
                {index === 0 ? 'Subtotal' : subtotal(column)}
              </td>
            ))}
            <td />
          </tr>
          <tr>
            <td colSpan={columns.length + 1}>
              <button type="button" className="btn btn-sm btn-outline-primary no-print" onClick={addRow}>
                {schema?.addRowLabel || 'Add row'}
              </button>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
