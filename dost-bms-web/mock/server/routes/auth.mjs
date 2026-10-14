import { withUserRelations } from '../services/users.mjs';

const TOKEN_PREFIX = 'mock-token-uid-';

const ROLE_PERMISSIONS = {
  // Administrators keep the system running: no budget pages and no peso amounts (least privilege)
  admin:     ['route:dashboard', 'route:users', 'route:budget-cycles', 'route:forms', 'route:settings'],
  reviewer:  ['route:dashboard', 'route:spending-monitoring', 'route:budget-review', 'route:budget-consolidation', 'route:budget-tracking', 'route:reports', 'route:forms'],
  requester: ['route:dashboard', 'route:budget-requests', 'route:spending-monitoring'],
  executive: ['route:dashboard', 'route:spending-monitoring', 'route:budget-consolidation', 'route:budget-tracking', 'route:reports', 'route:forms'],
};

function tokenToId(token) {
  return token?.startsWith(TOKEN_PREFIX) ? token.slice(TOKEN_PREFIX.length) : null;
}

export function permissionsForUser(user) {
  const group = String(user?.role?.role_group || '').toLowerCase();
  return ROLE_PERMISSIONS[group] || [];
}

export async function handleAuth(ctx) {
  const { db, json, path, req, res, payload } = ctx;

  if (req.method === 'POST' && path === '/auth/login') {
    const users = db.rows('users');
    // The login box says "Username", so a bare name like tech.staff means tech.staff@dost.gov.ph
    const typed = String(payload?.email || payload?.usr_email || '').toLowerCase().trim();
    const email = typed && !typed.includes('@') ? `${typed}@dost.gov.ph` : typed;
    const found = email ? users.find((u) => String(u.usr_email || '').toLowerCase() === email) : null;
    // Unknown and deactivated accounts get the same answer (DOST Security Standard 4.10, 6.3)
    if (!found || Number(found.usr_is_active) === 0) {
      json(res, 401, { message: 'Invalid username and/or password.' });
      return true;
    }
    const user = withUserRelations(db, found);
    const token = `${TOKEN_PREFIX}${user.id}`;
    json(res, 200, { token, user, role: user.role, permissions: permissionsForUser(user) });
    return true;
  }

  if (req.method === 'POST' && path === '/auth/logout') {
    json(res, 200, { message: 'Logged out' });
    return true;
  }

  if (req.method === 'GET' && path === '/auth/me') {
    const authHeader = req.headers['authorization'] || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    const uid = tokenToId(token);
    const found = uid ? db.find('users', uid) : null;
    if (!found || Number(found.usr_is_active) === 0) {
      json(res, 401, { message: 'Unauthenticated.' });
      return true;
    }
    json(res, 200, { data: withUserRelations(db, found) });
    return true;
  }

  return false;
}
