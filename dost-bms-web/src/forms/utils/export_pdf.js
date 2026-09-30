/**
 * System Name: Budget Management System
 * Module Name: Forms Module
 *
 * Purpose of this file:
 * Provide helper functions and utility methods for export_pdf.
 *
 * Author(s): QUT Group 27
 *
 * Copyright (C) 2026
 * by the Department of Science and Technology - Central Office
 * Developed by Team 27, Queensland University of Technology
 * All rights reserved.
 */

export function exportToPdf(printAreaId = 'form-print-area') {
  document.body.dataset.printTarget = printAreaId;
  window.print();
  window.setTimeout(() => {
    delete document.body.dataset.printTarget;
  }, 250);
}
