/**
 * System Name: Budget Management System
 * Module Name: Components Module
 *
 * Purpose of this file:
 * Main budget request form layout composing general info fields, line items table, workflow timeline, and action sidebar.
 *
 * Author(s): QUT Group 27
 *
 * Copyright (C) 2026
 * by the Department of Science and Technology - Central Office
 * Developed by Team 27, Queensland University of Technology
 * All rights reserved.
 */

import PropTypes from 'prop-types';
import { BsPlusCircle, BsTrashFill } from 'react-icons/bs';
import { Button, Table, FormField, Input, Dropdown, Badge } from '../ui';
import { getCategorySelectClass } from '../../utils/category';
import {
  COST_STRUCTURE_OPTIONS,
  getCostStructureAbbreviation,
} from '../../utils/cost_structure';
import { ReviewWorkflowTimeline } from '../shared/approval_workflow_timeline';
import BudgetRequestTotalsSummary from '../shared/budget_request_totals_summary';
// Budget Request Form Components
export default function BudgetRequestForm({
  mode,
  isEditable,
  formData,
  maxLengths,
  errors,
  fiscalYearOptions,
  planningPeriodOptions,
  requestingUnitOptions,
  budgetCategoryOptions,
  formSchemaOptions = [],
  formEntryOptions = [],
  attachedForms = [],
  selectedFormSchemaId = '',
  selectedFormEntryId = '',
  lineItems,
  totals,
  workflowSteps,
  actions,
  onFieldChange,
  onLineItemChange,
  onAddLineItem,
  onDeleteLineItem,
  onSelectedFormSchemaChange = () => {},
  onSelectedFormEntryChange = () => {},
  onAttachForm = () => {},
  onDetachForm = () => {},
  formatCurrency,
  showLineItemAddButton = true,
  sidebarTopContent = null,
  showAttachedFormsSection = true,
  unitFieldDisabled = false,
}) {
  const canEdit = mode === 'create' || (mode === 'edit' && isEditable);
  const normalizedStatus = String(formData.status || '').toLowerCase();
  const badgeStatus = normalizedStatus === 'submitted' ? 'pending' : normalizedStatus;
  
  // Only show version > 0, and get from currentVersionNumber
  const intCurrentVersion = Number(formData.currentVersionNumber);
  const showCurrentVersion =
    Number.isFinite(intCurrentVersion) &&
    (intCurrentVersion > 0);

  const setAutoHeight = (el) => {
    if (!el) return;
    el.style.height = '1px';
    el.style.height = `${el.scrollHeight}px`;
  };

  return (
    <div className="row g-0">
      <div className="col-12 col-lg-9 p-4">
        <div className="card border rounded-3 p-4 mb-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <span className="fw-bold text-uppercase section-eyebrow">
              General Information
            </span>
            <div className="d-flex align-items-center">
              <Badge status={badgeStatus} />
              <span className="text-muted small ms-2">Ref: {formData.referenceCode}</span>
              {showCurrentVersion ? (
                <span className="text-muted small ms-2">Version: {intCurrentVersion}</span>
              ) : null}
            </div>
          </div>

          <FormField label="Title">
            <Input
              placeholder="Enter budget request title"
              value={formData.title}
              maxLength={maxLengths.title}
              onChange={(e) => onFieldChange('title', e.target.value)}
              disabled={!canEdit}
            />
            {errors.title ? <div className="text-danger small mt-1">{errors.title}</div> : null}
            <div className="text-muted small mt-1 text-end">{formData.title.length}/{maxLengths.title}</div>
          </FormField>

          <FormField label="Requesting Unit">
            <Dropdown
              className="w-100"
              options={requestingUnitOptions}
              value={formData.unit}
              onChange={(value) => onFieldChange('unit', value)}
              placeholder="Select requesting unit"
              disabled={!canEdit || unitFieldDisabled}
            />
            {errors.unit ? <div className="text-danger small mt-1">{errors.unit}</div> : null}
          </FormField>

          <FormField label="Description">
            <Input
              type="textarea"
              rows={4}
              placeholder="Enter a description for this budget request"
              value={formData.description}
              maxLength={maxLengths.description}
              onChange={(e) => onFieldChange('description', e.target.value)}
              disabled={!canEdit}
            />
            {errors.description ? <div className="text-danger small mt-1">{errors.description}</div> : null}
            <div className="text-muted small mt-1 text-end">{formData.description.length}/{maxLengths.description}</div>
          </FormField>

          <div className="row g-3">
            <div className="col-12 col-md-6">
              <FormField label="Fiscal Year">
                <div className="field-width-200">
                  <Dropdown
                    options={fiscalYearOptions}
                    value={formData.fiscalYear}
                    onChange={(value) => onFieldChange('fiscalYear', value)}
                    placeholder="Select fiscal year"
                    disabled={!canEdit}
                  />
                </div>
                {errors.fiscalYear ? <div className="text-danger small mt-1">{errors.fiscalYear}</div> : null}
              </FormField>
            </div>
            <div className="col-12 col-md-6">
              <FormField label="Planning Period">
                <div className="field-width-200">
                  <Dropdown
                    options={planningPeriodOptions}
                    value={formData.planningPeriod}
                    onChange={(value) => onFieldChange('planningPeriod', value)}
                    placeholder="Select planning period"
                    disabled={!canEdit}
                  />
                </div>
                {errors.planningPeriod ? <div className="text-danger small mt-1">{errors.planningPeriod}</div> : null}
              </FormField>
            </div>
          </div>

          {/* {showAttachedFormsSection ? <FormField label="Attached Forms">
            {canEdit ? (
              <>
                <div className="row g-2">
                  <div className="col-12 col-md-6">
                    <Dropdown
                      className="w-100"
                      options={formSchemaOptions}
                      value={selectedFormSchemaId}
                      onChange={onSelectedFormSchemaChange}
                      placeholder="Select form type"
                      disabled={!canEdit}
                    />
                  </div>
                  <div className="col-12 col-md-6">
                    <Dropdown
                      className="w-100"
                      options={formEntryOptions}
                      value={selectedFormEntryId}
                      onChange={onSelectedFormEntryChange}
                      placeholder="Select created form"
                      disabled={!canEdit || !selectedFormSchemaId}
                    />
                  </div>
                </div>
                <div className="d-flex align-items-center gap-2 mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onAttachForm}
                    disabled={!canEdit || !selectedFormSchemaId || !selectedFormEntryId}
                  >
                    Add Form
                  </Button>
                  <span className="text-muted small">Choose from entries created on the Forms page.</span>
                </div>
              </>
            ) : null}
            {attachedForms.length > 0 ? (
              <div className="d-flex flex-column gap-2 mt-3">
                {attachedForms.map((form) => (
                  <div key={`${form.schemaId}:${form.entryId}`} className="border rounded-3 px-3 py-2">
                    <div className="d-flex align-items-center justify-content-between gap-2">
                      <div>
                        <div className="fw-semibold">{form.schemaName || form.schemaId}</div>
                        <div className="text-muted small">
                          {form.entryLabel || form.entryId}
                          {form.pdfGeneratedAt ? (
                            <span className="ms-2">PDF saved {new Date(form.pdfGeneratedAt).toLocaleString()}</span>
                          ) : null}
                        </div>
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        {form.pdfUrl ? (
                          <a
                            className="btn btn-sm btn-outline-primary"
                            href={form.pdfUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Open PDF
                          </a>
                        ) : (
                          <span className="text-muted small">Save form to generate PDF</span>
                        )}
                        {canEdit ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDetachForm(form.entryId)}
                          >
                            Remove
                          </Button>
                        ) : null}
                      </div>
                    </div>
                    {form.pdfUrl ? (
                      <iframe
                        className="w-100 border rounded-2 mt-2"
                        src={form.pdfUrl}
                        title={`${form.schemaName || form.schemaId} preview`}
                        style={{ height: 420 }}
                      />
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-muted small mt-2">No forms attached.</div>
            )}
          </FormField> : null} */}
        </div>

        <div className="card border rounded-3 p-4 mb-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <span className="fw-bold text-uppercase section-eyebrow">
              Budget Line Items
            </span>
            {showLineItemAddButton ? (
              <Button
                variant="outline"
                size="sm"
                leftIcon={<BsPlusCircle />}
                onClick={onAddLineItem}
                disabled={!canEdit}
              >
                Add New Item
              </Button>
            ) : null}
          </div>
          {errors.lineItems ? <div className="text-danger small mb-2">{errors.lineItems}</div> : null}

          <div className="budget-line-items-scroll">
            <Table
              columns={[
                {
                  key: 'name',
                  label: 'Item Name',
                  width: '22%',
                  render: (_, row, rowIdx) => {
                    const rowErr = errors.lineItemErrors?.[rowIdx]?.name;
                    return (
                      <div>
                        <textarea
                          className={`form-control form-control-sm budget-request-line-item-textarea${rowErr ? ' is-invalid' : ''}`}
                          placeholder="Item name"
                          maxLength={maxLengths.lineItemName}
                          value={row.name}
                          disabled={!canEdit}
                          ref={setAutoHeight}
                          onChange={(e) => onLineItemChange(row.id, 'name', e.target.value, rowIdx)}
                        />
                        {rowErr ? <div className="text-danger small">{rowErr}</div> : null}
                      </div>
                    );
                  },
                },
                {
                  key: 'costStructure',
                  label: 'Cost Structure',
                  width: '90px',
                  render: (_, row, rowIdx) => {
                    const rowErr = errors.lineItemErrors?.[rowIdx]?.costStructure;
                    return (
                      <div>
                        <select
                          className={`form-select form-select-sm${rowErr ? ' is-invalid' : ''}`}
                          value={row.costStructure || ''}
                          disabled={!canEdit}
                          title={row.costStructure || ''}
                          onChange={(e) => onLineItemChange(row.id, 'costStructure', e.target.value, rowIdx)}
                        >
                          {COST_STRUCTURE_OPTIONS.map((opt) => (
                            <option key={opt} value={opt} title={opt}>
                              {getCostStructureAbbreviation(opt)}
                            </option>
                          ))}
                        </select>
                        {rowErr ? <div className="text-danger small">{rowErr}</div> : null}
                      </div>
                    );
                  },
                },
                {
                  key: 'category',
                  label: 'Category',
                  width: '110px',
                  render: (_, row, rowIdx) => {
                    const catCls = getCategorySelectClass(row.category);
                    return (
                      <select
                        className={`form-select form-select-sm${catCls ? ` ${catCls}` : ''}`}
                        value={row.category}
                        disabled={!canEdit}
                        onChange={(e) => onLineItemChange(row.id, 'category', e.target.value, rowIdx)}
                      >
                        {(budgetCategoryOptions || []).map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    );
                  },
                },
                {
                  key: 'amount',
                  label: 'Amount',
                  width: '120px',
                  render: (_, row, rowIdx) => {
                    const rowErr = errors.lineItemErrors?.[rowIdx]?.amount;
                    return (
                      <div>
                        <input
                          type="number"
                          min="0"
                          max="999999999999"
                          className={`form-control form-control-sm${rowErr ? ' is-invalid' : ''}`}
                          placeholder="0.00"
                          value={row.amount}
                          disabled={!canEdit}
                          onChange={(e) => onLineItemChange(row.id, 'amount', e.target.value, rowIdx)}
                        />
                        {rowErr ? <div className="text-danger small">{rowErr}</div> : null}
                      </div>
                    );
                  },
                },
                // {
                //   key: 'total',
                //   label: 'Total',
                //   render: (_, row) => (
                //     <strong className="text-brand">{formatCurrency(Number(row.amount) || 0)}</strong>
                //   ),
                // },
                {
                  key: 'justification',
                  label: 'Justification',
                  width: '28%',
                  render: (_, row, rowIdx) => {
                    const rowErr = errors.lineItemErrors?.[rowIdx]?.justification;
                    return (
                      <div>
                        <textarea
                          className={`form-control form-control-sm text-muted fst-italic body-italic-sm budget-request-line-item-textarea${rowErr ? ' is-invalid' : ''}`}
                          placeholder="Enter justification"
                          maxLength={maxLengths.justification}
                          value={row.justification}
                          disabled={!canEdit}
                          ref={setAutoHeight}
                          onChange={(e) => onLineItemChange(row.id, 'justification', e.target.value, rowIdx)}
                        />
                        {rowErr ? <div className="text-danger small">{rowErr}</div> : null}
                      </div>
                    );
                  },
                },
                {
                  key: 'actions',
                  label: '',
                  width: '48px',
                  render: (_, row) => (
                    <div className="text-end">
                      <button
                        type="button"
                        className="btn btn-sm p-0 border-0 text-secondary d-inline-flex align-items-center"
                        aria-label={`Delete ${row.name}`}
                        onClick={() => onDeleteLineItem(row.id)}
                        disabled={!canEdit}
                      >
                        <BsTrashFill />
                      </button>
                    </div>
                  ),
                },
              ]}
              data={lineItems}
              emptyState={
                <span>
                  No budget line items yet. Click <strong>Add New Item</strong> to create one.
                </span>
              }
            />
          </div>

          <div className="d-flex align-items-center px-3 py-2 bg-light border-top fw-bold table-total-row">
            <span className="me-auto">Total Appropriations</span>
            <span className="text-brand">{formatCurrency(totals.grandTotal)}</span>
          </div>

          {/* Cost Structure legend — explains the GAS / SO / O abbreviations
              used in the Cost Structure column above. */}
          <div className="d-flex flex-wrap align-items-baseline gap-3 px-3 py-2 border-top small text-muted">
            
            {COST_STRUCTURE_OPTIONS.map((opt) => (
              <span key={opt}>
                <strong>{getCostStructureAbbreviation(opt)}</strong>
                <span className="ms-1">: {opt}</span>
              </span>
            ))}
          </div>
        </div>

      </div>

      <div className="col-12 col-lg-3 p-4">
        <div className="sidebar-sticky-top">
          {sidebarTopContent}
          <div className="mb-4 d-grid gap-2">
            {actions.map((action) => (
              <Button
                key={action.label}
                variant={action.variant}
                fullWidth
                leftIcon={action.leftIcon}
                onClick={action.onClick}
                disabled={action.disabled}
              >
                {action.label}
              </Button>
            ))}
          </div>

          <BudgetRequestTotalsSummary totals={totals} />

          <div className="card border rounded-3 p-3">
            <p className="fw-bold text-uppercase mb-0 section-eyebrow">
              Review Workflow
            </p>
            <p className="text-muted mb-3 caption-xs">
              Chain of Custody
            </p>

            <ReviewWorkflowTimeline steps={workflowSteps} />
          </div>
        </div>
      </div>
    </div>
  );
}

// Budget Request Form Props Type 
BudgetRequestForm.propTypes = {
  mode: PropTypes.oneOf(['create', 'edit', 'view']).isRequired,
  isEditable: PropTypes.bool,
  formData: PropTypes.shape({
    title: PropTypes.string.isRequired,
    unit: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    fiscalYear: PropTypes.string.isRequired,
    planningPeriod: PropTypes.string.isRequired,
    comment: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    referenceCode: PropTypes.string.isRequired,
    currentVersionNumber: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  }).isRequired,
  maxLengths: PropTypes.object.isRequired,
  errors: PropTypes.object.isRequired,
  fiscalYearOptions: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    })
  ).isRequired,
  planningPeriodOptions: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    })
  ).isRequired,
  requestingUnitOptions: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    })
  ).isRequired,
  budgetCategoryOptions: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    })
  ).isRequired,
  formSchemaOptions: PropTypes.arrayOf(PropTypes.object),
  formEntryOptions: PropTypes.arrayOf(PropTypes.object),
  attachedForms: PropTypes.arrayOf(PropTypes.object),
  selectedFormSchemaId: PropTypes.string,
  selectedFormEntryId: PropTypes.string,
  lineItems: PropTypes.arrayOf(PropTypes.object).isRequired,
  totals: PropTypes.shape({
    psTotal: PropTypes.number.isRequired,
    mooeTotal: PropTypes.number.isRequired,
    coTotal: PropTypes.number.isRequired,
    tagTotal: PropTypes.number.isRequired,
    grandTotal: PropTypes.number.isRequired,
  }).isRequired,
  workflowSteps: PropTypes.arrayOf(PropTypes.object).isRequired,
  actions: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      variant: PropTypes.oneOf(['primary', 'secondary', 'ghost', 'danger', 'outline']),
      leftIcon: PropTypes.node,
      onClick: PropTypes.func.isRequired,
      disabled: PropTypes.bool,
    })
  ).isRequired,
  onFieldChange: PropTypes.func.isRequired,
  onLineItemChange: PropTypes.func.isRequired,
  onAddLineItem: PropTypes.func,
  onDeleteLineItem: PropTypes.func,
  onSelectedFormSchemaChange: PropTypes.func,
  onSelectedFormEntryChange: PropTypes.func,
  onAttachForm: PropTypes.func,
  onDetachForm: PropTypes.func,
  formatCurrency: PropTypes.func.isRequired,
  showLineItemAddButton: PropTypes.bool,
  sidebarTopContent: PropTypes.node,
  showAttachedFormsSection: PropTypes.bool,
  unitFieldDisabled: PropTypes.bool,
};

BudgetRequestForm.defaultProps = {
  isEditable: true,
  onAddLineItem: () => {},
  onDeleteLineItem: () => {},
  showLineItemAddButton: true,
  showAttachedFormsSection: true,
  planningPeriodOptions: [{ value: '1', label: 'Annually' }],
};
