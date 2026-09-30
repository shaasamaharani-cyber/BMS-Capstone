import { activeFilter } from '../utils.mjs';

function resourceList(db, resource, params, activeKey = null) {
  const items = activeKey
    ? activeFilter(db.rows(resource), params, activeKey)
    : db.rows(resource);
  return { data: items };
}

function nonPastFiscalYears(rows = []) {
  const currentYear = new Date().getFullYear();
  return rows.filter((item) => Number(item?.fy_year) >= currentYear);
}

export async function handleReferenceData(ctx) {
  const { db, json, path, req, res, url } = ctx;

  if (req.method !== 'GET') return false;

  if (path === '/budget-categories') {
    json(res, 200, resourceList(db, 'budget-categories', url.searchParams, 'bcat_is_active'));
    return true;
  }

  if (path === '/fiscal-years') {
    const list = resourceList(db, 'fiscal-years', url.searchParams, 'fy_is_active');
    json(res, 200, { data: nonPastFiscalYears(list.data) });
    return true;
  }

  if (path === '/planning-periods') {
    json(res, 200, resourceList(db, 'planning-periods', url.searchParams, 'pp_is_active'));
    return true;
  }

  if (path === '/requesting-units') {
    json(res, 200, resourceList(db, 'requesting-units', url.searchParams, 'ru_is_active'));
    return true;
  }

  if (path === '/approval-workflow-stages') {
    json(res, 200, resourceList(db, 'approval-workflow-stages', url.searchParams, 'aws_is_active'));
    return true;
  }

  return false;
}
