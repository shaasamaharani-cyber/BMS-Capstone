/**
 * System Name: Budget Management System
 * Module Name: Dashboard
 *
 * Purpose of this file:
 * Shared dashboard filter section for planning and monitoring tabs.
 *
 * Author(s): QUT Group 27
 *
 * Copyright (C) 2026
 * by the Department of Science and Technology - Central Office
 * Developed by Team 27, Queensland University of Technology
 * All rights reserved.
 */

import PropTypes from 'prop-types';
import { Button, Dropdown } from '../ui';

export default function DashboardFilters({
  value,
  options,
  onChange,
  onApply,
  onClear,
  loading = false,
})
{
  return (
    <div className="card card-surface p-3 mb-4">
      <div className="row g-3 align-items-end">
        <div className="col-lg-2 col-md-6">
          <label className="form-label dashboard-filter-label">Fiscal Year</label>
          <Dropdown
            options={options.fiscalYears}
            value={value.fiscal_year_id}
            onChange={(strValue) => onChange('fiscal_year_id', strValue)}
            placeholder="All Fiscal Years"
          />
        </div>

        <div className="col-lg-3 col-md-6">
          <label className="form-label dashboard-filter-label">Category</label>
          <Dropdown
            options={options.categories}
            value={value.category_id}
            onChange={(strValue) => onChange('category_id', strValue)}
            placeholder="All Categories"
          />
        </div>

        <div className="col-lg-3 col-md-6">
          <label className="form-label dashboard-filter-label">Requesting Unit</label>
          <Dropdown
            options={options.requestingUnits}
            value={value.requesting_unit_id}
            onChange={(strValue) => onChange('requesting_unit_id', strValue)}
            placeholder="All Requesting Units"
            searchable
          />
        </div>

        <div className="col-lg-2 col-md-6">
          <label className="form-label dashboard-filter-label">Period</label>
          <Dropdown
            options={options.periods}
            value={value.period}
            onChange={(strValue) => onChange('period', strValue)}
            placeholder="Select Period"
          />
        </div>
        <div className="col-lg-1 col-md-6">
          <Button
            variant="primary"
            fullWidth
            onClick={onApply}
            loading={loading}
          >
            Apply
          </Button>
        </div>
        <div className="col-lg-1 col-md-6">
          <Button
            variant="secondary"
            fullWidth
            onClick={onClear}
            disabled={loading}
          >
            Clear
          </Button>
        </div>

        
      </div>
    </div>
  );
}

DashboardFilters.propTypes = {
  value: PropTypes.shape({
    fiscal_year_id: PropTypes.string,
    category_id: PropTypes.string,
    requesting_unit_id: PropTypes.string,
    period: PropTypes.string,
  }).isRequired,
  options: PropTypes.shape({
    fiscalYears: PropTypes.arrayOf(PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    })),
    categories: PropTypes.arrayOf(PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    })),
    requestingUnits: PropTypes.arrayOf(PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    })),
    periods: PropTypes.arrayOf(PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    })),
  }).isRequired,
  onChange: PropTypes.func.isRequired,
  onApply: PropTypes.func.isRequired,
  onClear: PropTypes.func.isRequired,
  loading: PropTypes.bool,
};
