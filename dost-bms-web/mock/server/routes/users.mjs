import { normalizeUserForStorage, withUserRelations } from '../services/users.mjs';

export async function handleUsers(ctx) {
  const { db, json, paginate, parts, req, res, url, payload } = ctx;

  if (parts[0] !== 'users') return false;

  if (req.method === 'GET' && parts.length === 1) {
    json(res, 200, paginate(db.rows('users').map((user) => withUserRelations(db, user)), url.searchParams));
    return true;
  }

  if (req.method === 'POST' && parts.length === 1) {
    const id = db.nextId('users');
    const user = db.upsert('users', id, normalizeUserForStorage({ id, usr_id: id, usr_is_active: 1, ...payload }));
    json(res, 201, {
      data: withUserRelations(db, user),
    });
    return true;
  }

  const id = parts[1];
  if (!id) return false;

  if (parts[2] === 'activate' || parts[2] === 'deactivate') {
    json(res, 200, { message: parts[2] });
    return true;
  }

  if (req.method === 'GET') {
    json(res, 200, { data: withUserRelations(db, db.find('users', id)) });
    return true;
  }

  if (req.method === 'PUT') {
    const user = db.upsert('users', id, normalizeUserForStorage({ ...db.find('users', id), ...payload }));
    json(res, 200, { data: withUserRelations(db, user) });
    return true;
  }

  if (req.method === 'DELETE') {
    db.remove('users', id);
    json(res, 200, { message: 'Deleted' });
    return true;
  }

  return false;
}
