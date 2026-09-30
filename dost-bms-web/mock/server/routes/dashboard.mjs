import { buildDashboardData } from '../services/dashboard.mjs';

function normalizeFilterValue(strValue)
{
  if (!strValue) return null;
  return String(strValue).trim();
}

export async function handleDashboard(ctx)
{
  const { db, json, path, req, res, url } = ctx;
  if (req.method !== 'GET') return false;
  if (path !== '/dashboard') return false;

  const objFilters = {
    fiscalYearId: normalizeFilterValue(url.searchParams.get('fiscal_year_id')),
    categoryId: normalizeFilterValue(url.searchParams.get('category_id')),
    requestingUnitId: normalizeFilterValue(url.searchParams.get('requesting_unit_id')),
    period: normalizeFilterValue(url.searchParams.get('period')) || 'annually',
    budgetStatus: normalizeFilterValue(url.searchParams.get('budget_status')) || 'all',
  };

  json(res, 200, { data: buildDashboardData(db, objFilters) });
  return true;
}
