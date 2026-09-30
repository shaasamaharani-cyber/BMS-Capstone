import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const resource = process.argv[2];

if (!resource) {
  console.error('Usage: npm run mock:sync -- <resource-name>');
  process.exit(1);
}

const dbJsonPath = resolve('mock/db.json');
const sqlitePath = resolve('mock/mock.sqlite');
const seed = JSON.parse(await readFile(dbJsonPath, 'utf8'));
const rows = seed[resource];

if (!Array.isArray(rows)) {
  console.error(`Resource "${resource}" was not found as an array in ${dbJsonPath}`);
  process.exit(1);
}

const db = new DatabaseSync(sqlitePath);
const deleteResource = db.prepare('DELETE FROM documents WHERE resource = ?');
const insert = db.prepare('INSERT INTO documents (resource, id, data) VALUES (?, ?, ?)');

db.exec('BEGIN');
try {
  deleteResource.run(resource);
  rows.forEach((row, index) => {
    const id = row?.id ?? row?.[`${resource.replace(/-/g, '_')}_id`] ?? index + 1;
    insert.run(resource, String(id), JSON.stringify(row));
  });
  db.exec('COMMIT');
} catch (error) {
  db.exec('ROLLBACK');
  throw error;
} finally {
  db.close();
}

console.log(`Synced ${rows.length} "${resource}" records into ${sqlitePath}`);
