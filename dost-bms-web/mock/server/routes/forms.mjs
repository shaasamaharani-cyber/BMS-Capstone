import { randomUUID } from 'node:crypto';
import { generateFormEntryPdf } from '../services/formEntryPdf.mjs';
import { sortItems } from '../utils.mjs';

function listRows(db, resource, params) {
  let rows = db.rows(resource);

  if (resource === 'form_entries') {
    const schemaId = params.get('schemaId');
    if (schemaId) rows = rows.filter((row) => String(row.schemaId) === schemaId);
  }

  const search = params.get('search');
  if (search) {
    rows = rows.filter((row) => JSON.stringify(row).toLowerCase().includes(search.toLowerCase()));
  }

  return sortItems(rows, params, {
    id: (row) => row.id,
    name: (row) => row.name || row.header?.department || row.header?.agency || row.header?.year || row.id,
    status: (row) => row.status,
    updatedAt: (row) => row.updatedAt || row.createdAt,
  });
}

export async function handleForms(ctx) {
  const { db, json, parts, req, res, url, payload } = ctx;
  const resource = parts[0];

  if (!['form_schemas', 'form_entries'].includes(resource)) return false;

  if (req.method === 'GET' && parts.length === 1) {
    json(res, 200, ctx.paginate(listRows(db, resource, url.searchParams), url.searchParams));
    return true;
  }

  if (req.method === 'POST' && parts.length === 1) {
    const id = payload.id || randomUUID();
    const now = new Date().toISOString();
    const baseRecord = {
      ...payload,
      id,
      createdAt: payload.createdAt || now,
      updatedAt: payload.updatedAt || now,
    };
    const record = resource === 'form_entries'
      ? await generateFormEntryPdf({
        entry: baseRecord,
        schemaRecord: db.find('form_schemas', baseRecord.schemaId),
      })
      : baseRecord;

    json(res, 201, {
      data: db.upsert(resource, id, record),
    });
    return true;
  }

  const id = parts[1];
  const existing = id ? db.find(resource, id) : null;

  if (!existing) {
    json(res, 404, { message: `${resource} record not found` });
    return true;
  }

  if (req.method === 'GET') {
    json(res, 200, { data: existing });
    return true;
  }

  if (req.method === 'PUT' || req.method === 'PATCH') {
    const baseRecord = {
      ...existing,
      ...payload,
      id,
      updatedAt: payload.updatedAt || new Date().toISOString(),
    };
    const record = resource === 'form_entries'
      ? await generateFormEntryPdf({
        entry: baseRecord,
        schemaRecord: db.find('form_schemas', baseRecord.schemaId),
      })
      : baseRecord;

    json(res, 200, {
      data: db.upsert(resource, id, record),
    });
    return true;
  }

  if (req.method === 'DELETE') {
    db.remove(resource, id);
    json(res, 200, { message: 'Deleted' });
    return true;
  }

  return false;
}
