import { permissionsForUser } from './auth.mjs';
import { buildDashboardData } from '../services/dashboard.mjs';
import { resolveRequestActor } from '../services/requestActor.mjs';
import { isRequesterUser, requestingUnitIdForUser } from '../services/users.mjs';

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

  // A requester only ever sees their own unit, whatever filter the browser sends
  const objActor = resolveRequestActor(db, req);
  // Least privilege: an administrator without full access (technical administrator) sees no amounts
  if (String(objActor?.role?.role_group || '').toLowerCase() === 'admin' && !permissionsForUser(objActor).includes('route:budget-review')) {
    json(res, 403, { message: 'Unauthorized. Insufficient permissions.' });
    return true;
  }
  const intActorUnitId = isRequesterUser(objActor) ? requestingUnitIdForUser(objActor) : null;
  if (intActorUnitId != null) objFilters.requestingUnitId = String(intActorUnitId);

  json(res, 200, { data: buildDashboardData(db, objFilters) });
  return true;
}
