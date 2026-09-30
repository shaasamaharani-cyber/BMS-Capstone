import { withUserRelations } from '../services/users.mjs';

const TOKEN_PREFIX = 'mock-token-uid-';

const ROLE_PERMISSIONS = {
  admin:     ['route:dashboard', 'route:forms', 'route:settings'],
  reviewer:  ['route:dashboard', 'route:budget-review', 'route:budget-tracking', 'route:reports', 'route:forms'],
  requester: ['route:dashboard', 'route:budget-requests', 'route:forms'],
  executive: ['route:dashboard', 'route:budget-consolidation', 'route:budget-tracking', 'route:reports', 'route:forms'],
};

const ALL_PERMISSIONS = [
  'route:dashboard',
  'route:budget-requests',
  'route:budget-review',
  'route:budget-consolidation',
  'route:budget-tracking',
  'route:reports',
  'route:forms',
  'route:settings',
];

const FULL_ACCESS_EMAILS = new Set([
  'main.admin@dost.gov.ph',
]);

function tokenToId(token) {
  return token?.startsWith(TOKEN_PREFIX) ? token.slice(TOKEN_PREFIX.length) : null;
}

function permissionsForUser(user) {
  const email = String(user?.usr_email || user?.email || '').toLowerCase().trim();

  if (FULL_ACCESS_EMAILS.has(email)) {
    return ALL_PERMISSIONS;
  }

  const group = String(user?.role?.role_group || '').toLowerCase();
  return ROLE_PERMISSIONS[group] || [];
}

export async function handleAuth(ctx) {
  const { db, json, path, req, res, payload } = ctx;

  if (req.method === 'POST' && path === '/auth/login') {
    const users = db.rows('users');
    const email = String(payload?.email || payload?.usr_email || '').toLowerCase().trim();
    const user = withUserRelations(db, (email ? users.find((u) => String(u.usr_email || '').toLowerCase() === email) : null)
      ?? users[0]);
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
    const user = withUserRelations(db, (uid ? db.find('users', uid) : null) ?? db.rows('users')[0]);
    json(res, 200, { data: user });
    return true;
  }

  return false;
}
