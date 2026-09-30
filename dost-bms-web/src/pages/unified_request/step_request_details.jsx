/**
 * System Name: Budget Management System
 * Module Name: Core Module
 *
 * Purpose of this file:
 * Step 1 of the unified budget request - general information, the shared "enter once" fields that every BP form can
 * reuse, and the budget line items. Whatever is typed here is the single source of truth the forms are generated from.
 *
 * Author(s): QUT Group T214
 *
 * Copyright (C) 2026
 * by the Department of Science and Technology - Central Office
 * All rights reserved.
 */

import PropTypes from 'prop-types';
import { BsPlusCircle, BsTrash } from 'react-icons/bs';
import { Button, Dropdown, FormField, Input } from '../../components/ui';
import { FUNDING_SOURCE_OPTIONS } from '../../bp_forms/bp_form_rules';
import { countFormsUsingCanonical } from '../../bp_forms/bp_form_fields';
import { COST_STRUCTURE_OPTIONS } from '../../utils/cost_structure';
import { formatBudgetRequestCurrency } from '../../utils/budget_request_utils';
import { createEmptyLineItem } from './use_unified_request_draft';
import styles from './unified_request.module.css';

const CATEGORY_OPTIONS = [
  { value: 'PS', label: 'PS - Personnel Services' },
  { value: 'MOOE', label: 'MOOE' },
  { value: 'CO', label: 'CO - Capital Outlay' },
  { value: 'TAG', label: 'TAG - Project Tagging' },
];

const COST_STRUCTURE_DROPDOWN = COST_STRUCTURE_OPTIONS.map((strOption) => ({ value: strOption, label: strOption }));

function UsedInNote({ strCanonical }) {
  const intCount = countFormsUsingCanonical(strCanonical);
  if (intCount === 0) return null;
  return <span className={styles.usedIn}>reused on {intCount} generated form{intCount === 1 ? '' : 's'}</span>;
}

UsedInNote.propTypes = { strCanonical: PropTypes.string.isRequired };

export default function StepRequestDetails({ objRequest, arrLineItems, objOptions, blnUnitLocked, onRequestChange, onLineItemsChange }) {
  const handleItemChange = (intId, strField, value) => {
    onLineItemsChange(arrLineItems.map((objItem) => (objItem.id === intId ? { ...objItem, [strField]: value } : objItem)));
  };

  const handleAddItem = () => onLineItemsChange([...arrLineItems, createEmptyLineItem()]);
  const handleDeleteItem = (intId) => onLineItemsChange(arrLineItems.filter((objItem) => objItem.id !== intId));

  return (
    <>
      <section className={styles.card}>
        <h3 className={styles.cardTitle}>General information</h3>
        <div className={styles.fieldGrid}>
          <FormField label="Title" required className={styles.spanTwo}>
            <Input value={objRequest.title} onChange={(objEvent) => onRequestChange({ title: objEvent.target.value })} placeholder="e.g. FY2027 Central Office Operations Budget" maxLength={255} />
          </FormField>
          <FormField label="Requesting unit" required>
            <Dropdown options={objOptions.units} value={objRequest.unitId} onChange={(value) => onRequestChange({ unitId: value })} placeholder="Select unit" disabled={blnUnitLocked} searchable />
          </FormField>
          <FormField label="Fiscal year" required>
            <Dropdown options={objOptions.fiscalYears} value={objRequest.fiscalYearId} onChange={(value) => onRequestChange({ fiscalYearId: value })} placeholder="Select fiscal year" />
          </FormField>
          <FormField label="Planning period">
            <Dropdown options={objOptions.planningPeriods} value={objRequest.planningPeriodId} onChange={(value) => onRequestChange({ planningPeriodId: value })} placeholder="Select period" />
          </FormField>
          <FormField label="Description" className={styles.spanTwo}>
            <Input type="textarea" rows={3} value={objRequest.description} onChange={(objEvent) => onRequestChange({ description: objEvent.target.value })} placeholder="What is this budget for?" maxLength={2000} />
          </FormField>
        </div>
      </section>

      <section className={styles.card}>
        <h3 className={styles.cardTitle}>Common information - enter once</h3>
        <p className={styles.cardHint}>
          These answers are reused automatically on every BP form that asks for them, so you never type them twice.
          Department, agency and fiscal year are taken from the fields above.
        </p>
        <div className={styles.fieldGrid}>
          <FormField label="Program / Activity / Project name" hint="Defaults to the title if left empty.">
            <Input value={objRequest.programPap} onChange={(objEvent) => onRequestChange({ programPap: objEvent.target.value })} placeholder={objRequest.title || 'Program name'} />
            <UsedInNote strCanonical="programPap" />
          </FormField>
          <FormField label="Funding source" required hint="Foreign funding makes BP Form 203 required.">
            <Dropdown options={FUNDING_SOURCE_OPTIONS} value={objRequest.fundingSource} onChange={(value) => onRequestChange({ fundingSource: value })} placeholder="Select funding source" />
            <UsedInNote strCanonical="fundingSource" />
          </FormField>
          <FormField label="Implementation location">
            <Input value={objRequest.location} onChange={(objEvent) => onRequestChange({ location: objEvent.target.value })} placeholder="e.g. Taguig City, Metro Manila" />
            <UsedInNote strCanonical="location" />
          </FormField>
          <div className={styles.fieldPair}>
            <FormField label="Implementation start">
              <input type="date" className="form-control" value={objRequest.implementationStart} onChange={(objEvent) => onRequestChange({ implementationStart: objEvent.target.value })} />
            </FormField>
            <FormField label="Implementation end">
              <input type="date" className="form-control" value={objRequest.implementationEnd} onChange={(objEvent) => onRequestChange({ implementationEnd: objEvent.target.value })} />
            </FormField>
          </div>
          <FormField label="Objectives" className={styles.spanTwo}>
            <Input type="textarea" rows={2} value={objRequest.objectives} onChange={(objEvent) => onRequestChange({ objectives: objEvent.target.value })} placeholder="What should this spending achieve?" />
            <UsedInNote strCanonical="objectives" />
          </FormField>
        </div>
      </section>

      <section className={styles.card}>
        <div className={styles.cardTitleRow}>
          <h3 className={styles.cardTitle}>Budget line items</h3>
          <Button variant="outline" size="sm" leftIcon={<BsPlusCircle />} onClick={handleAddItem}>Add item</Button>
        </div>
        <p className={styles.cardHint}>
          Amounts cannot be negative in a budget request. BP Forms A, 201-A, 201-B and 201-D are generated from these lines.
        </p>
        <div className={styles.tableWrap}>
          <table className={`${styles.itemTable} ${styles.lineItemTable}`}>
            <thead>
              <tr>
                <th>Item</th>
                <th>Cost structure</th>
                <th>Category</th>
                <th className={styles.numericCell}>Amount (PHP)</th>
                <th>Justification</th>
                <th aria-label="Remove" />
              </tr>
            </thead>
            <tbody>
              {arrLineItems.map((objItem) => {
                const blnNegative = Number(objItem.amount) < 0;
                return (
                  <tr key={objItem.id}>
                    <td><Input value={objItem.name} onChange={(objEvent) => handleItemChange(objItem.id, 'name', objEvent.target.value)} placeholder="Item name" /></td>
                    <td><Dropdown options={COST_STRUCTURE_DROPDOWN} value={objItem.costStructure} onChange={(value) => handleItemChange(objItem.id, 'costStructure', value)} /></td>
                    <td><Dropdown options={CATEGORY_OPTIONS} value={objItem.category} onChange={(value) => handleItemChange(objItem.id, 'category', value)} /></td>
                    <td className={styles.numericCell}>
                      <Input type="number" value={objItem.amount} onChange={(objEvent) => handleItemChange(objItem.id, 'amount', objEvent.target.value)} placeholder="0.00" error={blnNegative ? 'Cannot be negative' : undefined} />
                      {blnNegative && <span className={styles.errorText}>Cannot be negative</span>}
                    </td>
                    <td><Input value={objItem.justification} onChange={(objEvent) => handleItemChange(objItem.id, 'justification', objEvent.target.value)} placeholder="Why is this needed?" /></td>
                    <td>
                      <button type="button" className={styles.iconButton} onClick={() => handleDeleteItem(objItem.id)} aria-label="Remove line item" disabled={arrLineItems.length === 1}><BsTrash /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3}>Total requested</td>
                <td className={styles.numericCell}>{formatBudgetRequestCurrency(arrLineItems.reduce((numSum, objItem) => numSum + (Number(objItem.amount) || 0), 0))}</td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        </div>
      </section>
    </>
  );
}

StepRequestDetails.propTypes = {
  objRequest: PropTypes.object.isRequired,
  arrLineItems: PropTypes.array.isRequired,
  objOptions: PropTypes.shape({
    units: PropTypes.array.isRequired,
    fiscalYears: PropTypes.array.isRequired,
    planningPeriods: PropTypes.array.isRequired,
  }).isRequired,
  blnUnitLocked: PropTypes.bool,
  onRequestChange: PropTypes.func.isRequired,
  onLineItemsChange: PropTypes.func.isRequired,
};
