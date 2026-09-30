import {
  budgetRequestItems,
  saveBudgetRequest,
  withBudgetRequestRelations,
} from '../services/budgetRequests.mjs';
import {
  createVersionSnapshot,
  getActivityForRequest,
  getVersionsForRequest,
  logActivity,
  nextVersionNumber,
} from '../services/budgetRequestLifecycle.mjs';
import { resolveRequestActor } from '../services/requestActor.mjs';
import {
  canRequesterAccessBudgetRequest,
  isRequesterUser,
  requestingUnitIdForUser,
} from '../services/users.mjs';
import { sortItems } from '../utils.mjs';

function filteredBudgetRequests(db, params, actor = null) {
  let items = db.rows('budget-requests').map((row) => withBudgetRequestRelations(db, row));

  const ids = params.get('ids');
  if (ids) {
    const idSet = new Set(ids.split(',').map((value) => value.trim()));
    items = items.filter((item) => idSet.has(String(item.br_id)));
  }

  const title = params.get('title');
  if (title) {
    items = items.filter((item) => String(item.br_title).toLowerCase().includes(title.toLowerCase()));
  }

  const status = params.get('status');
  if (status) {
    items = items.filter((item) => String(item.br_status).toLowerCase() === status.toLowerCase());
  }

  const unitId = params.get('requesting_unit_id');
  if (unitId) {
    items = items.filter((item) => String(item.br_requesting_unit_id) === unitId);
  } else if (isRequesterUser(actor)) {
    const intActorUnitId = requestingUnitIdForUser(actor);
    if (intActorUnitId != null) {
      items = items.filter((item) => Number(item.br_requesting_unit_id) === intActorUnitId);
    }
  }

  const fiscalYearId = params.get('fiscal_year_id');
  if (fiscalYearId) {
    items = items.filter((item) => String(item.br_fiscal_year_id) === fiscalYearId);
  }

  return sortItems(items, params, {
    title: (item) => item.br_title,
    unit: (item) => item.requesting_unit?.ru_name,
    fiscalYear: (item) => item.fiscal_year?.fy_year,
    status: (item) => item.br_status,
    lastUpdated: (item) => item.br_updated_at || item.br_created_at,
  });
}

function validateBudgetRequestFiscalYear(db, fiscalYearId) {
  if (fiscalYearId === null || typeof fiscalYearId === 'undefined' || fiscalYearId === '') {
    return 'Fiscal year is required.';
  }

  const selectedYear = db.rows('fiscal-years')
    .find((row) => Number(row.fy_id) === Number(fiscalYearId));

  if (!selectedYear) {
    return 'Fiscal year is invalid.';
  }

  const currentYear = new Date().getFullYear();
  if (Number(selectedYear.fy_year) < currentYear) {
    return `Fiscal year must be ${currentYear} or later.`;
  }

  return null;
}

export async function handleBudgetRequests(ctx) {
  const { db, json, paginate, parts, req, res, url, payload } = ctx;

  if (parts[0] !== 'budget-requests') return false;

  if (req.method === 'GET' && parts.length === 1) {
    const actor = resolveRequestActor(db, req, payload);
    json(res, 200, paginate(filteredBudgetRequests(db, url.searchParams, actor), url.searchParams));
    return true;
  }

  if (req.method === 'POST' && parts.length === 1) {
    const actor = resolveRequestActor(db, req, payload);
    const fiscalYearError = validateBudgetRequestFiscalYear(db, payload?.br_fiscal_year_id);
    if (fiscalYearError) {
      json(res, 422, { errors: { br_fiscal_year_id: [fiscalYearError] } });
      return true;
    }

    const createPayload = { ...payload };
    const intActorUnitId = requestingUnitIdForUser(actor);
    if (isRequesterUser(actor) && intActorUnitId != null) {
      createPayload.br_requesting_unit_id = intActorUnitId;
    }

    json(res, 201, { data: saveBudgetRequest(db, createPayload) });
    return true;
  }

  const id = parts[1];
  const sub = parts[2];
  const request = db.find('budget-requests', id);

  if (!request) {
    json(res, 404, { message: 'Budget request not found' });
    return true;
  }

  const actor = resolveRequestActor(db, req, payload);
  if (!canRequesterAccessBudgetRequest(actor, request)) {
    json(res, 403, { message: 'Unauthorized. Insufficient permissions.' });
    return true;
  }

  if (req.method === 'GET' && parts.length === 2) {
    json(res, 200, {
      data: {
        ...withBudgetRequestRelations(db, request),
        items: budgetRequestItems(db, id),
      },
    });
    return true;
  }

  if (req.method === 'PUT' && parts.length === 2) {
    const fiscalYearId = payload?.br_fiscal_year_id ?? request.br_fiscal_year_id;
    const fiscalYearError = validateBudgetRequestFiscalYear(db, fiscalYearId);
    if (fiscalYearError) {
      json(res, 422, { errors: { br_fiscal_year_id: [fiscalYearError] } });
      return true;
    }
    json(res, 200, { data: saveBudgetRequest(db, payload, request) });
    return true;
  }

  if (req.method === 'DELETE' && parts.length === 2) {
    db.remove('budget-requests', id);
    json(res, 200, { message: 'Deleted' });
    return true;
  }

  if (req.method === 'POST' && sub === 'submit') {
    const actor = db.find('users', payload.actor_id) ?? null;
    const fromStatus = request.br_status;
    const isResubmit = fromStatus === 'rejected';
    const versionNum = nextVersionNumber(db, id);
    const updated = saveBudgetRequest(db, { br_status: 'submitted', br_current_version_number: versionNum }, request);
    const version = await createVersionSnapshot(db, updated, versionNum, actor, 'submitted');
    logActivity(db, id, isResubmit ? 'resubmitted' : 'submitted', fromStatus, 'submitted', actor, payload.comment ?? null, version.id);
    json(res, 200, { data: updated });
    return true;
  }

  if (req.method === 'POST' && sub === 'review') {
    const actor = db.find('users', payload.actor_id) ?? null;
    const statusMap = {
      approve: 'reviewed',
      validate: 'consolidated',
      reject: 'rejected',
      return: 'rejected',
    };
    const actionMap = {
      approve: 'approved',
      validate: 'consolidated',
      reject: 'rejected',
      return: 'rejected',
    };
    const toStatus = statusMap[payload.action] || 'reviewed';
    const action = actionMap[payload.action] || 'approved';
    const latestVersion = getVersionsForRequest(db, id).at(-1);

    if (latestVersion) {
      latestVersion.brv_status = toStatus;
      if (latestVersion.brv_snapshot?.overview) {
        latestVersion.brv_snapshot.overview.status = toStatus;
      }
      db.upsert('budget-request-versions', latestVersion.id, latestVersion);
    }

    const reviewComment = typeof payload.comment === 'string' ? payload.comment.trim() : '';
    const updated = saveBudgetRequest(db, {
      br_status: toStatus,
      br_review_comment: reviewComment || request.br_review_comment || null,
      br_reviewed_at: new Date().toISOString(),
      br_reviewed_by_id: actor?.id ?? null,
    }, request);
    logActivity(db, id, action, request.br_status, toStatus, actor, payload.comment ?? null, latestVersion?.id ?? null);
    json(res, 200, { data: updated });
    return true;
  }

  if (req.method === 'GET' && sub === 'versions' && parts[3]) {
    const version = db.find('budget-request-versions', parts[3]);
    if (!version) { json(res, 404, { message: 'Version not found' }); return true; }
    json(res, 200, { data: version });
    return true;
  }

  if (req.method === 'GET' && sub === 'versions') {
    json(res, 200, { data: getVersionsForRequest(db, id) });
    return true;
  }

  if (req.method === 'GET' && sub === 'activity') {
    json(res, 200, { data: getActivityForRequest(db, id) });
    return true;
  }

  if (req.method === 'GET' && sub === 'items') {
    json(res, 200, { data: budgetRequestItems(db, id) });
    return true;
  }

  if (req.method === 'POST' && sub === 'items') {
    const itemId = db.nextId('budget-request-items');
    const item = db.upsert('budget-request-items', itemId, {
      id: itemId,
      bri_id: itemId,
      bri_br_id: Number(id),
      ...payload,
    });
    json(res, 201, { data: item });
    return true;
  }

  if (sub === 'items' && parts[3]) {
    const itemId = parts[3];
    const existing = db.find('budget-request-items', itemId);

    if (req.method === 'GET') {
      json(res, 200, { data: existing });
      return true;
    }

    if (req.method === 'PUT') {
      json(res, 200, { data: db.upsert('budget-request-items', itemId, { ...existing, ...payload }) });
      return true;
    }

    if (req.method === 'DELETE') {
      db.remove('budget-request-items', itemId);
      json(res, 200, { message: 'Deleted' });
      return true;
    }
  }

  return false;
}
