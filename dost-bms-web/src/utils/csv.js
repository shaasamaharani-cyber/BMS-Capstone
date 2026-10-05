/**
 * System Name: Budget Management System
 * Module Name: Utilities
 *
 * Purpose of this file:
 * Build a CSV file from rows and download it in the browser (opens in Excel).
 *
 * Author(s): QUT Group T214
 *
 * Copyright (C) 2026
 * by the Department of Science and Technology - Central Office
 * All rights reserved.
 */

// Quote a value only when it contains a comma, quote or line break; double any quotes inside
function csvCell(value) {
  const strValue = value === null || value === undefined ? '' : String(value);
  return /[",\r\n]/.test(strValue) ? `"${strValue.replace(/"/g, '""')}"` : strValue;
}

export function toCsv(arrHeaders, arrRows) {
  return [arrHeaders, ...arrRows].map((arrRow) => arrRow.map(csvCell).join(',')).join('\r\n');
}

// The byte-order mark makes Excel read the file as UTF-8
export function downloadCsv(strFilename, arrHeaders, arrRows) {
  const objUrl = URL.createObjectURL(new Blob([String.fromCharCode(0xFEFF) + toCsv(arrHeaders, arrRows)], { type: 'text/csv;charset=utf-8' }));
  const elLink = document.createElement('a');
  elLink.href = objUrl;
  elLink.download = strFilename;
  elLink.click();
  URL.revokeObjectURL(objUrl);
}
