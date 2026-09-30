import { withBudgetRequestRelations } from '../services/budgetRequests.mjs';
import { sortItems } from '../utils.mjs';

const REVIEW_STATUSES = ['submitted', 'pending', 'reviewed', 'rejected'];

export async function handleBudgetReview(ctx) {
  const { db, json, paginate, path, req, res, url } = ctx;

  if (req.method !== 'GET' || path !== '/budget-review') return false;

  let rows = db.rows('budget-requests')
    .filter((item) => REVIEW_STATUSES.includes(String(item.br_status).toLowerCase()))
    .map((item) => withBudgetRequestRelations(db, item));

  const title = url.searchParams.get('title');
  if (title) {
    rows = rows.filter((item) => String(item.br_title || '').toLowerCase().includes(title.toLowerCase()));
  }

  const unitId = url.searchParams.get('requesting_unit_id');
  if (unitId) {
    rows = rows.filter((item) => String(item.br_requesting_unit_id) === unitId);
  }

  const fiscalYearId = url.searchParams.get('fiscal_year_id');
  if (fiscalYearId) {
    rows = rows.filter((item) => String(item.br_fiscal_year_id) === fiscalYearId);
  }

  rows = sortItems(rows, url.searchParams, {
    title: (item) => item.br_title,
    unit: (item) => item.requesting_unit?.ru_name,
    fiscalYear: (item) => item.fiscal_year?.fy_year,
    status: (item) => item.br_status,
    lastUpdated: (item) => item.br_updated_at || item.br_created_at,
  });

  json(res, 200, paginate(rows, url.searchParams));
  return true;
}
