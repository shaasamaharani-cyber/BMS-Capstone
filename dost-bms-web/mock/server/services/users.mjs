export function roleForUser(db, user) {
  if (!user) return null;

  const roleId = user.usr_role_id ?? user.role?.role_id;
  const role = db.rows('roles')
    .find((row) => Number(row.role_id ?? row.id) === Number(roleId));

  return role ?? user.role ?? null;
}

export function requestingUnitForUser(db, user) {
  if (!user) return null;

  const intUnitId = user.usr_requesting_unit_id;
  if (intUnitId == null || intUnitId === '') {
    return null;
  }

  return db.rows('requesting-units')
    .find((row) => Number(row.ru_id) === Number(intUnitId)) ?? null;
}

export function isRequesterUser(user) {
  return String(user?.role?.role_group || '').toLowerCase() === 'requester';
}

export function requestingUnitIdForUser(user) {
  const rawUnitId = user?.usr_requesting_unit_id ?? user?.requesting_unit?.ru_id;
  if (rawUnitId == null || rawUnitId === '') {
    return null;
  }

  const intUnitId = Number(rawUnitId);
  if (!Number.isFinite(intUnitId) || intUnitId <= 0) {
    return null;
  }

  return intUnitId;
}

export function canRequesterAccessBudgetRequest(actor, request) {
  if (!isRequesterUser(actor)) {
    return true;
  }

  const intActorUnitId = requestingUnitIdForUser(actor);
  if (intActorUnitId == null) {
    return true;
  }

  return Number(request?.br_requesting_unit_id) === intActorUnitId;
}

export function withUserRelations(db, user) {
  if (!user) return null;

  const role = roleForUser(db, user);
  const unit = requestingUnitForUser(db, user);

  return {
    ...user,
    usr_role_id: user.usr_role_id ?? role?.role_id ?? null,
    usr_requesting_unit_id: user.usr_requesting_unit_id ?? null,
    role,
    requesting_unit: unit
      ? {
        ru_id: unit.ru_id,
        ru_name: unit.ru_name,
        agency: unit.agency ?? unit.ru_name,
      }
      : null,
  };
}

export function normalizeUserForStorage(user) {
  const role = user?.role;
  const normalized = { ...(user ?? {}) };
  delete normalized.role;
  delete normalized.requesting_unit;
  const roleId = normalized.usr_role_id ?? role?.role_id ?? null;

  return {
    ...normalized,
    usr_role_id: roleId,
  };
}
