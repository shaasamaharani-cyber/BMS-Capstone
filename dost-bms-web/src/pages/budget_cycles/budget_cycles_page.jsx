/**
 * System Name: Budget Management System
 * Module Name: Budget Cycles Module
 *
 * Purpose of this file:
 * Administrator page to set, for each open fiscal year, which BP forms DBM requires and which
 * supporting documents units must attach (DOST written answers 2, 5 and 7; User Requirement 10).
 * The request wizard reads this; requests already submitted keep their own forms.
 *
 * Author(s): QUT Group T214
 *
 * Copyright (C) 2026
 * by the Department of Science and Technology - Central Office
 * All rights reserved.
 */

import { useCallback, useEffect, useState } from 'react';
import PageHeader from '../../components/layout/page_header';
import { Badge, Button, Input, useToast } from '../../components/ui';
import { getBudgetCycles, updateBudgetCycle } from '../../api/settings_api';
import { BP_FORM_CATALOG, FORM_LEVEL } from '../../bp_forms/bp_form_catalog';
import { formatTimestamp } from '../../utils/formatters';

const FORM_GROUPS = [
  { level: FORM_LEVEL.REQUEST, title: 'Request-level forms', hint: 'Generated in the request wizard for each unit.' },
  { level: FORM_LEVEL.AGENCY, title: 'Agency-level forms', hint: 'Completed once for DOST by other offices at consolidation.' },
];

export default function BudgetCyclesPage() {
  const { showToast } = useToast();
  const [arrCycles, setArrCycles] = useState([]);
  const [strYear, setStrYear] = useState('');
  const [arrFormIds, setArrFormIds] = useState([]);
  const [arrDocs, setArrDocs] = useState([]);
  const [blnSaving, setBlnSaving] = useState(false);

  const showCycle = useCallback((objCycle) => {
    setStrYear(objCycle?.fy_year || '');
    setArrFormIds(objCycle?.enabled_form_ids || []);
    setArrDocs((objCycle?.supporting_documents || []).map((objDoc, intIndex) => ({ ...objDoc, key: `${intIndex}-${objDoc.name}` })));
  }, []);

  const loadCycles = useCallback(async (strKeepYear) => {
    const arrRows = await getBudgetCycles();
    const arrList = Array.isArray(arrRows) ? arrRows : [];
    setArrCycles(arrList);
    showCycle(arrList.find((objCycle) => objCycle.fy_year === strKeepYear) || arrList[0]);
  }, [showCycle]);

  useEffect(() => {
    loadCycles();
  }, [loadCycles]);

  const objCurrent = arrCycles.find((objCycle) => objCycle.fy_year === strYear);

  const toggleForm = (strId) => setArrFormIds((arrPrev) => (arrPrev.includes(strId) ? arrPrev.filter((strOld) => strOld !== strId) : [...arrPrev, strId]));
  const setGroup = (strLevel, blnOn) => {
    const arrGroupIds = BP_FORM_CATALOG.filter((objForm) => objForm.level === strLevel).map((objForm) => objForm.id);
    setArrFormIds((arrPrev) => (blnOn ? [...new Set([...arrPrev, ...arrGroupIds])] : arrPrev.filter((strId) => !arrGroupIds.includes(strId))));
  };
  const updateDoc = (strKey, objChanges) => setArrDocs((arrPrev) => arrPrev.map((objDoc) => (objDoc.key === strKey ? { ...objDoc, ...objChanges } : objDoc)));

  const handleSave = async () => {
    setBlnSaving(true);
    try {
      await updateBudgetCycle(strYear, {
        enabled_form_ids: arrFormIds,
        supporting_documents: arrDocs.map((objDoc) => ({ name: objDoc.name, required: objDoc.required })),
      });
      showToast({ message: `FY${strYear} budget cycle saved.` });
      await loadCycles(strYear);
    } catch (objError) {
      showToast({ message: objError?.message || 'Cannot save this budget cycle.', variant: 'warning' });
    } finally {
      setBlnSaving(false);
    }
  };

  return (
    <div>
      <PageHeader title="Budget Cycles">
        <Button onClick={handleSave} disabled={!strYear || blnSaving}>{blnSaving ? 'Saving...' : `Save FY${strYear}`}</Button>
      </PageHeader>
      <p className="text-muted small px-1">
        Choose which BP forms DBM requires each fiscal year and which supporting documents units must attach. The request wizard
        uses this; requests already submitted keep their own forms. Open or add fiscal years in Settings.
      </p>

      <div className="d-flex flex-wrap gap-2 mb-4">
        {arrCycles.map((objCycle) => (
          <Button key={objCycle.fy_year} variant={objCycle.fy_year === strYear ? 'primary' : 'outline'} size="sm" onClick={() => showCycle(objCycle)}>
            FY{objCycle.fy_year} {objCycle.configured ? '' : '(default)'}
          </Button>
        ))}
      </div>

      {objCurrent && (
        <p className="small text-muted">
          {objCurrent.configured
            ? `Last saved by ${objCurrent.updated_by || '-'} on ${formatTimestamp(objCurrent.updated_at)}.`
            : 'Not set up yet: every form in the catalogue applies and no documents are listed.'}
        </p>
      )}

      <div className="row g-4">
        {FORM_GROUPS.map((objGroup) => {
          const arrForms = BP_FORM_CATALOG.filter((objForm) => objForm.level === objGroup.level);
          const intOn = arrForms.filter((objForm) => arrFormIds.includes(objForm.id)).length;
          return (
            <div className="col-lg-6" key={objGroup.level}>
              <div className="card border rounded-3 p-4 h-100">
                <div className="d-flex justify-content-between align-items-start mb-1">
                  <p className="fw-bold text-uppercase mb-0 section-eyebrow">{objGroup.title}</p>
                  <Badge status="reviewed" label={`${intOn} of ${arrForms.length}`} />
                </div>
                <p className="text-muted small mb-2">{objGroup.hint}</p>
                <div className="d-flex gap-2 mb-2">
                  <Button size="sm" variant="ghost" onClick={() => setGroup(objGroup.level, true)}>All</Button>
                  <Button size="sm" variant="ghost" onClick={() => setGroup(objGroup.level, false)}>None</Button>
                </div>
                {arrForms.map((objForm) => (
                  <div className="form-check" key={objForm.id}>
                    <input className="form-check-input" type="checkbox" id={`form-${objForm.id}`} checked={arrFormIds.includes(objForm.id)} onChange={() => toggleForm(objForm.id)} />
                    <label className="form-check-label small" htmlFor={`form-${objForm.id}`}><strong>{objForm.code}</strong> - {objForm.name}</label>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="card border rounded-3 p-4 my-4">
        <p className="fw-bold text-uppercase mb-1 section-eyebrow">Supporting documents</p>
        <p className="text-muted small mb-3">Documents units attach in step 5 of the request (e.g. quotations, project plans). A required document must be uploaded before the request can be submitted.</p>
        {arrDocs.length === 0 && <p className="text-muted small">No supporting documents listed for this year.</p>}
        {arrDocs.map((objDoc) => (
          <div className="d-flex align-items-center gap-3 mb-2" key={objDoc.key}>
            <div className="flex-grow-1">
              <Input value={objDoc.name} placeholder="Document name" onChange={(objEvent) => updateDoc(objDoc.key, { name: objEvent.target.value })} />
            </div>
            <div className="form-check mb-0">
              <input className="form-check-input" type="checkbox" id={`req-${objDoc.key}`} checked={objDoc.required} onChange={(objEvent) => updateDoc(objDoc.key, { required: objEvent.target.checked })} />
              <label className="form-check-label small" htmlFor={`req-${objDoc.key}`}>Required</label>
            </div>
            <Button size="sm" variant="ghost" onClick={() => setArrDocs((arrPrev) => arrPrev.filter((objOld) => objOld.key !== objDoc.key))}>Remove</Button>
          </div>
        ))}
        <Button size="sm" variant="outline" onClick={() => setArrDocs((arrPrev) => [...arrPrev, { key: `new-${Date.now()}`, name: '', required: true }])}>+ Add document</Button>
      </div>
    </div>
  );
}
