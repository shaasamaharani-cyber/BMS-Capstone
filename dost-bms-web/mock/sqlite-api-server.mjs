import http from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { extname, resolve } from 'node:path';
import { createDocumentDb } from './server/db.mjs';
import { json, paginate, readJsonBody } from './server/http.mjs';
import { handleAuth } from './server/routes/auth.mjs';
import { handleReferenceData } from './server/routes/referenceData.mjs';
import { handleUnifiedBudgets } from './server/routes/unifiedBudgets.mjs';
import { handleUsers } from './server/routes/users.mjs';
import { handleBudgetReview } from './server/routes/budgetReview.mjs';
import { handleBudgetRequests } from './server/routes/budgetRequests.mjs';
import { handleDashboard } from './server/routes/dashboard.mjs';
import { handleForms } from './server/routes/forms.mjs';
import { handleSpendingReports } from './server/routes/spendingReports.mjs';

// On a hosting service PORT is set for us and the server must listen on every interface
const HOST = process.env.MOCK_API_HOST || (process.env.PORT ? '0.0.0.0' : '127.0.0.1');
const PORT = Number(process.env.MOCK_API_PORT || process.env.PORT || 4000);
const API_PREFIX = '/api/v1';
const SQLITE_PATH = resolve('mock/mock.sqlite');
const GENERATED_ROOT = resolve('mock/generated');
// Demo hosting only: when set (for example "dist"), this server also serves the built web app
const STATIC_ROOT = process.env.MOCK_SERVE_STATIC ? resolve(process.env.MOCK_SERVE_STATIC) : null;

const db = createDocumentDb({
  sqlitePath: SQLITE_PATH,
  seedPath: resolve('mock/db.json'),
  seedScriptPath: 'mock/seed-sqlite.mjs',
});

const routes = [
  handleAuth,
  handleReferenceData,
  handleUnifiedBudgets,
  handleUsers,
  handleBudgetReview,
  handleBudgetRequests,
  handleDashboard,
  handleForms,
  handleSpendingReports,
];

const MIME_TYPES = {
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
};

async function serveGeneratedFile(req, res, pathname) {
  if (!['GET', 'HEAD'].includes(req.method) || !pathname.startsWith('/generated/')) {
    return false;
  }

  // Decode percent-encoding and split into segments to detect path traversal
  // without relying on path.resolve() + startsWith(), which is unreliable on
  // macOS because /Users is a symlink to /private/Users — the two strings
  // never match even though they point to the same directory.
  let decodedPath;
  try {
    decodedPath = decodeURIComponent(pathname);
  } catch {
    json(res, 400, { message: 'Bad Request' });
    return true;
  }

  const segments = decodedPath.split('/').filter(Boolean); // removes empty strings
  if (segments.some((seg) => seg === '..' || seg === '.')) {
    json(res, 403, { message: 'Forbidden' });
    return true;
  }

  const relativePath = segments.slice(1).join('/'); // drop 'generated' prefix
  const filePath = resolve(GENERATED_ROOT, relativePath);

  try {
    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) {
      json(res, 404, { message: 'Generated file not found' });
      return true;
    }

    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Content-Type': MIME_TYPES[extname(filePath).toLowerCase()] || 'application/octet-stream',
      'Content-Length': fileStat.size,
    });
    if (req.method === 'HEAD') {
      res.end();
      return true;
    }
    createReadStream(filePath).pipe(res);
    return true;
  } catch {
    json(res, 404, { message: 'Generated file not found' });
    return true;
  }
}

const STATIC_MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.map': 'application/json',
  ...MIME_TYPES,
};

// Serves the built web app. Page routes without a file extension fall back to index.html so the React router can handle them.
async function serveStaticSite(req, res, pathname) {
  if (!STATIC_ROOT || !['GET', 'HEAD'].includes(req.method) || pathname.startsWith(API_PREFIX) || pathname.startsWith('/generated/')) {
    return false;
  }

  let decodedPath;
  try {
    decodedPath = decodeURIComponent(pathname);
  } catch {
    json(res, 400, { message: 'Bad Request' });
    return true;
  }

  const segments = decodedPath.split('/').filter(Boolean);
  if (segments.some((seg) => seg === '..' || seg === '.' || seg.includes('\\'))) {
    json(res, 403, { message: 'Forbidden' });
    return true;
  }

  let filePath = resolve(STATIC_ROOT, ...segments);
  let fileStat = await stat(filePath).catch(() => null);
  if (!fileStat?.isFile()) {
    if (extname(filePath)) {
      json(res, 404, { message: 'Not found' });
      return true;
    }
    filePath = resolve(STATIC_ROOT, 'index.html');
    fileStat = await stat(filePath).catch(() => null);
    if (!fileStat) {
      json(res, 404, { message: 'Web app is not built (run npm run build)' });
      return true;
    }
  }

  res.writeHead(200, {
    'Content-Type': STATIC_MIME_TYPES[extname(filePath).toLowerCase()] || 'application/octet-stream',
    'Content-Length': fileStat.size,
    // Built asset names contain a content hash, so they can be cached; the page itself must always be re-fetched
    'Cache-Control': filePath.includes(`${resolve(STATIC_ROOT, 'assets')}`) ? 'public, max-age=31536000, immutable' : 'no-cache',
  });
  if (req.method === 'HEAD') {
    res.end();
    return true;
  }
  createReadStream(filePath).pipe(res);
  return true;
}

async function handle(req, res) {
  if (req.method === 'OPTIONS') return json(res, 204, {});

  const url = new URL(req.url, `http://${req.headers.host}`);
  if (await serveGeneratedFile(req, res, url.pathname)) return undefined;
  if (await serveStaticSite(req, res, url.pathname)) return undefined;

  const path = url.pathname.startsWith(API_PREFIX)
    ? url.pathname.slice(API_PREFIX.length)
    : url.pathname;
  const parts = path.split('/').filter(Boolean);
  const payload = ['POST', 'PUT', 'PATCH'].includes(req.method)
    ? await readJsonBody(req)
    : {};

  const ctx = {
    db,
    json,
    paginate,
    parts,
    path,
    payload,
    req,
    res,
    url,
  };

  try {
    for (const route of routes) {
      if (await route(ctx)) return undefined;
    }

    return json(res, 404, { message: `Mock endpoint not found: ${req.method} ${path}` });
  } catch (error) {
    return json(res, 500, { message: error.message || 'Mock server error' });
  }
}

http.createServer(handle).listen(PORT, HOST, () => {
  console.log(`SQLite mock API ready: http://${HOST}:${PORT}${API_PREFIX}`);
  console.log(`SQLite database: ${SQLITE_PATH}`);
});
