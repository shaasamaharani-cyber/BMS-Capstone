/**
 * System Name: DOST Budget Management System
 * Module Name: None
 *
 * Purpose of this file:
 * Resolve the authenticated user performing an API action from Bearer token or payload.
 *
 * Author: None
 *
 * Copyright (C) 2026
 * by the Department of Science and Technology - Central Office
 *
 * All rights reserved.
 */

import { withUserRelations } from './users.mjs';

const TOKEN_PREFIX = 'mock-token-uid-';

function tokenToUserId(strToken) {
  if (!strToken || !strToken.startsWith(TOKEN_PREFIX)) {
    return null;
  }
  return strToken.slice(TOKEN_PREFIX.length);
}

/**
 * @param {object} db
 * @param {import('http').IncomingMessage} req
 * @param {object} [payload]
 * @returns {object|null}
 */
export function resolveRequestActor(db, req, payload = {}) {
  if (payload?.actor_id != null) {
    const objUser = db.find('users', payload.actor_id);
    if (objUser) {
      return withUserRelations(db, objUser);
    }
  }

  const strAuthHeader = String(req?.headers?.authorization || '');
  const strToken = strAuthHeader.replace(/^Bearer\s+/i, '').trim();
  const strUserId = tokenToUserId(strToken);

  if (strUserId) {
    const objUser = db.find('users', strUserId);
    if (objUser) {
      return withUserRelations(db, objUser);
    }
  }

  return null;
}

/**
 * @param {object|null} objUser
 * @returns {string}
 */
export function actorDisplayNameFromUser(objUser) {
  return String(objUser?.usr_name || objUser?.name || '').trim();
}
