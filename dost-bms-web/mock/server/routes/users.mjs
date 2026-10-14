import { normalizeUserForStorage, withUserRelations } from '../services/users.mjs';
import { resolveRequestActor } from '../services/requestActor.mjs';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const roleGroupOf = (db, intRoleId) => String(db.rows('roles')
  .find((row) => Number(row.role_id ?? row.id) === Number(intRoleId))?.role_group || '').toLowerCase();

const isActiveAdmin = (db, user) => Number(user.usr_is_active) !== 0 && roleGroupOf(db, user.usr_role_id) === 'admin';

// Checks a new or edited account; returns a message for the first problem, or null
function validateUser(db, objUser, intOwnId = null) {
  if (!String(objUser.usr_fname || '').trim() || !String(objUser.usr_lname || '').trim()) return 'First and last name are required.';
  if (String(objUser.usr_fname).length > 100 || String(objUser.usr_lname).length > 100) return 'Names can be at most 100 characters.';
  if (!EMAIL_PATTERN.test(objUser.usr_email)) return 'Enter a valid email address.';
  const blnTaken = db.rows('users').some((row) => String(row.usr_email || '').toLowerCase() === objUser.usr_email
    && Number(row.usr_id ?? row.id) !== Number(intOwnId));
  if (blnTaken) return 'Another account already uses this email.';
  if (!roleGroupOf(db, objUser.usr_role_id)) return 'Choose a role.';
  if (roleGroupOf(db, objUser.usr_role_id) === 'requester') {
    const blnUnit = db.rows('requesting-units').some((row) => Number(row.ru_id) === Number(objUser.usr_requesting_unit_id));
    if (!blnUnit) return 'A requester must belong to a requesting unit.';
  }
  return null;
}

function logUserChange(db, actor, user, strAction, strDetails = '') {
  const id = db.nextId('user-change-logs');
  db.upsert('user-change-logs', id, {
    id,
    ucl_user_id: Number(user.usr_id ?? user.id),
    ucl_user_name: user.usr_name,
    ucl_action: strAction,
    ucl_details: strDetails,
    ucl_actor_name: actor?.usr_name ?? null,
    ucl_created_at: new Date().toISOString(),
  });
}

// Only the editable fields, cleaned; names are joined for display like the seeded accounts
function pickUserFields(db, payload, existing = {}) {
  const objUser = {
    ...existing,
    usr_fname: String(payload.usr_fname ?? existing.usr_fname ?? '').trim(),
    usr_lname: String(payload.usr_lname ?? existing.usr_lname ?? '').trim(),
    usr_email: String(payload.usr_email ?? existing.usr_email ?? '').toLowerCase().trim(),
    usr_role_id: Number(payload.usr_role_id ?? existing.usr_role_id) || null,
  };
  objUser.usr_name = `${objUser.usr_fname} ${objUser.usr_lname}`.trim();
  objUser.usr_requesting_unit_id = roleGroupOf(db, objUser.usr_role_id) === 'requester'
    ? (Number(payload.usr_requesting_unit_id ?? existing.usr_requesting_unit_id) || null)
    : null;
  return objUser;
}

export async function handleUsers(ctx) {
  const { db, json, paginate, parts, req, res, url, payload } = ctx;

  if (parts[0] !== 'users') return false;

  // Account administration is the administrators' job only (Security Standard 6.15, 6.24)
  const actor = resolveRequestActor(db, req);
  if (String(actor?.role?.role_group || '').toLowerCase() !== 'admin') {
    json(res, 403, { message: 'Unauthorized. Insufficient permissions.' });
    return true;
  }

  if (req.method === 'GET' && parts.length === 1) {
    json(res, 200, paginate(db.rows('users').map((user) => withUserRelations(db, user)), url.searchParams));
    return true;
  }

  if (req.method === 'GET' && parts[1] === 'changes') {
    const arrChanges = db.rows('user-change-logs')
      .sort((a, b) => String(b.ucl_created_at).localeCompare(String(a.ucl_created_at)))
      .slice(0, 20);
    json(res, 200, { data: arrChanges });
    return true;
  }

  if (req.method === 'POST' && parts.length === 1) {
    const objUser = pickUserFields(db, payload);
    const strError = validateUser(db, objUser);
    if (strError) {
      json(res, 422, { message: strError });
      return true;
    }
    const id = db.nextId('users');
    const user = db.upsert('users', id, normalizeUserForStorage({ ...objUser, id, usr_id: id, usr_is_active: 1 }));
    logUserChange(db, actor, user, 'created', `Role: ${withUserRelations(db, user).role?.role_name}`);
    json(res, 201, { data: withUserRelations(db, user) });
    return true;
  }

  const id = parts[1];
  const existing = id ? db.find('users', id) : null;
  if (!existing) {
    json(res, 404, { message: 'User not found' });
    return true;
  }
  const blnSelf = Number(existing.usr_id ?? existing.id) === Number(actor.usr_id ?? actor.id);

  if (req.method === 'POST' && (parts[2] === 'activate' || parts[2] === 'deactivate')) {
    const blnActivate = parts[2] === 'activate';
    if (!blnActivate && blnSelf) {
      json(res, 422, { message: 'You cannot deactivate your own account.' });
      return true;
    }
    if (!blnActivate && isActiveAdmin(db, existing)
      && db.rows('users').filter((row) => isActiveAdmin(db, row)).length <= 1) {
      json(res, 422, { message: 'At least one active administrator is needed.' });
      return true;
    }
    const user = db.upsert('users', id, { ...existing, usr_is_active: blnActivate ? 1 : 0 });
    logUserChange(db, actor, user, blnActivate ? 'activated' : 'deactivated');
    json(res, 200, { data: withUserRelations(db, user) });
    return true;
  }

  if (req.method === 'GET') {
    json(res, 200, { data: withUserRelations(db, existing) });
    return true;
  }

  if (req.method === 'PUT') {
    const objUser = pickUserFields(db, payload, existing);
    if (blnSelf && Number(objUser.usr_role_id) !== Number(existing.usr_role_id)) {
      json(res, 422, { message: 'You cannot change your own role.' });
      return true;
    }
    const strError = validateUser(db, objUser, existing.usr_id ?? existing.id);
    if (strError) {
      json(res, 422, { message: strError });
      return true;
    }
    if (isActiveAdmin(db, existing) && roleGroupOf(db, objUser.usr_role_id) !== 'admin'
      && db.rows('users').filter((row) => isActiveAdmin(db, row)).length <= 1) {
      json(res, 422, { message: 'At least one active administrator is needed.' });
      return true;
    }
    // Readable before -> after, with role and unit names instead of ids
    const objLabel = {
      usr_name: ['name', (value) => value],
      usr_email: ['email', (value) => value],
      usr_role_id: ['role', (value) => db.rows('roles').find((row) => Number(row.role_id ?? row.id) === Number(value))?.role_name],
      usr_requesting_unit_id: ['unit', (value) => db.rows('requesting-units').find((row) => Number(row.ru_id) === Number(value))?.ru_name],
    };
    const arrChanged = Object.entries(objLabel)
      .filter(([strField]) => String(existing[strField] ?? '') !== String(objUser[strField] ?? ''))
      .map(([strField, [strName, toText]]) => `${strName}: ${toText(existing[strField]) ?? '-'} -> ${toText(objUser[strField]) ?? '-'}`);
    const user = db.upsert('users', id, normalizeUserForStorage(objUser));
    if (arrChanged.length) logUserChange(db, actor, user, 'updated', arrChanged.join('; '));
    json(res, 200, { data: withUserRelations(db, user) });
    return true;
  }

  if (req.method === 'DELETE') {
    // History must always point to a person, so accounts are deactivated, never deleted
    json(res, 405, { message: 'Accounts are deactivated, not deleted.' });
    return true;
  }

  return false;
}
