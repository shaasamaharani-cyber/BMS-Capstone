/**
 * System Name: DOST Budget Management System
 * Module Name: Spending Monitoring
 *
 * Purpose of this file:
 * Quarterly spending reports: each unit reports actual obligations and disbursements
 * (year to date) against its approved allotment, and explains any overspend.
 *
 * Author(s): QUT Group T214
 *
 * Copyright (C) 2026
 * by the Department of Science and Technology - Central Office
 * All rights reserved.
 */

import { permissionsForUser } from './auth.mjs';
import { resolveRequestActor } from '../services/requestActor.mjs';
import { isRequesterUser, requestingUnitIdForUser } from '../services/users.mjs';

const PERMISSION = 'route:spending-monitoring';
const MAX_JUSTIFICATION = 1000;

// Assumption agreed with Grant (not yet confirmed by DOST): a justification is needed
// when obligations to date go over the approved allotment for that expense class.
function needsJustification(objLine) {
  return Number(objLine.obligation_amount) > Number(objLine.allotment_amount);
}

function todayInManila() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
}

function withDerivedFields(db, objReport) {
  const objUnit = db.rows('requesting-units').find((row) => Number(row.ru_id) === Number(objReport.sr_requesting_unit_id));
  const arrCategories = db.rows('budget-categories');
  const strSubmittedDay = objReport.sr_submitted_at
    ? new Date(objReport.sr_submitted_at).toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' })
    : null;
  const arrLines = (objReport.sr_lines || []).map((objLine) => {
    const objCategory = arrCategories.find((row) => Number(row.bcat_id) === Number(objLine.category_id));
    return { ...objLine, category_code: objCategory?.bcat_code, category_name: objCategory?.bcat_name };
  });

  return {
    ...objReport,
    sr_lines: arrLines,
    unit_name: objUnit?.ru_name ?? `Unit ${objReport.sr_requesting_unit_id}`,
    is_late: (strSubmittedDay ?? todayInManila()) > objReport.sr_due_date,
    over_allotment_count: arrLines.filter(needsJustification).length,
    missing_justification_count: arrLines.filter((objLine) => needsJustification(objLine) && !String(objLine.justification || '').trim()).length,
  };
}

function toAmount(value) {
  if (value === null || value === undefined || value === '') return null;
  const dblValue = Number(value);
  return Number.isFinite(dblValue) ? dblValue : NaN;
}

export async function handleSpendingReports(ctx) {
  const { db, json, parts, payload, req, res, url } = ctx;
  if (parts[0] !== 'spending-reports') return false;

  const objActor = resolveRequestActor(db, req);
  if (!objActor || !permissionsForUser(objActor).includes(PERMISSION)) {
    json(res, 403, { message: 'Unauthorized. Insufficient permissions.' });
    return true;
  }

  // A requester only ever sees and edits their own unit's reports
  const intActorUnitId = isRequesterUser(objActor) ? requestingUnitIdForUser(objActor) : null;
  const blnRequester = isRequesterUser(objActor);

  if (req.method === 'GET' && parts.length === 1) {
    const strPeriod = url.searchParams.get('period_label');
    const arrReports = db.rows('spending-reports')
      .filter((row) => !blnRequester || Number(row.sr_requesting_unit_id) === intActorUnitId)
      .filter((row) => !strPeriod || row.sr_period_label === strPeriod)
      .map((row) => withDerivedFields(db, row));
    json(res, 200, { data: arrReports });
    return true;
  }

  if (req.method === 'PUT' && parts.length === 2) {
    const objReport = db.find('spending-reports', parts[1]);
    if (!objReport) {
      json(res, 404, { message: 'Spending report not found' });
      return true;
    }
    // Central Office can only view in slice 1; accepting or returning reports comes later
    if (!blnRequester || Number(objReport.sr_requesting_unit_id) !== intActorUnitId) {
      json(res, 403, { message: 'Only the reporting unit can edit this report.' });
      return true;
    }
    if (objReport.sr_status === 'submitted') {
      json(res, 422, { message: 'This report has already been submitted.' });
      return true;
    }

    const blnSubmit = payload?.submit === true;
    const arrInput = Array.isArray(payload?.lines) ? payload.lines : [];
    const objErrors = {};

    // The allotment is never taken from the browser; only actuals and the justification are
    const arrLines = objReport.sr_lines.map((objLine) => {
      const objIn = arrInput.find((row) => Number(row.category_id) === Number(objLine.category_id)) || {};
      const objNext = {
        ...objLine,
        obligation_amount: toAmount(objIn.obligation_amount),
        disbursement_amount: toAmount(objIn.disbursement_amount),
        justification: String(objIn.justification ?? '').trim().slice(0, MAX_JUSTIFICATION),
      };
      const arrLineErrors = [];
      if (Number.isNaN(objNext.obligation_amount) || Number.isNaN(objNext.disbursement_amount)) arrLineErrors.push('Amounts must be numbers.');
      if (blnSubmit && (objNext.obligation_amount === null || objNext.disbursement_amount === null)) arrLineErrors.push('Enter both actual amounts.');
      if (blnSubmit && needsJustification(objNext) && !objNext.justification) arrLineErrors.push('Explain why obligations are over the approved allotment.');
      if (arrLineErrors.length > 0) objErrors[objLine.category_id] = arrLineErrors;
      return objNext;
    });

    if (Object.keys(objErrors).length > 0) {
      json(res, 422, { message: 'Please fix the highlighted lines.', errors: objErrors });
      return true;
    }

    const objSaved = {
      ...objReport,
      sr_lines: arrLines,
      sr_status: blnSubmit ? 'submitted' : 'draft',
      sr_submitted_at: blnSubmit ? new Date().toISOString() : null,
      sr_submitted_by: blnSubmit ? Number(objActor.id) : null,
    };
    db.upsert('spending-reports', objReport.id, objSaved);
    json(res, 200, { data: withDerivedFields(db, objSaved) });
    return true;
  }

  return false;
}
