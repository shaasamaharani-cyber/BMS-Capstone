/**
 * System Name: Budget Management System
 * Module Name: Components Module
 *
 * Purpose of this file:
 * Sidebar summary card that breaks down budget line-item totals by category (PS, MOOE, CO, TAG) and grand total.
 *
 * Author(s): QUT Group 27
 *
 * Copyright (C) 2026
 * by the Department of Science and Technology - Central Office
 * Developed by Team 27, Queensland University of Technology
 * All rights reserved.
 */

import { formatCurrency } from '../../utils/formatters';

export default function BudgetRequestTotalsSummary({ totals }) {
  return (
    <div className="card border rounded-3 p-3 mb-3">
      <p className="fw-bold text-uppercase mb-0 section-eyebrow">
        Budget Planning
      </p>
      <p className="text-muted mb-3 caption-xs">
        Total Aggregates
      </p>

      <p className="text-muted text-uppercase mb-1 caption-xs">
        Personnel Services (PS)
      </p>
      <p className="fw-bold mb-3 metric-value-brand">
        {formatCurrency(totals.psTotal)}
      </p>

      <p className="text-muted text-uppercase mb-1 caption-xs">
        MOOE
      </p>
      <p className="fw-bold mb-3 metric-value-mooe">
        {formatCurrency(totals.mooeTotal)}
      </p>

      <p className="text-muted text-uppercase mb-1 caption-xs">
        Capital Outlay (CO)
      </p>
      <p className="fw-bold mb-3 metric-value-co">
        {formatCurrency(totals.coTotal)}
      </p>

      <p className="text-muted text-uppercase mb-1 caption-xs">
        Project Tagging (TAG)
      </p>
      <p className="fw-bold mb-3 metric-value-tag">
        {formatCurrency(totals.tagTotal)}
      </p>

      <hr />
      <p className="text-muted small mb-1">Grand Total</p>
      <p className="fw-bold metric-grand-total">
        {formatCurrency(totals.grandTotal)}
      </p>
    </div>
  );
}