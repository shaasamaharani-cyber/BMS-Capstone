import { resolveRequestActor } from '../services/requestActor.mjs';
import { getCycleFormCatalog } from '../../../src/bp_forms/bp_form_catalog.js';
import { readBudgetCycle as readCycle, validateCustomForms } from '../services/budgetCycles.mjs';
import { validateFormConfigs } from '../../../src/bp_forms/bp_form_configuration.js';
import { getFormDefinition } from '../../../src/bp_forms/bp_form_fields.js';
import { OFFICIAL_SCHEMA_VERSION } from '../../../src/bp_forms/official_form_schema.js';

// Team defaults until DOST confirms its own targets (same colour bands as Team 27's dashboard)
// pace_per_quarter: share of the allotment expected to be committed per quarter (team default, awaiting DOST)
const DEFAULT_SETTINGS = { attention_below: 90, amber_below: 75, due_soon_days: 14, pace_per_quarter: 25 };

// Internal Consolidation and the directors' approval are the core of the as-is flow, so they stay on
const LOCKED_STAGE_KEYS = ['draft', 'finance_planning_director'];

const readSettings = (db) => ({ ...DEFAULT_SETTINGS, ...(db.find('app-settings', 1) || {}) });

function logChange(db, actor, strArea, strDetails) {
  const id = db.nextId('admin-change-logs');
  db.upsert('admin-change-logs', id, {
    id,
    acl_area: strArea,
    acl_details: strDetails,
    acl_actor_name: actor?.usr_name ?? null,
    acl_created_at: new Date().toISOString(),
  });
}

/**
 * Settings that administrators maintain: alert thresholds, which approval stages are used, and the
 * reference lists (requesting units, fiscal years). Reading the thresholds is open to every signed-in
 * user because all dashboards use them; every change is admin-only and logged.
 */
export async function handleSettings(ctx) {
  const { db, json, parts, req, res, payload } = ctx;
  const blnSettings = parts[0] === 'settings';
  const blnCycles = parts[0] === 'budget-cycles';
  const blnWrite = req.method !== 'GET'
    && ['approval-workflow-stages', 'requesting-units', 'fiscal-years'].includes(parts[0]);
  if (!blnSettings && !blnCycles && !blnWrite) return false;

  const actor = resolveRequestActor(db, req);
  if (!actor) {
    json(res, 401, { message: 'Unauthenticated.' });
    return true;
  }
  if (req.method === 'GET' && blnSettings && parts.length === 1) {
    json(res, 200, { data: readSettings(db) });
    return true;
  }
  // Every signed-in user may read a cycle: the request wizard needs the year's forms and documents
  if (req.method === 'GET' && blnCycles && parts[1]) {
    if (!db.rows('fiscal-years').some((row) => String(row.fy_year) === parts[1])) {
      json(res, 404, { message: 'Fiscal year not found' });
      return true;
    }
    json(res, 200, { data: readCycle(db, parts[1]) });
    return true;
  }
  if (req.method === 'GET' && blnCycles) {
    const arrYears = db.rows('fiscal-years').sort((a, b) => Number(b.fy_year) - Number(a.fy_year));
    json(res, 200, { data: arrYears.map((row) => readCycle(db, row.fy_year)) });
    return true;
  }
  if (String(actor.role?.role_group || '').toLowerCase() !== 'admin') {
    json(res, 403, { message: 'Unauthorized. Insufficient permissions.' });
    return true;
  }

  if (req.method === 'GET' && blnSettings && parts[1] === 'changes') {
    const arrChanges = db.rows('admin-change-logs')
      .sort((a, b) => String(b.acl_created_at).localeCompare(String(a.acl_created_at)))
      .slice(0, 20);
    json(res, 200, { data: arrChanges });
    return true;
  }

  if (req.method === 'PUT' && blnSettings && parts.length === 1) {
    const objNext = {
      attention_below: Number(payload.attention_below),
      amber_below: Number(payload.amber_below),
      due_soon_days: Number(payload.due_soon_days),
      pace_per_quarter: payload.pace_per_quarter === undefined ? readSettings(db).pace_per_quarter : Number(payload.pace_per_quarter),
    };
    if (![objNext.attention_below, objNext.amber_below, objNext.due_soon_days, objNext.pace_per_quarter].every(Number.isInteger)) {
      json(res, 422, { message: 'Enter whole numbers.' });
      return true;
    }
    if (!(objNext.amber_below > 0 && objNext.amber_below < objNext.attention_below && objNext.attention_below <= 100)) {
      json(res, 422, { message: 'The amber level must be above 0 and below the attention level, which must be 100 or less.' });
      return true;
    }
    if (objNext.due_soon_days < 1 || objNext.due_soon_days > 90) {
      json(res, 422, { message: 'Due soon must be between 1 and 90 days.' });
      return true;
    }
    if (objNext.pace_per_quarter < 1 || objNext.pace_per_quarter > 100) {
      json(res, 422, { message: 'The spending pace must be between 1 and 100% per quarter.' });
      return true;
    }
    const objBefore = readSettings(db);
    const strDetails = Object.keys(objNext)
      .filter((strKey) => objBefore[strKey] !== objNext[strKey])
      .map((strKey) => `${strKey.replace(/_/g, ' ')}: ${objBefore[strKey]} -> ${objNext[strKey]}`)
      .join('; ');
    db.upsert('app-settings', 1, { id: 1, ...objNext });
    if (strDetails) logChange(db, actor, 'Alert thresholds', strDetails);
    json(res, 200, { data: readSettings(db) });
    return true;
  }

  if (req.method === 'PUT' && parts[0] === 'approval-workflow-stages' && parts[1]) {
    const objStage = db.find('approval-workflow-stages', parts[1]);
    if (!objStage) {
      json(res, 404, { message: 'Stage not found' });
      return true;
    }
    if (LOCKED_STAGE_KEYS.includes(String(objStage.aws_id))) {
      json(res, 422, { message: `${objStage.aws_name} is part of the core approval flow and stays on.` });
      return true;
    }
    const intActive = payload.aws_is_active ? 1 : 0;
    db.upsert('approval-workflow-stages', objStage.id, { ...objStage, aws_is_active: intActive });
    logChange(db, actor, 'Approval stages', `${objStage.aws_name}: ${intActive ? 'turned on' : 'turned off'} (new budgets only)`);
    json(res, 200, { data: db.find('approval-workflow-stages', objStage.id) });
    return true;
  }

  if (req.method === 'PUT' && blnCycles && parts[1]) {
    const strYear = String(parts[1]);
    const objYear = db.rows('fiscal-years').find((row) => String(row.fy_year) === strYear);
    if (!objYear) {
      json(res, 404, { message: 'Fiscal year not found' });
      return true;
    }
    if (Number(objYear.fy_is_active) !== 1) {
      json(res, 422, { message: `FY${strYear} is closed. Reopen it in Settings before changing its BP forms.` });
      return true;
    }
    const objBefore = readCycle(db, strYear);
    const { forms: arrCustomForms, error: strFormError } = validateCustomForms(payload.custom_forms ?? objBefore.custom_forms);
    if (strFormError) {
      json(res, 422, { message: strFormError });
      return true;
    }
    // Older unconfigured custom forms keep their established requirement. New ones
    // must have an explicit Always/Conditional configuration to become mandatory.
    for (const form of arrCustomForms) {
      const previous = objBefore.custom_forms.find((row) => row.id === form.id);
      if (!previous || previous.optionalByDefault === true) form.optionalByDefault = true;
    }
    const arrCatalog = getCycleFormCatalog({ custom_forms: arrCustomForms });
    const arrAllowedIds = arrCatalog.map((objForm) => objForm.id);
    const { configs: objFormConfigs, error: strConfigError } = validateFormConfigs(payload.form_configs ?? objBefore.form_configs, arrAllowedIds);
    if (strConfigError) {
      json(res, 422, { message: strConfigError });
      return true;
    }
    if (!Array.isArray(payload.enabled_form_ids) || payload.enabled_form_ids.some((strId) => !arrAllowedIds.includes(strId))) {
      json(res, 422, { message: 'Choose BP forms belonging to this fiscal year.' });
      return true;
    }
    const arrFormIds = [...new Set(payload.enabled_form_ids)];
    const arrDocs = (Array.isArray(payload.supporting_documents) ? payload.supporting_documents : [])
      .map((objDoc) => ({ name: String(objDoc?.name || '').trim(), required: Boolean(objDoc?.required) }));
    const arrNames = arrDocs.map((objDoc) => objDoc.name.toLowerCase());
    if (arrDocs.some((objDoc) => !objDoc.name || objDoc.name.length > 100) || new Set(arrNames).size !== arrNames.length) {
      json(res, 422, { message: 'Each supporting document needs a different name (up to 100 characters).' });
      return true;
    }
    const arrAdded = arrFormIds.filter((strId) => !objBefore.enabled_form_ids.includes(strId));
    const arrRemoved = objBefore.enabled_form_ids.filter((strId) => !arrFormIds.includes(strId));
    const strCode = (strId) => arrCatalog.find((objForm) => objForm.id === strId)?.code || getCycleFormCatalog(objBefore).find((objForm) => objForm.id === strId)?.code || strId;
    const arrDetails = [
      arrAdded.length ? `forms added: ${arrAdded.map(strCode).join(', ')}` : '',
      arrRemoved.length ? `forms removed: ${arrRemoved.map(strCode).join(', ')}` : '',
      JSON.stringify(objBefore.custom_forms) !== JSON.stringify(arrCustomForms)
        ? `custom form definitions updated: ${arrCustomForms.map((objForm) => objForm.code).join(', ') || 'none'}` : '',
      JSON.stringify(objBefore.form_configs) !== JSON.stringify(objFormConfigs)
        ? `fields and requirements updated: ${Object.keys(objFormConfigs).filter((id) => JSON.stringify(objBefore.form_configs[id]) !== JSON.stringify(objFormConfigs[id])).map(strCode).join(', ') || 'definitions reset'}` : '',
      JSON.stringify(objBefore.supporting_documents) !== JSON.stringify(arrDocs)
        ? `documents: ${arrDocs.map((objDoc) => `${objDoc.name}${objDoc.required ? ' (required)' : ''}`).join(', ') || 'none'}` : '',
    ].filter(Boolean);
    db.upsert('budget-cycles', strYear, {
      id: strYear,
      fy_year: strYear,
      enabled_form_ids: arrFormIds,
      custom_forms: arrCustomForms,
      form_configs: objFormConfigs,
      supporting_documents: arrDocs,
      configured: true,
      schema_version: OFFICIAL_SCHEMA_VERSION,
      form_definitions: Object.fromEntries(arrCatalog.map((form) => [form.id, getFormDefinition(form.id, { formConfigs: objFormConfigs })])),
      revision: Number(objBefore.revision || 0) + (arrDetails.length ? 1 : 0),
      configuration_versions: [
        ...(objBefore.configuration_versions || []),
        ...(arrDetails.length && objBefore.configured ? [{ revision: Number(objBefore.revision || 0), schema_version: objBefore.schema_version || 'legacy-unversioned', form_configs: objBefore.form_configs, custom_forms: objBefore.custom_forms, enabled_form_ids: objBefore.enabled_form_ids, supporting_documents: objBefore.supporting_documents, definitions: objBefore.form_definitions || null, updated_by: objBefore.updated_by || null, updated_at: objBefore.updated_at || null }] : []),
      ],
      updated_by: actor.usr_name,
      updated_at: new Date().toISOString(),
    });
    if (arrDetails.length) logChange(db, actor, `Budget cycle FY${strYear}`, arrDetails.join('; '));
    json(res, 200, { data: readCycle(db, strYear) });
    return true;
  }

  if (parts[0] === 'requesting-units') {
    const strName = String(payload.ru_name ?? '').trim();
    const blnNameTaken = (intOwnId) => db.rows('requesting-units')
      .some((row) => String(row.ru_name).toLowerCase() === strName.toLowerCase() && Number(row.ru_id) !== Number(intOwnId));
    if (req.method === 'POST' && parts.length === 1) {
      if (!strName || strName.length > 100) {
        json(res, 422, { message: 'Enter a unit name (up to 100 characters).' });
        return true;
      }
      if (blnNameTaken(null)) {
        json(res, 422, { message: 'A unit with this name already exists.' });
        return true;
      }
      const id = Math.max(0, ...db.rows('requesting-units').map((row) => Number(row.ru_id) || 0)) + 1;
      db.upsert('requesting-units', id, { id, ru_id: id, ru_name: strName, agency: strName, ru_is_active: 1 });
      logChange(db, actor, 'Requesting units', `Added ${strName}`);
      json(res, 201, { data: db.find('requesting-units', id) });
      return true;
    }
    const objUnit = parts[1] ? db.find('requesting-units', parts[1]) : null;
    if (req.method === 'PUT' && objUnit) {
      const objNext = { ...objUnit };
      const arrChanged = [];
      if (payload.ru_name !== undefined) {
        if (!strName || strName.length > 100 || blnNameTaken(objUnit.ru_id)) {
          json(res, 422, { message: 'Enter a new, unused unit name (up to 100 characters).' });
          return true;
        }
        if (strName !== objUnit.ru_name) arrChanged.push(`renamed ${objUnit.ru_name} -> ${strName}`);
        objNext.ru_name = strName;
        objNext.agency = strName;
      }
      if (payload.ru_is_active !== undefined) {
        objNext.ru_is_active = payload.ru_is_active ? 1 : 0;
        if (objNext.ru_is_active !== Number(objUnit.ru_is_active)) arrChanged.push(`${objNext.ru_name} ${objNext.ru_is_active ? 'activated' : 'deactivated'}`);
      }
      db.upsert('requesting-units', objUnit.id ?? objUnit.ru_id, objNext);
      if (arrChanged.length) logChange(db, actor, 'Requesting units', arrChanged.join('; '));
      json(res, 200, { data: objNext });
      return true;
    }
  }

  if (parts[0] === 'fiscal-years') {
    if (req.method === 'POST' && parts.length === 1) {
      const intYear = Number(payload.fy_year);
      if (!Number.isInteger(intYear) || intYear < 2020 || intYear > 2100) {
        json(res, 422, { message: 'Enter a year between 2020 and 2100.' });
        return true;
      }
      if (db.rows('fiscal-years').some((row) => Number(row.fy_year) === intYear)) {
        json(res, 422, { message: 'This fiscal year already exists.' });
        return true;
      }
      const id = Math.max(0, ...db.rows('fiscal-years').map((row) => Number(row.fy_id) || 0)) + 1;
      db.upsert('fiscal-years', id, { id, fy_id: id, fy_year: String(intYear), fy_is_active: 1 });
      logChange(db, actor, 'Fiscal years', `Added FY${intYear}`);
      json(res, 201, { data: db.find('fiscal-years', id) });
      return true;
    }
    const objYear = parts[1] ? db.find('fiscal-years', parts[1]) : null;
    if (req.method === 'PUT' && objYear) {
      const intActive = payload.fy_is_active ? 1 : 0;
      db.upsert('fiscal-years', objYear.id ?? objYear.fy_id, { ...objYear, fy_is_active: intActive });
      logChange(db, actor, 'Fiscal years', `FY${objYear.fy_year} ${intActive ? 'opened for new work' : 'closed for new work'}`);
      json(res, 200, { data: db.find('fiscal-years', objYear.id ?? objYear.fy_id) });
      return true;
    }
  }

  json(res, 404, { message: 'Not found' });
  return true;
}
