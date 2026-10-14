/**
 * System Name: Budget Management System
 * Module Name: Budget Cycles Module
 *
 * Purpose of this file:
 * Administrator configuration of BP forms and supporting documents for each fiscal year.
 * The request wizard reads this; submitted requests retain their saved form definitions.
 *
 * Author(s): QUT Group T214
 *
 * Copyright (C) 2026
 * by the Department of Science and Technology - Central Office
 * All rights reserved.
 */
import { useCallback, useEffect, useState } from 'react';
import PageHeader from '../../components/layout/page_header';
import { Badge, Button, Input, Modal, useToast } from '../../components/ui';
import { createFiscalYear, getBudgetCycles, updateBudgetCycle } from '../../api/settings_api';
import { BP_FORM_CATALOG, FORM_LEVEL, getCycleFormCatalog } from '../../bp_forms/bp_form_catalog';
import { FIELD_SOURCE, getDefaultFormDefinition } from '../../bp_forms/bp_form_fields';
import { getDefaultRequirement } from '../../bp_forms/bp_form_rules';
import { validateFormConfig } from '../../bp_forms/bp_form_configuration';
import FormConfigurationEditor from './form_configuration_editor';
import { formatTimestamp } from '../../utils/formatters';
import { createClientId } from '../../utils/client_id';

const FORM_GROUPS = [
  { level: FORM_LEVEL.REQUEST, title: 'Request-level forms', hint: 'Completed for each unit in the request wizard.' },
  { level: FORM_LEVEL.AGENCY, title: 'Institution / consolidation schedules', hint: 'Preserve individual institution reporting and Central Office consolidation. Office assignments require DOST confirmation.' },
];

export default function BudgetCyclesPage() {
  const { showToast } = useToast();
  const [arrCycles, setArrCycles] = useState([]);
  const [strYear, setStrYear] = useState('');
  // Keep edits for each year while the administrator switches between years.
  const [objDrafts, setObjDrafts] = useState({});
  const [objEditing, setObjEditing] = useState(null);
  const [strFormYear, setStrFormYear] = useState('');
  const [objFormConfig, setObjFormConfig] = useState(null);
  const [strFormError, setStrFormError] = useState('');
  const [strNewYear, setStrNewYear] = useState('');
  const [blnSaving, setBlnSaving] = useState(false);
  const [blnLoading, setBlnLoading] = useState(true);
  const [strLoadError, setStrLoadError] = useState('');

  const loadCycles = useCallback(async (strKeepYear) => {
    setBlnLoading(true);
    setStrLoadError('');
    try {
      const arrRows = await getBudgetCycles();
      const arrList = Array.isArray(arrRows) ? arrRows : [];
      setArrCycles(arrList);
      setStrYear(arrList.find((objCycle) => objCycle.fy_year === strKeepYear)?.fy_year || arrList.find((objCycle) => objCycle.fy_is_active)?.fy_year || arrList[0]?.fy_year || '');
    } catch (objError) {
      setStrLoadError(objError?.message || 'Cannot load budget cycles.');
    } finally {
      setBlnLoading(false);
    }
  }, []);

  useEffect(() => { loadCycles(); }, [loadCycles]);
  useEffect(() => {
    if (Object.keys(objDrafts).length === 0) return undefined;
    const warnBeforeUnload = (objEvent) => { objEvent.preventDefault(); objEvent.returnValue = ''; };
    window.addEventListener('beforeunload', warnBeforeUnload);
    return () => window.removeEventListener('beforeunload', warnBeforeUnload);
  }, [objDrafts]);

  const objSaved = arrCycles.find((objCycle) => objCycle.fy_year === strYear);
  const objCurrent = objDrafts[strYear] || objSaved;
  const blnYearOpen = objSaved?.fy_is_active === true;
  const arrOpenCycles = arrCycles.filter((objCycle) => objCycle.fy_is_active === true);
  const objFormCycle = objDrafts[strFormYear] || arrCycles.find((objCycle) => objCycle.fy_year === strFormYear);
  const blnBuiltIn = Boolean(objEditing && BP_FORM_CATALOG.some((objForm) => objForm.id === objEditing.id));
  const blnEditingExisting = Boolean(objEditing && getCycleFormCatalog(objFormCycle).some((objForm) => objForm.id === objEditing.id));
  const arrCatalog = getCycleFormCatalog(objCurrent);
  const arrFormIds = objCurrent?.enabled_form_ids || [];
  const arrDocs = objCurrent?.supporting_documents || [];
  const updateCurrent = (objChanges) => setObjDrafts((objPrev) => ({
    ...objPrev, [strYear]: { ...(objPrev[strYear] || objSaved), ...objChanges },
  }));
  const toggleForm = (strId) => updateCurrent({ enabled_form_ids: arrFormIds.includes(strId) ? arrFormIds.filter((strOld) => strOld !== strId) : [...arrFormIds, strId] });
  const setGroup = (strLevel, blnOn) => {
    const arrGroupIds = arrCatalog.filter((objForm) => objForm.level === strLevel).map((objForm) => objForm.id);
    updateCurrent({ enabled_form_ids: blnOn ? [...new Set([...arrFormIds, ...arrGroupIds])] : arrFormIds.filter((strId) => !arrGroupIds.includes(strId)) });
  };
  const updateDoc = (intIndex, objChanges) => updateCurrent({ supporting_documents: arrDocs.map((objDoc, intRow) => intRow === intIndex ? { ...objDoc, ...objChanges } : objDoc) });

  const handleSave = async () => {
    setBlnSaving(true);
    try {
      const objResult = await updateBudgetCycle(strYear, {
        enabled_form_ids: arrFormIds,
        custom_forms: objCurrent.custom_forms || [],
        form_configs: objCurrent.form_configs || {},
        supporting_documents: arrDocs.map((objDoc) => ({ name: objDoc.name, required: objDoc.required })),
      });
      setArrCycles((arrPrev) => arrPrev.map((objCycle) => objCycle.fy_year === strYear ? { ...objCycle, ...objResult } : objCycle));
      setObjDrafts((objPrev) => { const objNext = { ...objPrev }; delete objNext[strYear]; return objNext; });
      showToast({ message: `FY${strYear} budget cycle saved.` });
    } catch (objError) {
      showToast({ message: objError?.message || 'Cannot save this budget cycle.', variant: 'warning' });
    } finally {
      setBlnSaving(false);
    }
  };

  const handleAddYear = async (objEvent) => {
    objEvent.preventDefault();
    setBlnSaving(true);
    try {
      const objYear = await createFiscalYear(Number(strNewYear));
      setStrNewYear('');
      await loadCycles(String(objYear.fy_year));
      showToast({ message: `FY${objYear.fy_year} added. Choose its BP forms below.` });
    } catch (objError) {
      showToast({ message: objError?.message || 'Cannot add this fiscal year.', variant: 'warning' });
    } finally {
      setBlnSaving(false);
    }
  };

  const openFormEditor = (objForm) => {
    if (!blnYearOpen) return;
    setStrFormError('');
    setStrFormYear(strYear);
    setObjEditing(objForm || { id: createClientId('custom-'), code: '', name: '', level: FORM_LEVEL.REQUEST, completedBy: 'Proposing office' });
    const objConfig = objCurrent.form_configs?.[objForm?.id];
    const objDefinition = objForm ? getDefaultFormDefinition(objForm.id) : null;
    setObjFormConfig(structuredClone(objConfig || {
      level: objForm?.level || FORM_LEVEL.REQUEST,
      fields: (objDefinition?.fields || [{ key: 'details', label: 'Details', source: FIELD_SOURCE.USER, type: 'textarea', required: true }]).map((field) => ({ ...field, type: field.type || 'text', required: Boolean(field.required) })),
      requirement: getDefaultRequirement(objForm?.id),
    }));
  };
  const handleApplyForm = async (objEvent) => {
    objEvent.preventDefault();
    if (blnSaving) return;
    if (!arrOpenCycles.some((objCycle) => objCycle.fy_year === strFormYear)) {
      setStrFormError('Choose an open fiscal year for this BP form.');
      return;
    }
    const objForm = { id: objEditing.id, code: objEditing.code.trim(), name: objEditing.name.trim(), completedBy: objEditing.completedBy.trim(), level: objFormConfig.level };
    const { config: objValidConfig, error: strConfigError } = validateFormConfig({ ...objFormConfig, fields: objFormConfig.fields.map((field) => ({ ...field, options: field.options?.map((option) => option.trim()).filter(Boolean) })) });
    if (strConfigError) { setStrFormError(strConfigError); return; }
    if (!objForm.code || !objForm.name || !objForm.completedBy) {
      setStrFormError('Enter a form code, name and completing office.');
      return;
    }
    if (getCycleFormCatalog(objFormCycle).some((objOther) => objOther.id !== objForm.id && objOther.code.toLowerCase() === objForm.code.toLowerCase())) {
      setStrFormError('A BP form with this code already exists for this fiscal year.');
      return;
    }
    const arrCustom = objFormCycle.custom_forms || [];
    const blnExists = arrCustom.some((objOther) => objOther.id === objForm.id);
    setBlnSaving(true);
    setStrFormError('');
    try {
      const objResult = await updateBudgetCycle(strFormYear, {
        custom_forms: blnBuiltIn ? arrCustom : blnExists ? arrCustom.map((objOther) => objOther.id === objForm.id ? objForm : objOther) : [...arrCustom, objForm],
        form_configs: { ...(objFormCycle.form_configs || {}), [objForm.id]: objValidConfig },
        enabled_form_ids: blnEditingExisting ? objFormCycle.enabled_form_ids : [...objFormCycle.enabled_form_ids, objForm.id],
        supporting_documents: objFormCycle.supporting_documents.map((objDoc) => ({ name: objDoc.name, required: objDoc.required })),
      });
      setArrCycles((arrPrev) => arrPrev.map((objCycle) => objCycle.fy_year === strFormYear ? { ...objCycle, ...objResult } : objCycle));
      setObjDrafts((objPrev) => { const objNext = { ...objPrev }; delete objNext[strFormYear]; return objNext; });
      setStrYear(strFormYear);
      setObjEditing(null);
      showToast({ message: `${objForm.code} ${blnEditingExisting ? 'updated' : 'added and enabled'} for FY${strFormYear}.` });
    } catch (objError) {
      setStrFormError(objError?.message || 'Cannot save this BP form.');
    } finally {
      setBlnSaving(false);
    }
  };

  return (
    <div>
      <PageHeader title="Budget Cycles">
        <Button onClick={handleSave} disabled={!blnYearOpen || blnSaving || blnLoading}>{blnSaving ? 'Saving...' : strYear ? `Save FY${strYear}` : 'Save cycle'}</Button>
      </PageHeader>
      <p className="text-muted small px-1">Add new BP forms to any open fiscal year. Choose available forms and supporting documents, then save each year's availability changes.</p>
      <form className="d-flex flex-wrap align-items-end gap-2 mb-3" onSubmit={handleAddYear}>
        <div>
          <label className="form-label small" htmlFor="new-fiscal-year">Add fiscal year</label>
          <Input id="new-fiscal-year" type="number" min={2020} max={2100} step={1} required value={strNewYear} placeholder="e.g. 2028" disabled={blnSaving || blnLoading} onChange={(objEvent) => setStrNewYear(objEvent.target.value)} />
        </div>
        <Button type="submit" variant="outline" disabled={!strNewYear || blnSaving || blnLoading}>+ Add fiscal year</Button>
      </form>
      {blnLoading && <p role="status" className="text-muted">Loading budget cycles...</p>}
      {strLoadError && <div role="alert" className="alert alert-warning">{strLoadError} <Button size="sm" variant="outline" onClick={() => loadCycles(strYear)}>Retry</Button></div>}
      {!blnLoading && !strLoadError && arrCycles.length === 0 && <p className="text-muted">Add a fiscal year to configure its BP forms.</p>}
      <div className="d-flex flex-wrap gap-2 mb-4">
        {arrCycles.map((objCycle) => (
          <Button key={objCycle.fy_year} variant={objCycle.fy_year === strYear ? 'primary' : 'outline'} size="sm" disabled={blnSaving || blnLoading} aria-pressed={objCycle.fy_year === strYear} onClick={() => setStrYear(objCycle.fy_year)}>
            FY{objCycle.fy_year}{objCycle.fy_is_active === false ? ' (closed)' : ''}{objDrafts[objCycle.fy_year] ? ' *' : ''}
          </Button>
        ))}
      </div>
      {objCurrent && (
        <fieldset disabled={!blnYearOpen || blnSaving || blnLoading}>
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
            <div>
              <p className="fw-semibold mb-1">FY{strYear}: {arrFormIds.length} of {arrCatalog.length} BP forms enabled</p>
              <p className="small text-muted mb-0">{objDrafts[strYear] ? 'Unsaved changes. Edits are kept when switching fiscal years.' : objSaved.configured ? `Last saved by ${objSaved.updated_by || '-'} on ${formatTimestamp(objSaved.updated_at)}.` : 'Default cycle: every built-in form is enabled.'}</p>
            </div>
            <Button type="button" variant="outline" disabled={!blnYearOpen} onClick={() => openFormEditor()}>+ Add BP form</Button>
          </div>
          {!blnYearOpen && <p role="status" className="alert alert-secondary small">FY{strYear} is closed. Select an open fiscal year to add or change BP forms.</p>}
          <div className="row g-4">
            {FORM_GROUPS.map((objGroup) => {
              const arrForms = arrCatalog.filter((objForm) => objForm.level === objGroup.level);
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
                      <Button size="sm" variant="ghost" onClick={() => setGroup(objGroup.level, true)}>Enable all</Button>
                      <Button size="sm" variant="ghost" onClick={() => setGroup(objGroup.level, false)}>Disable all</Button>
                    </div>
                    {arrForms.map((objForm) => (
                      <div className="d-flex align-items-start justify-content-between gap-2 py-2 border-bottom" key={objForm.id}>
                        <div className="form-check form-switch">
                          <input className="form-check-input" role="switch" type="checkbox" id={`form-${objForm.id}`} checked={arrFormIds.includes(objForm.id)} onChange={() => toggleForm(objForm.id)} />
                          <label className="form-check-label small" htmlFor={`form-${objForm.id}`}><strong>{objForm.code}</strong> - {objForm.name}<span className="d-block text-muted">{arrFormIds.includes(objForm.id) ? 'Enabled' : 'Disabled'}{objCurrent.form_configs?.[objForm.id] ? ` - ${objCurrent.form_configs[objForm.id].fields.length} fields configured` : ''}</span></label>
                        </div>
                        <Button type="button" size="sm" variant="ghost" aria-label={`Edit ${objForm.code}`} onClick={() => openFormEditor(objForm)}>Edit</Button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="card border rounded-3 p-4 my-4">
            <p className="fw-bold text-uppercase mb-1 section-eyebrow">Supporting documents</p>
            <p className="text-muted small mb-3">Documents units attach in step 5 of the request (e.g. quotations, project plans). Required documents must be uploaded before submission.</p>
            {arrDocs.length === 0 && <p className="text-muted small">No supporting documents listed for this year.</p>}
            {arrDocs.map((objDoc, intIndex) => (
              <div className="d-flex flex-wrap align-items-center gap-3 mb-2" key={objDoc.key || intIndex}>
                <div className="flex-grow-1"><Input aria-label={`Document ${intIndex + 1} name`} value={objDoc.name} maxLength={100} placeholder="Document name" onChange={(objEvent) => updateDoc(intIndex, { name: objEvent.target.value })} /></div>
                <div className="form-check mb-0">
                  <input className="form-check-input" type="checkbox" id={`req-${intIndex}`} checked={objDoc.required} onChange={(objEvent) => updateDoc(intIndex, { required: objEvent.target.checked })} />
                  <label className="form-check-label small" htmlFor={`req-${intIndex}`}>Required</label>
                </div>
                <Button size="sm" variant="ghost" onClick={() => updateCurrent({ supporting_documents: arrDocs.filter((_, intRow) => intRow !== intIndex) })}>Remove</Button>
              </div>
            ))}
            <Button size="sm" variant="outline" onClick={() => updateCurrent({ supporting_documents: [...arrDocs, { key: createClientId('doc-'), name: '', required: true }] })}>+ Add document</Button>
          </div>
        </fieldset>
      )}
      <Modal open={Boolean(objEditing)} size="lg" onClose={() => { if (!blnSaving) setObjEditing(null); }} closeOnBackdrop={!blnSaving} showCloseButton={!blnSaving} title={`${blnEditingExisting ? 'Edit' : 'Add'} BP form`}>
        {objEditing && (
          <form onSubmit={handleApplyForm} className="d-grid gap-3">
            <fieldset disabled={blnSaving} className="d-grid gap-3">
            <div><label className="form-label" htmlFor="bp-form-year">Fiscal year</label><select id="bp-form-year" className="form-select" required disabled={blnEditingExisting} value={strFormYear} onChange={(objEvent) => { setStrFormYear(objEvent.target.value); setStrFormError(''); }}>{arrOpenCycles.map((objCycle) => <option key={objCycle.fy_year} value={objCycle.fy_year}>FY{objCycle.fy_year}</option>)}</select></div>
            <p className="small text-muted mb-0">Fields and requirements apply to FY{strFormYear}. Request-level forms are filled online by requesters; agency-level forms are completed at consolidation. Submitted requests retain their saved definitions.</p>
            <div><label className="form-label" htmlFor="bp-form-code">Form code</label><Input id="bp-form-code" readOnly={blnBuiltIn} required maxLength={50} placeholder="e.g. BP Form 208" value={objEditing.code} onChange={(objEvent) => setObjEditing({ ...objEditing, code: objEvent.target.value })} /></div>
            <div><label className="form-label" htmlFor="bp-form-name">Form name</label><Input id="bp-form-name" readOnly={blnBuiltIn} required maxLength={200} value={objEditing.name} onChange={(objEvent) => setObjEditing({ ...objEditing, name: objEvent.target.value })} /></div>
            <div><label className="form-label" htmlFor="bp-form-level">Form level</label><select id="bp-form-level" className="form-select" value={objFormConfig.level} onChange={(objEvent) => setObjFormConfig({ ...objFormConfig, level: objEvent.target.value })}><option value={FORM_LEVEL.REQUEST}>Request-level (filled by requester)</option><option value={FORM_LEVEL.AGENCY}>Agency-level (filled at consolidation)</option></select></div>
            <div><label className="form-label" htmlFor="bp-form-owner">Completed by</label><Input id="bp-form-owner" readOnly={blnBuiltIn} required maxLength={150} value={objEditing.completedBy} onChange={(objEvent) => setObjEditing({ ...objEditing, completedBy: objEvent.target.value })} /></div>
            <FormConfigurationEditor value={objFormConfig} onChange={setObjFormConfig} />
            {strFormError && <p role="alert" className="text-danger small mb-0">{strFormError}</p>}
            <p className="small text-muted mb-0">Saving this form also saves any pending availability and document changes for FY{strFormYear}.</p>
            <div className="d-flex justify-content-end gap-2"><Button type="button" variant="ghost" onClick={() => setObjEditing(null)}>Cancel</Button><Button type="submit">{blnSaving ? 'Saving...' : blnEditingExisting ? 'Save BP form' : 'Add BP form'}</Button></div>
            </fieldset>
          </form>
        )}
      </Modal>
    </div>
  );
}
