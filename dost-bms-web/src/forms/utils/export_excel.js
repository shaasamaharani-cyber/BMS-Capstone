/**
 * System Name: Budget Management System
 * Module Name: Forms Module
 *
 * Purpose of this file:
 * Provide helper functions and utility methods for export_excel.
 *
 * Author(s): QUT Group 27
 *
 * Copyright (C) 2026
 * by the Department of Science and Technology - Central Office
 * Developed by Team 27, Queensland University of Technology
 * All rights reserved.
 */

import * as XLSX from 'xlsx';

export function exportToExcel(schema, entry) {
  const wb = XLSX.utils.book_new();

  schema.sections.forEach((section) => {
    const tabs = section.tabs ?? [{ id: section.id, label: section.title, table: section.table }];

    tabs.forEach((tab) => {
      if (!tab.table) return;

      const key = tab.id ? `${section.id}__${tab.id}` : section.id;
      const rows = entry.sections?.[key] ?? [];
      const headers = tab.table.columns.map((column) => column.label);
      const data = rows.map((row) => tab.table.columns.map((column) => row[column.key] ?? ''));
      const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
      XLSX.utils.book_append_sheet(wb, ws, String(tab.label || section.title).slice(0, 31));
    });
  });

  XLSX.writeFile(wb, `${schema.name}.xlsx`);
}
