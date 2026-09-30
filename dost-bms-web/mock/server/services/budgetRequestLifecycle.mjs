import { budgetRequestItems } from './budgetRequests.mjs';
import { roleForUser } from './users.mjs';
import { generateBudgetRequestVersionPdf } from './budgetRequestVersionPdf.mjs';

function categoryForId(db, categoryId) {
  return db.rows('budget-categories')
    .find((row) => Number(row.bcat_id ?? row.id) === Number(categoryId));
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value ?? null));
}

function capturedAttachedFiles(request = {}) {
  return (Array.isArray(request.br_attached_files) ? request.br_attached_files : [])
    .map((file) => ({
      id: file.id ?? file.name ?? '',
      name: file.name ?? '',
      size: Number(file.size) || 0,
      type: file.type ?? '',
      lastModified: file.lastModified ?? null,
      url: file.url ?? file.fileUrl ?? '',
    }));
}

function totalsForItems(db, items = []) {
  const totals = { psTotal: 0, mooeTotal: 0, coTotal: 0, tagTotal: 0, grandTotal: 0 };

  items.forEach((item) => {
    const amount = Number(item.bri_planned_amount ?? 0);
    const category = categoryForId(db, item.bri_category_id);
    const code = String(category?.bcat_code || '').toUpperCase();

    if (code === 'PS') totals.psTotal += amount;
    if (code === 'MOOE') totals.mooeTotal += amount;
    if (code === 'CO') totals.coTotal += amount;
    if (code === 'TAG') totals.tagTotal += amount;
    totals.grandTotal += amount;
  });

  return totals;
}

function buildVersionSnapshot(db, request, items, versionNumber, submittedBy, submittedByRole, status) {
  const attachedFiles = capturedAttachedFiles(request);
  const totals = totalsForItems(db, items);
  const enrichedItems = items.map((item) => {
    const category = categoryForId(db, item.bri_category_id);
    return {
      ...cloneJson(item),
      categoryCode: category?.bcat_code ?? '',
      categoryName: category?.bcat_name ?? '',
    };
  });

  return {
    br_reference_no: request.br_reference_no,
    br_title: request.br_title,
    br_description: request.br_description,
    br_total_amount: totals.grandTotal.toFixed(2),
    items: enrichedItems.map((item) => ({
      bri_id: item.bri_id,
      bri_category_id: item.bri_category_id,
      bri_cost_structure: item.bri_cost_structure,
      bri_description: item.bri_description,
      bri_planned_amount: item.bri_planned_amount,
      bri_justification: item.bri_justification,
      bri_sort_order: item.bri_sort_order,
      categoryCode: item.categoryCode,
      categoryName: item.categoryName,
    })),
    overview: {
      referenceNo: request.br_reference_no,
      title: request.br_title,
      description: request.br_description,
      status,
      versionNumber,
      requestingUnitId: request.br_requesting_unit_id,
      requestingUnitName: request.requesting_unit?.ru_name ?? '',
      fiscalYearId: request.br_fiscal_year_id,
      fiscalYear: request.fiscal_year?.fy_year ?? '',
      planningPeriodId: request.br_planning_period_id,
      planningPeriodName: request.planning_period?.pp_name ?? '',
      submittedById: submittedBy?.id ?? null,
      submittedByName: submittedBy?.usr_name ?? '',
      submittedByRole: submittedByRole?.role_name ?? '',
    },
    totals,
    attachedFiles,
  };
}

function buildRawVersionData(request, items, snapshot) {
  return {
    request: cloneJson(request),
    items: cloneJson(items),
    overview: cloneJson(snapshot.overview),
    totals: cloneJson(snapshot.totals),
    attachedFiles: cloneJson(snapshot.attachedFiles),
    capturedAt: new Date().toISOString(),
  };
}

export async function createVersionSnapshot(db, request, versionNumber, submittedBy, status = 'submitted') {
  const id = db.nextId('budget-request-versions');
  const items = budgetRequestItems(db, request.br_id ?? request.id);
  const submittedByRole = roleForUser(db, submittedBy);
  const snapshot = buildVersionSnapshot(db, request, items, versionNumber, submittedBy, submittedByRole, status);
  const version = {
    id,
    brv_id: id,
    brv_br_id: Number(request.br_id ?? request.id),
    brv_version_number: versionNumber,
    brv_status: status,
    brv_snapshot: snapshot,
    brv_raw_data: buildRawVersionData(request, items, snapshot),
    brv_attached_files: snapshot.attachedFiles,
    brv_submitted_by_id: submittedBy?.id ?? null,
    brv_submitted_by_name: submittedBy?.usr_name ?? null,
    brv_submitted_by_role: submittedByRole?.role_name ?? null,
    brv_created_at: new Date().toISOString(),
  };

  const pdf = await generateBudgetRequestVersionPdf({ version, snapshot });
  version.brv_pdf_url = pdf.pdfUrl;
  version.brv_pdf_path = pdf.pdfPath;
  version.brv_pdf_generated_at = pdf.pdfGeneratedAt;

  db.upsert('budget-request-versions', id, version);
  return version;
}

export function logActivity(db, brId, action, fromStatus, toStatus, actor, comment = null, versionId = null) {
  const id = db.nextId('budget-request-activity-logs');
  const actorRole = roleForUser(db, actor);
  const entry = {
    id,
    bral_id: id,
    bral_br_id: Number(brId),
    bral_version_id: versionId,
    bral_action: action,
    bral_from_status: fromStatus,
    bral_to_status: toStatus,
    bral_actor_id: actor?.id ?? null,
    bral_actor_name: actor?.usr_name ?? null,
    bral_actor_role: actorRole?.role_name ?? null,
    bral_comment: comment ?? null,
    bral_created_at: new Date().toISOString(),
  };
  db.upsert('budget-request-activity-logs', id, entry);
  return entry;
}

export function getVersionsForRequest(db, brId) {
  return db.rows('budget-request-versions')
    .filter((v) => Number(v.brv_br_id) === Number(brId))
    .sort((a, b) => a.brv_version_number - b.brv_version_number);
}

export function getActivityForRequest(db, brId) {
  return db.rows('budget-request-activity-logs')
    .filter((log) => Number(log.bral_br_id) === Number(brId))
    .sort((a, b) => new Date(a.bral_created_at) - new Date(b.bral_created_at));
}

export function nextVersionNumber(db, brId) {
  const versions = getVersionsForRequest(db, brId);
  return versions.length > 0 ? Math.max(...versions.map((v) => v.brv_version_number)) + 1 : 1;
}
