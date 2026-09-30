/**
 * System Name: Budget Management System
 * Module Name: Forms Module
 *
 * Purpose of this file:
 * Provide helper functions and utility methods for form_object.
 *
 * Author(s): QUT Group 27
 *
 * Copyright (C) 2026
 * by the Department of Science and Technology - Central Office
 * Developed by Team 27, Queensland University of Technology
 * All rights reserved.
 */

export function deepGet(obj, path) {
  return path.reduce((acc, key) => acc?.[key], obj);
}

export function deepSet(obj, path, value) {
  if (path.length === 0) return value;

  const [head, ...tail] = path;
  const clone = Array.isArray(obj) ? [...obj] : { ...obj };
  clone[head] = deepSet(clone[head], tail, value);
  return clone;
}

export function normalizeSchemaRecord(record) {
  if (!record) return null;

  const schema = record.schema && typeof record.schema === 'object'
    ? record.schema
    : record;

  return {
    ...schema,
    id: schema.id ?? record.id,
    name: schema.name ?? record.name,
    version: schema.version ?? record.version,
    headerFields: schema.headerFields ?? record.headerFields ?? [],
    sections: schema.sections ?? record.sections ?? [],
    footer: schema.footer ?? record.footer ?? {},
  };
}

export function toSchemaRecord(schema) {
  const now = new Date().toISOString();
  return {
    id: schema.id,
    name: schema.name,
    version: schema.version ?? '',
    schema: {
      headerFields: schema.headerFields ?? [],
      sections: schema.sections ?? [],
      footer: schema.footer ?? {},
    },
    createdAt: schema.createdAt || now,
    updatedAt: now,
  };
}

export function emptySchema() {
  return {
    id: 'new-form',
    name: 'New Flexible Form',
    version: String(new Date().getFullYear()),
    headerFields: [
      { key: 'department', label: 'Department', type: 'text', span: 1, required: true },
      { key: 'agency', label: 'Agency', type: 'text', span: 1 },
      { key: 'year', label: 'Year', type: 'text', span: 1 },
    ],
    sections: [
      {
        id: 'section1',
        title: 'Section Title',
        collapsible: true,
        table: {
          addRowLabel: 'Add row',
          hierarchical: true,
          columns: [
            { key: 'name', label: 'Activity Name', type: 'text', indentKey: 'level', indentMap: { 0: 12, 1: 24, 2: 40 } },
            { key: 'ps', label: 'PS', type: 'number', align: 'right', width: 90, group: 'AMOUNT (in thousand)' },
            { key: 'mooe', label: 'MOOE', type: 'number', align: 'right', width: 90, group: 'AMOUNT (in thousand)' },
            { key: 'total', label: 'Total', type: 'computed', formula: 'ps + mooe', align: 'right', width: 90, editable: false, group: 'AMOUNT (in thousand)' },
          ],
        },
      },
    ],
    footer: { showGrandTotal: true, notes: [], signers: [] },
  };
}

export function getEntryDisplayName(entry, fallback = '') {
  const trimmedName = String(entry?.name ?? '').trim();
  if (trimmedName) return trimmedName;

  const headerFallback = entry?.header?.department || entry?.header?.agency || entry?.header?.year;
  if (headerFallback) return String(headerFallback);

  return entry?.id || fallback;
}


export function createBlankEntry(schema) {
  const sections = {};

  (schema.sections || []).forEach((section) => {
    if (section.table?.defaultRows) {
      sections[section.id] = section.table.defaultRows;
    }

    (section.tabs || []).forEach((tab) => {
      if (tab.table?.defaultRows) {
        sections[`${section.id}__${tab.id}`] = tab.table.defaultRows;
      }
    });
  });

  return {
    id: crypto.randomUUID(),
    schemaId: schema.id,
    name: '',
    status: 'draft',
    header: {},
    sections,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function collectSchemaTables(sections = []) {
  const tables = [];

  sections.forEach((section) => {
    if (section.table) {
      tables.push({ key: section.id, title: section.title || section.id, table: section.table });
    }

    (section.tabs || []).forEach((tab) => {
      if (!tab.table) return;
      tables.push({
        key: `${section.id}__${tab.id}`,
        title: `${section.title || section.id} - ${tab.label || tab.id}`,
        table: tab.table,
      });
    });

    tables.push(...collectSchemaTables(section.subsections || []));
  });

  return tables;
}

export function validateFormEntry(schema, entry) {
  const errors = [];

  if (String(entry?.name ?? '').trim() === '') {
    errors.push('Name is required.');
  }

  (schema?.headerFields || []).forEach((field) => {
    const value = entry?.header?.[field.key];
    if (field.required && String(value ?? '').trim() === '') {
      errors.push(`${field.label || field.key} is required.`);
    }

    if (field.type === 'number' && Number(value ?? 0) < 0) {
      errors.push(`${field.label || field.key} cannot be below 0.`);
    }
  });

  collectSchemaTables(schema?.sections || []).forEach(({ key, title, table }) => {
    const numberColumns = (table.columns || []).filter((column) => column.type === 'number');
    const rows = entry?.sections?.[key] || [];

    rows.forEach((row, rowIndex) => {
      numberColumns.forEach((column) => {
        if (Number(row?.[column.key] ?? 0) < 0) {
          errors.push(`${title}, row ${rowIndex + 1}: ${column.label || column.key} cannot be below 0.`);
        }
      });
    });
  });

  return errors;
}
