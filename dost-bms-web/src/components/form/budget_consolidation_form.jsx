/**
 * System Name: Budget Management System
 * Module Name: Components Module
 *
 * Purpose of this file:
 * Main budget consolidation form layout showing consolidated line items, totals by category, workflow, and approver panel.
 *
 * Author(s): QUT Group 27
 *
 * Copyright (C) 2026
 * by the Department of Science and Technology - Central Office
 * Developed by Team 27, Queensland University of Technology
 * All rights reserved.
 */

import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { BsChevronDown, BsChevronRight, BsCloudUpload, BsSend, BsXCircle } from 'react-icons/bs';
import { Button, Table, FormField, Input, Dropdown, Badge, Modal } from '../ui';
import { ReviewWorkflowTimeline } from '../shared/approval_workflow_timeline';
import { getApprovalWorkflowStages } from '../../api/budget_consolidation_api';
import { getCategorySelectClass } from '../../utils/category';
import { COST_STRUCTURE_OPTIONS } from '../../utils/cost_structure';
import { splitUnifiedWorkflowStepsByLane } from '../../utils/unified_budget_workflow_lanes';
import BudgetRequestTotalsSummary from '../shared/budget_request_totals_summary';

export default function BudgetConsolidationForm({
  mode,
  formData,
  errors,
  maxLengths,
  fiscalYearOptions,
  planningPeriodOptions,
  lineRows,
  lineItemsError,
  lineItemsFetchError,
  lineItemsLoading,
  totals,
  workflowSteps,
  actions,
  approverPanel,
  onFieldChange,
  onLineItemChange,
  onCommentSend,
  formatCurrency,
  reviewedRequests,
  addedRequestIds,
  budgetCategoryOptions,
  onAddBudgetRequests,
  onOpenAddBudgetRequests,
}) {
  const canEdit = mode === 'create' || mode === 'edit';
  const [collapsedUnits, setCollapsedUnits] = useState({});
  const [collapsedRequests, setCollapsedRequests] = useState({});
  const [showAddRequestModal, setShowAddRequestModal] = useState(false);
  const [selectedRequestIds, setSelectedRequestIds] = useState([]);
  const [workflowStageDefinitions, setWorkflowStageDefinitions] = useState([]);
  const isDraft = String(formData.status || '').trim().toLowerCase() === 'draft';
  const canAddBudgetRequests = canEdit && isDraft;

  // Only show version > 0, and get from currentVersionNumber
  const intCurrentVersion = Number(formData.currentVersionNumber);
  const showCurrentVersion =
    Number.isFinite(intCurrentVersion) &&
    (intCurrentVersion > 0);
  

  useEffect(() => {
    let blnCancelled = false;
    getApprovalWorkflowStages()
      .then((arrStages) => {
        if (!blnCancelled) setWorkflowStageDefinitions(Array.isArray(arrStages) ? arrStages : []);
      })
      .catch(() => {
        if (!blnCancelled) setWorkflowStageDefinitions([]);
      });
    return () => {
      blnCancelled = true;
    };
  }, []);

  const { internalSteps, externalSteps } = useMemo(
    () => splitUnifiedWorkflowStepsByLane(workflowSteps, workflowStageDefinitions),
    [workflowSteps, workflowStageDefinitions]
  );

  useEffect(() => {
    const unitKeys = lineRows
      .filter((row) => row.rowType === 'unit-header')
      .map((row) => String(row.unitKey ?? row.requestingUnit ?? row.id));

    setCollapsedUnits((prev) => {
      const next = {};
      unitKeys.forEach((key) => {
        next[key] = Object.prototype.hasOwnProperty.call(prev, key) ? prev[key] : false;
      });
      return next;
    });
  }, [lineRows]);

  useEffect(() => {
    const requestIds = lineRows
      .filter((row) => row.rowType === 'request-header')
      .map((row) => String(row.requestId));

    setCollapsedRequests((prev) => {
      const next = {};
      requestIds.forEach((key) => {
        next[key] = Object.prototype.hasOwnProperty.call(prev, key) ? prev[key] : false;
      });
      return next;
    });
  }, [lineRows]);

  const visibleLineRows = useMemo(() => {
    const rows = [];
    let activeUnitCollapsed = false;
    let activeRequestCollapsed = false;

    lineRows.forEach((row) => {
      if (row.rowType === 'unit-header') {
        const unitKey = String(row.unitKey ?? row.requestingUnit ?? row.id);
        activeUnitCollapsed = Boolean(collapsedUnits[unitKey]);
        activeRequestCollapsed = false;
        rows.push(row);
        return;
      }

      if (activeUnitCollapsed) {
        return;
      }

      if (row.rowType === 'request-header') {
        activeRequestCollapsed = Boolean(collapsedRequests[row.requestId]);
        rows.push(row);
        return;
      }

      if (activeRequestCollapsed) {
        return;
      }

      rows.push(row);
    });

    return rows;
  }, [lineRows, collapsedUnits, collapsedRequests]);

  const toggleUnitSection = (unitKey) => {
    setCollapsedUnits((prev) => ({
      ...prev,
      [unitKey]: !prev[unitKey],
    }));
  };

  const toggleRequestSection = (requestId) => {
    const key = String(requestId);
    setCollapsedRequests((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const addedRequestIdSet = useMemo(
    () => new Set((addedRequestIds || []).map((value) => String(value))),
    [addedRequestIds]
  );

  const reviewedOptions = useMemo(
    () =>
      (Array.isArray(reviewedRequests) ? reviewedRequests : []).filter((request) => {
        const isReviewed = String(request?.status || '').trim().toUpperCase() === 'REVIEWED';
        const requestKeys = [
          request?.id,
          request?.br_id,
          request?.code,
          request?.br_reference_no,
        ]
          .filter((value) => value !== null && value !== undefined && value !== '')
          .map((value) => String(value));

        return isReviewed && requestKeys.every((key) => !addedRequestIdSet.has(key));
      }),
    [reviewedRequests, addedRequestIdSet]
  );

  const handleOpenAddRequestModal = async () => {
    if (typeof onOpenAddBudgetRequests === 'function') {
      await onOpenAddBudgetRequests();
    }
    setSelectedRequestIds([]);
    setShowAddRequestModal(true);
  };

  const handleToggleRequestSelection = (requestId) => {
    const key = String(requestId);
    setSelectedRequestIds((prev) =>
      prev.includes(key) ? prev.filter((id) => id !== key) : [...prev, key]
    );
  };

  const handleConfirmAddRequests = () => {
    if (selectedRequestIds.length === 0) {
      setShowAddRequestModal(false);
      return;
    }
    onAddBudgetRequests(selectedRequestIds);
    setShowAddRequestModal(false);
    setSelectedRequestIds([]);
  };

  return (
    <div className="row g-0">
      <div className="col-12 col-lg-9 p-4">
        <div className="card border rounded-3 p-4 mb-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <span className="fw-bold text-uppercase section-eyebrow">General Information</span>
            <div className="d-flex align-items-center">
              <Badge status={formData.status} />
              <span className="text-muted small ms-2">Ref: {formData.referenceCode}</span>
              {showCurrentVersion ? (
                <span className="text-muted small ms-2">Version: {intCurrentVersion}</span>
              ) : null}
            </div>
          </div>

          <FormField label="Title">
            <Input
              value={formData.title}
              maxLength={maxLengths.title}
              onChange={(e) => onFieldChange('title', e.target.value)}
              disabled={!canEdit}
            />
            {errors.title ? <div className="text-danger small mt-1">{errors.title}</div> : null}
          </FormField>

          {/* <FormField label="Requesting Unit">
            <Input
              value={'DOST'}
              maxLength={maxLengths.unit}
              onChange={(e) => onFieldChange('unit', e.target.value)}
              // disabled={!canEdit}
            />
            {errors.unit ? <div className="text-danger small mt-1">{errors.unit}</div> : null}
          </FormField> */}

          <FormField label="Description">
            <Input
              type="textarea"
              rows={4}
              value={formData.description}
              maxLength={maxLengths.description}
              onChange={(e) => onFieldChange('description', e.target.value)}
              disabled={!canEdit}
            />
            {errors.description ? <div className="text-danger small mt-1">{errors.description}</div> : null}
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
        </div>

        <div className="card border rounded-3 p-4 mb-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <span className="fw-bold text-uppercase section-eyebrow">Budget Line Items</span>
            {canAddBudgetRequests ? (
              <Button variant="outline" size="sm" onClick={handleOpenAddRequestModal}>
                Add Budget Request
              </Button>
            ) : null}
          </div>
          {lineItemsFetchError ? <div className="text-danger small mb-2">{lineItemsFetchError}</div> : null}
          {lineItemsError ? <div className="text-danger small mb-2">{lineItemsError}</div> : null}

          <div className="budget-line-items-scroll">
            <Table
              loading={lineItemsLoading}
              columns={[
                {
                  key: 'requestingUnit',
                  label: 'Requesting unit / Budget request / Cost structure / Category / Item',
                  render: (_, row) => {
                    if (row.rowType === 'unit-header') {
                      const unitKey = String(row.unitKey ?? row.requestingUnit ?? row.id);
                      const isCollapsed = Boolean(collapsedUnits[unitKey]);
                      return (
                        <div className="px-2 py-1 rounded-2 bg-surface-muted d-flex align-items-start justify-content-between gap-2">
                          <div>
                            <strong>{row.requestingUnit}</strong>
                            {!row.hasItems ? (
                              <div className="text-muted small mt-1 fw-normal">
                                No line items under this requesting unit.
                              </div>
                            ) : null}
                          </div>
                          <button
                            type="button"
                            className="unit-section-toggle"
                            onClick={() => toggleUnitSection(unitKey)}
                            aria-label={isCollapsed ? 'Expand requesting unit section' : 'Collapse requesting unit section'}
                          >
                            {isCollapsed ? <BsChevronRight /> : <BsChevronDown />}
                          </button>
                        </div>
                      );
                    }
                    if (row.rowType === 'request-header') {
                      const requestKey = String(row.requestId);
                      const isCollapsed = Boolean(collapsedRequests[requestKey]);
                      const sourceRequestId = row.sourceRequestId ?? row.originalRequestId ?? row.requestSourceId;
                      return (
                        <div className="ms-2 px-2 py-1 rounded-2 bg-light border d-flex align-items-start justify-content-between gap-2">
                          <div>
                            {sourceRequestId ? (
                              <Link
                                className="fw-semibold d-block text-brand text-decoration-none"
                                to={`/budget-requests/${sourceRequestId}`}
                              >
                                {row.requestTitle}
                              </Link>
                            ) : (
                              <strong className="d-block">{row.requestTitle}</strong>
                            )}
                            <span className="text-muted small">{row.requestId}</span>
                            {!row.hasItems ? (
                              <div className="text-muted small mt-1 fw-normal">
                                No line items in this budget request.
                              </div>
                            ) : null}
                          </div>
                          <button
                            type="button"
                            className="unit-section-toggle"
                            onClick={() => toggleRequestSection(requestKey)}
                            aria-label={isCollapsed ? 'Expand budget request section' : 'Collapse budget request section'}
                          >
                            {isCollapsed ? <BsChevronRight /> : <BsChevronDown />}
                          </button>
                        </div>
                      );
                    }
                    if (row.rowType === 'category') {
                      const categoryChipClass = getCategorySelectClass(row.category);
                      return (
                        <span className={`${categoryChipClass} consolidation-indent-category`}>
                          {row.category}
                        </span>
                      );
                    }
                    if (row.rowType === 'cost-structure') {
                      return (
                        <div className="consolidation-indent-cost-structure fw-semibold text-secondary">
                          {row.costStructure}
                        </div>
                      );
                    }
                    if (!canEdit) return <div className="consolidation-indent-item">{row.name}</div>;
                    const rowErr = errors.lineItemErrorsById?.[row.id] || {};
                    return (
                      <div className="consolidation-indent-item d-flex flex-column gap-2">
                        <div>
                          <Input
                            value={row.name}
                            placeholder="Item name"
                            maxLength={maxLengths.lineItemName}
                            error={rowErr.name}
                            onChange={(e) => onLineItemChange(row.id, 'name', e.target.value)}
                          />
                          {rowErr.name ? <div className="text-danger small mt-1">{rowErr.name}</div> : null}
                        </div>
                        <div>
                          <select
                            className={`form-select form-select-sm${rowErr.category ? ' is-invalid' : ''}`}
                            value={row.category}
                            onChange={(e) => onLineItemChange(row.id, 'category', e.target.value)}
                          >
                            {(budgetCategoryOptions || []).map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                          {rowErr.category ? <div className="text-danger small mt-1">{rowErr.category}</div> : null}
                        </div>
                        <div>
                          <select
                            className={`form-select form-select-sm${rowErr.costStructure ? ' is-invalid' : ''}`}
                            value={row.costStructure || ''}
                            onChange={(e) => onLineItemChange(row.id, 'costStructure', e.target.value)}
                          >
                            {COST_STRUCTURE_OPTIONS.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                          {rowErr.costStructure ? <div className="text-danger small mt-1">{rowErr.costStructure}</div> : null}
                        </div>
                      </div>
                    );
                  },
                },
              {
                key: 'plannedAmount',
                label: 'Amount',
                render: (_, row) => {
                  if (row.rowType === 'unit-header') return <strong>{formatCurrency(row.subtotal || 0)}</strong>;
                  if (row.rowType === 'request-header') return <strong>{formatCurrency(row.subtotal || 0)}</strong>;
                  if (row.rowType === 'category') return null;
                  if (row.rowType === 'cost-structure') return null;
                  if (!canEdit) return <strong className="text-brand">{formatCurrency(row.amount || 0)}</strong>;
                  const rowErr = errors.lineItemErrorsById?.[row.id]?.amount;
                  return (
                    <div>
                      <input
                        type="number"
                        min="0"
                        max="999999999999"
                        className={`form-control form-control-sm${rowErr ? ' is-invalid' : ''}`}
                        value={row.amount}
                        onChange={(e) => onLineItemChange(row.id, 'amount', e.target.value)}
                      />
                      {rowErr ? <div className="text-danger small mt-1">{rowErr}</div> : null}
                    </div>
                  );
                },
              },
              {
                key: 'justification',
                label: 'Justification',
                render: (_, row) => (
                  row.rowType === 'item'
                    ? (
                      canEdit
                        ? (
                          <div>
                            <Input
                              type="textarea"
                              rows={2}
                              value={row.justification || ''}
                              placeholder="Enter justification"
                              maxLength={maxLengths.justification}
                              error={errors.lineItemErrorsById?.[row.id]?.justification}
                              onChange={(e) => onLineItemChange(row.id, 'justification', e.target.value)}
                            />
                            {errors.lineItemErrorsById?.[row.id]?.justification ? (
                              <div className="text-danger small mt-1">
                                {errors.lineItemErrorsById[row.id].justification}
                              </div>
                            ) : null}
                          </div>
                        )
                        : <span className="text-muted fst-italic body-italic-sm">{row.justification || '—'}</span>
                    )
                    : null
                ),
              },
              ]}
            data={visibleLineRows}
            emptyState="No reviewed line items available."
          />
          </div>

          <div className="d-flex align-items-center px-3 py-2 bg-light border-top fw-bold table-total-row">
            <span className="me-auto">Total Appropriations</span>
            <span className="text-brand">{formatCurrency(totals.grandTotal)}</span>
          </div>
        </div>

        <div className="row g-3">
          {/* <div className="col-12 col-md-6">
            <p className="fw-bold text-uppercase mb-1 section-eyebrow">
              Supplemental Documentation
            </p>
            <div
              className={`upload-dropzone${canEdit ? '' : ' opacity-50 pe-none user-select-none'}`}
            >
              <BsCloudUpload className="upload-icon" />
              <p className="fw-semibold mt-2 mb-1">Attach File/Document</p>
              <p className="text-muted small mb-0">Drag and drop files here, or click to browse</p>
            </div>
          </div> */}

          {/* <div className="col-12 col-md-6">
            <p className="fw-bold text-uppercase mb-2 section-eyebrow">
              Comment
            </p>
            <textarea
              className={`form-control mb-1 comment-textarea-fixed${errors.comment ? ' is-invalid' : ''}`}
              placeholder="Enter any additional details or notes..."
              value={formData.comment}
              maxLength={maxLengths.comment}
              disabled={!canEdit}
              onChange={(e) => onFieldChange('comment', e.target.value)}
            />
            {errors.comment ? <div className="text-danger small mb-1">{errors.comment}</div> : null}
            <div className="d-flex justify-content-between align-items-center">
              <span className="text-muted small">{formData.comment.length}/{maxLengths.comment}</span>
              <Button size="sm" leftIcon={<BsSend />} onClick={onCommentSend} disabled={!canEdit}>
                Send Comment
              </Button>
            </div>
          </div> */}
        </div>
      </div>

      <div className="col-12 col-lg-3 p-4">
        <div className="sidebar-sticky-top">
          {approverPanel && <div className="mb-4">{approverPanel}</div>}
          <div className="mb-4 d-grid gap-2">
            {actions.map((action) => (
              <Button
                key={action.label}
                fullWidth
                variant={action.variant}
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
            <p className="fw-bold text-uppercase mb-0 section-eyebrow">Approval Workflow</p>
            {internalSteps.length === 0 && externalSteps.length === 0 ? (
              <p className="text-muted small mb-0">No workflow steps yet.</p>
            ) : (
              <>
                <p className="fw-semibold small text-uppercase text-muted mt-3">Internal stages</p>
                {internalSteps.length > 0 ? (
                  <ReviewWorkflowTimeline steps={internalSteps} />
                ) : (
                  <p className="text-muted small mb-0">None</p>
                )}
                <p className="fw-semibold small text-uppercase text-muted mt-3">External stages</p>
                {externalSteps.length > 0 ? (
                  <ReviewWorkflowTimeline steps={externalSteps} />
                ) : (
                  <p className="text-muted small mb-0">None</p>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <Modal
        open={showAddRequestModal}
        onClose={() => setShowAddRequestModal(false)}
        // title="Add Budget Request"
        size="lg"
      >
        <div className="bg-white border rounded-3 p-3 shadow-sm add-budget-request-modal-body">
          <p className="text-muted small mb-3">Select one or more reviewed budget requests to append.</p>
          <div className="review-list-scroll border rounded-3 p-2">
            {reviewedOptions.length === 0 ? (
              <p className="text-muted mb-0 p-2">No reviewed requests available to add.</p>
            ) : (
              reviewedOptions.map((request) => {
                const requestKey = String(request.id ?? request.br_id);
                const isChecked = selectedRequestIds.includes(requestKey);
                return (
                  <label key={requestKey} className="d-flex align-items-start gap-2 p-2 border-bottom request-select-row">
                    <input
                      type="checkbox"
                      className="form-check-input mt-1"
                      checked={isChecked}
                      onChange={() => handleToggleRequestSelection(requestKey)}
                    />
                    <span>
                      <span className="fw-semibold d-block">{request.title}</span>
                      <span className="text-muted small d-block">
                        {request.code} • {request.unit}
                      </span>
                    </span>
                  </label>
                );
              })
            )}
          </div>
          <div className="d-flex justify-content-end gap-2 mt-3">
            <Button variant="outline" size="sm" onClick={() => setShowAddRequestModal(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleConfirmAddRequests} disabled={selectedRequestIds.length === 0}>
              Add Selected
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

BudgetConsolidationForm.propTypes = {
  mode: PropTypes.oneOf(['create', 'edit', 'view']).isRequired,
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
  errors: PropTypes.object.isRequired,
  maxLengths: PropTypes.object.isRequired,
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
  lineRows: PropTypes.arrayOf(PropTypes.object).isRequired,
  lineItemsError: PropTypes.string,
  lineItemsFetchError: PropTypes.string,
  lineItemsLoading: PropTypes.bool,
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
  onLineItemChange: PropTypes.func,
  onCommentSend: PropTypes.func.isRequired,
  formatCurrency: PropTypes.func.isRequired,
  reviewedRequests: PropTypes.arrayOf(PropTypes.object),
  addedRequestIds: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])),
  budgetCategoryOptions: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    })
  ),
  approverPanel: PropTypes.node,
  onAddBudgetRequests: PropTypes.func,
  onOpenAddBudgetRequests: PropTypes.func,
};

BudgetConsolidationForm.defaultProps = {
  lineItemsError: '',
  lineItemsFetchError: '',
  lineItemsLoading: false,
  onLineItemChange: () => {},
  reviewedRequests: [],
  addedRequestIds: [],
  budgetCategoryOptions: [],
  approverPanel: null,
  onAddBudgetRequests: () => {},
  onOpenAddBudgetRequests: async () => {},
  planningPeriodOptions: [{ value: '1', label: 'Annually' }],
};
