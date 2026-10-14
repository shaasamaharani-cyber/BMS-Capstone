/**
 * System Name: Budget Management System
 * Module Name: Settings Module
 *
 * Purpose of this file:
 * Administrator settings: alert thresholds used by the dashboards, which approval stages new
 * consolidated budgets use, and the reference lists (requesting units, fiscal years). Expense
 * categories are shown read-only because the BP forms depend on them. Every change is logged.
 *
 * Author(s): QUT Group T214
 *
 * Copyright (C) 2026
 * by the Department of Science and Technology - Central Office
 * All rights reserved.
 */

import { useCallback, useEffect, useState } from 'react';
import PageHeader from '../../components/layout/page_header';
import { Badge, Button, FormField, Input, Modal, useToast } from '../../components/ui';
import {
  createFiscalYear,
  createRequestingUnit,
  getAllApprovalStages,
  getAllFiscalYears,
  getAllRequestingUnits,
  getAppSettings,
  getBudgetCategoryList,
  getSettingsChanges,
  updateAppSettings,
  updateApprovalStage,
  updateFiscalYear,
  updateRequestingUnit,
} from '../../api/settings_api';
import { applyAppSettings } from '../../utils/app_settings';
import { formatTimestamp } from '../../utils/formatters';

// The core of the as-is flow stays on (the server refuses to turn these off as well)
const LOCKED_STAGES = ['draft', 'finance_planning_director'];
const STAGE_TYPE_LABEL = { system: 'Division', internal_approval: 'Internal approval', external_approval: 'External' };

const listOf = (value) => (Array.isArray(value) ? value : []);

function Card({ title, hint, children }) {
  return (
    <div className="card border rounded-3 p-4 mb-4">
      <p className="fw-bold text-uppercase mb-1 section-eyebrow">{title}</p>
      {hint ? <p className="text-muted small mb-3">{hint}</p> : null}
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const { showToast } = useToast();
  const [objThresholds, setObjThresholds] = useState({ attention_below: '', amber_below: '', due_soon_days: '' });
  const [arrStages, setArrStages] = useState([]);
  const [arrUnits, setArrUnits] = useState([]);
  const [arrYears, setArrYears] = useState([]);
  const [arrCategories, setArrCategories] = useState([]);
  const [arrChanges, setArrChanges] = useState([]);
  const [strNewUnit, setStrNewUnit] = useState('');
  const [strNewYear, setStrNewYear] = useState('');
  const [objRenaming, setObjRenaming] = useState(null);
  const [strRename, setStrRename] = useState('');

  const loadAll = useCallback(async () => {
    const [objSettings, arrStageRows, arrUnitRows, arrYearRows, arrCategoryRows, arrChangeRows] = await Promise.all([
      getAppSettings(), getAllApprovalStages(), getAllRequestingUnits(), getAllFiscalYears(), getBudgetCategoryList(), getSettingsChanges(),
    ]);
    setObjThresholds({
      attention_below: String(objSettings?.attention_below ?? ''),
      amber_below: String(objSettings?.amber_below ?? ''),
      due_soon_days: String(objSettings?.due_soon_days ?? ''),
    });
    setArrStages(listOf(arrStageRows).sort((objA, objB) => Number(objA.aws_sequence_order) - Number(objB.aws_sequence_order)));
    setArrUnits(listOf(arrUnitRows).sort((objA, objB) => String(objA.ru_name).localeCompare(String(objB.ru_name))));
    setArrYears(listOf(arrYearRows).sort((objA, objB) => Number(objA.fy_year) - Number(objB.fy_year)));
    setArrCategories(listOf(arrCategoryRows));
    setArrChanges(listOf(arrChangeRows));
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Runs one change, shows the server's message if it is refused, then reloads the lists
  const run = async (fnChange, strDone) => {
    try {
      const result = await fnChange();
      showToast({ message: strDone });
      await loadAll();
      return result;
    } catch (objError) {
      showToast({ message: objError?.message || 'Cannot save this change.', variant: 'warning' });
      return null;
    }
  };

  const handleSaveThresholds = async () => {
    const objSaved = await run(() => updateAppSettings({
      attention_below: Number(objThresholds.attention_below),
      amber_below: Number(objThresholds.amber_below),
      due_soon_days: Number(objThresholds.due_soon_days),
    }), 'Alert thresholds saved.');
    // The dashboards read the new values straight away
    if (objSaved) applyAppSettings(objSaved);
  };

  const setThreshold = (strKey) => (objEvent) => setObjThresholds((objPrev) => ({ ...objPrev, [strKey]: objEvent.target.value }));

  return (
    <div>
      <PageHeader title="Settings" />

      <Card title="Alert thresholds" hint="Used by every dashboard. These are the team's values until DOST confirms its own targets.">
        <div className="row g-3">
          <div className="col-md-4">
            <FormField label="Flag a committed rate below (%)" hint="Green at or above this">
              <Input type="number" value={objThresholds.attention_below} onChange={setThreshold('attention_below')} />
            </FormField>
          </div>
          <div className="col-md-4">
            <FormField label="Show red below (%)" hint="Amber between this and the level above">
              <Input type="number" value={objThresholds.amber_below} onChange={setThreshold('amber_below')} />
            </FormField>
          </div>
          <div className="col-md-4">
            <FormField label="Spending report due soon within (days)">
              <Input type="number" value={objThresholds.due_soon_days} onChange={setThreshold('due_soon_days')} />
            </FormField>
          </div>
        </div>
        <p className="text-muted small">A justification is required when obligations exceed the allotment by any amount (fixed until DOST decides).</p>
        <Button onClick={handleSaveThresholds}>Save thresholds</Button>
      </Card>

      <Card title="Approval stages" hint="Which steps a new consolidated budget goes through. Budgets already sent keep their own steps.">
        <table className="table table-sm mb-0">
          <thead><tr><th>#</th><th>Stage</th><th>Type</th><th>Status</th><th /></tr></thead>
          <tbody>
            {arrStages.map((objStage) => {
              const blnLocked = LOCKED_STAGES.includes(String(objStage.aws_id));
              const blnActive = Number(objStage.aws_is_active) === 1;
              return (
                <tr key={objStage.id}>
                  <td>{objStage.aws_sequence_order}</td>
                  <td>{objStage.aws_name}</td>
                  <td>{STAGE_TYPE_LABEL[objStage.aws_type] || objStage.aws_type}</td>
                  <td>{blnActive ? <Badge status="approved" label="On" /> : <Badge status="cancelled" label="Off" />}</td>
                  <td className="text-end">
                    {blnLocked
                      ? <span className="text-muted small">Always on</span>
                      : (
                        <Button size="sm" variant="ghost" onClick={() => run(() => updateApprovalStage(objStage.id, !blnActive), `${objStage.aws_name} turned ${blnActive ? 'off' : 'on'}.`)}>
                          {blnActive ? 'Turn off' : 'Turn on'}
                        </Button>
                      )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      <div className="row g-4">
        <div className="col-lg-7">
          <Card title="Requesting units" hint="Units a requester can belong to. A deactivated unit cannot be chosen for new accounts or requests.">
            <div className="d-flex gap-2 mb-3">
              <Input placeholder="New unit name" value={strNewUnit} onChange={(objEvent) => setStrNewUnit(objEvent.target.value)} />
              <Button onClick={async () => { if (await run(() => createRequestingUnit(strNewUnit), 'Unit added.')) setStrNewUnit(''); }}>Add</Button>
            </div>
            <div style={{ maxHeight: 360, overflowY: 'auto' }}>
              <table className="table table-sm mb-0">
                <thead><tr><th>Unit</th><th>Status</th><th /></tr></thead>
                <tbody>
                  {arrUnits.map((objUnit) => {
                    const blnActive = Number(objUnit.ru_is_active) !== 0;
                    return (
                      <tr key={objUnit.ru_id}>
                        <td>{objUnit.ru_name}</td>
                        <td>{blnActive ? <Badge status="approved" label="Active" /> : <Badge status="cancelled" label="Inactive" />}</td>
                        <td className="text-end text-nowrap">
                          <Button size="sm" variant="ghost" onClick={() => { setObjRenaming(objUnit); setStrRename(objUnit.ru_name); }}>Rename</Button>
                          <Button size="sm" variant="ghost" onClick={() => run(() => updateRequestingUnit(objUnit.ru_id, { ru_is_active: blnActive ? 0 : 1 }), `${objUnit.ru_name} ${blnActive ? 'deactivated' : 'activated'}.`)}>
                            {blnActive ? 'Deactivate' : 'Activate'}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <div className="col-lg-5">
          <Card title="Fiscal years" hint="Open years can be chosen for new requests and consolidated budgets. Past years are not listed.">
            <div className="d-flex gap-2 mb-3">
              <Input type="number" placeholder="e.g. 2031" value={strNewYear} onChange={(objEvent) => setStrNewYear(objEvent.target.value)} />
              <Button onClick={async () => { if (await run(() => createFiscalYear(Number(strNewYear)), 'Fiscal year added.')) setStrNewYear(''); }}>Add</Button>
            </div>
            <table className="table table-sm mb-0">
              <thead><tr><th>Year</th><th>Status</th><th /></tr></thead>
              <tbody>
                {arrYears.map((objYear) => {
                  const blnOpen = Number(objYear.fy_is_active) === 1;
                  return (
                    <tr key={objYear.fy_id}>
                      <td>FY{objYear.fy_year}</td>
                      <td>{blnOpen ? <Badge status="approved" label="Open" /> : <Badge status="cancelled" label="Closed" />}</td>
                      <td className="text-end">
                        <Button size="sm" variant="ghost" onClick={() => run(() => updateFiscalYear(objYear.fy_id, !blnOpen), `FY${objYear.fy_year} ${blnOpen ? 'closed' : 'opened'}.`)}>
                          {blnOpen ? 'Close' : 'Open'}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>

          <Card title="Expense categories" hint="View only: the BP forms are built on these.">
            <ul className="mb-0 small">
              {arrCategories.map((objCategory) => <li key={objCategory.bcat_id}><strong>{objCategory.bcat_code}</strong> - {objCategory.bcat_name}</li>)}
            </ul>
          </Card>
        </div>
      </div>

      <Card title="Recent changes">
        {arrChanges.length === 0 ? (
          <p className="text-muted small mb-0">No setting changes yet.</p>
        ) : (
          <table className="table table-sm mb-0">
            <thead><tr><th>When</th><th>Area</th><th>Change</th><th>By</th></tr></thead>
            <tbody>
              {arrChanges.map((objChange) => (
                <tr key={objChange.id}>
                  <td>{formatTimestamp(objChange.acl_created_at)}</td>
                  <td>{objChange.acl_area}</td>
                  <td>{objChange.acl_details}</td>
                  <td>{objChange.acl_actor_name || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Modal
        open={Boolean(objRenaming)}
        onClose={() => setObjRenaming(null)}
        title="Rename unit"
        footer={(
          <div className="d-flex justify-content-end gap-2 w-100">
            <Button variant="secondary" onClick={() => setObjRenaming(null)}>Cancel</Button>
            <Button onClick={async () => { if (await run(() => updateRequestingUnit(objRenaming.ru_id, { ru_name: strRename }), 'Unit renamed.')) setObjRenaming(null); }}>Save</Button>
          </div>
        )}
      >
        <FormField label="Unit name">
          <Input value={strRename} onChange={(objEvent) => setStrRename(objEvent.target.value)} />
        </FormField>
      </Modal>
    </div>
  );
}
