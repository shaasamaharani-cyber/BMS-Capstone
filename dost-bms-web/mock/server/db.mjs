import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { DatabaseSync } from 'node:sqlite';

export function createDocumentDb({ sqlitePath, seedPath, seedScriptPath }) {
  if (!existsSync(sqlitePath)) {
    const seeded = spawnSync(process.execPath, ['--no-warnings', seedScriptPath], {
      stdio: 'inherit',
    });
    if (seeded.status !== 0) process.exit(seeded.status ?? 1);
  }

  const sqlite = new DatabaseSync(sqlitePath);
  const selectStmt = sqlite.prepare('SELECT data FROM documents WHERE resource = ? ORDER BY CAST(id AS INTEGER), id');
  const findStmt = sqlite.prepare('SELECT data FROM documents WHERE resource = ? AND id = ?');
  const upsertStmt = sqlite.prepare(`
    INSERT INTO documents (resource, id, data)
    VALUES (?, ?, ?)
    ON CONFLICT(resource, id) DO UPDATE SET data = excluded.data
  `);
  const deleteStmt = sqlite.prepare('DELETE FROM documents WHERE resource = ? AND id = ?');

  const api = {
    rows(resource) {
      return selectStmt.all(resource).map((row) => JSON.parse(row.data));
    },

    find(resource, id) {
      const row = findStmt.get(resource, String(id));
      return row ? JSON.parse(row.data) : null;
    },

    upsert(resource, id, data) {
      upsertStmt.run(resource, String(id), JSON.stringify(data));
      return data;
    },

    remove(resource, id) {
      deleteStmt.run(resource, String(id));
    },

    removeWhere(resource, predicate) {
      api.rows(resource).forEach((row) => {
        if (predicate(row)) api.remove(resource, row.id);
      });
    },

    nextId(resource) {
      const ids = api.rows(resource)
        .map((row) => Number(row.id))
        .filter(Number.isFinite);
      return ids.length > 0 ? Math.max(...ids) + 1 : 1;
    },

    ensureMissingSeedResources() {
      const seed = JSON.parse(readFileSync(seedPath, 'utf8'));

      Object.entries(seed).forEach(([resource, value]) => {
        if (api.rows(resource).length > 0) return;

        const seededRows = Array.isArray(value) ? value : [value];
        seededRows.forEach((row, index) => {
          const id = row?.id ?? row?.[`${resource.replace(/-/g, '_')}_id`] ?? index + 1;
          api.upsert(resource, id, row);
        });
      });
    },
  };

  api.ensureMissingSeedResources();

  return api;
}
