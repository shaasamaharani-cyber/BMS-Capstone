export function json(res, status, payload) {
  res.writeHead(status, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'Content-Type': 'application/json',
  });
  res.end(JSON.stringify(payload));
}

export async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);

  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return {};

  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function paginate(items, params) {
  const page = Number(params.get('page') || 1);
  const perPage = Number(params.get('per_page') || items.length || 10);
  const start = (page - 1) * perPage;
  const data = items.slice(start, start + perPage);

  return {
    data,
    meta: {
      current_page: page,
      per_page: perPage,
      total: items.length,
      last_page: Math.ceil(items.length / perPage) || 1,
    },
  };
}
