import { mkdir, readFile, rm } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { DEFAULT_FORM_SCHEMAS } from '../src/forms/schemas/default_schemas.js';
import { createBlankEntry, toSchemaRecord } from '../src/forms/utils/form_object.js';
import { generateFormEntryPdf } from './server/services/formEntryPdf.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbJsonPath = resolve(__dirname, 'db.json');
const sqlitePath = resolve(__dirname, 'mock.sqlite');

await mkdir(__dirname, { recursive: true });
await Promise.all([
  rm(sqlitePath, { force: true }),
  rm(`${sqlitePath}-wal`, { force: true }),
  rm(`${sqlitePath}-shm`, { force: true }),
]);

const seed = JSON.parse(await readFile(dbJsonPath, 'utf8'));
const formSchemas = DEFAULT_FORM_SCHEMAS.map(toSchemaRecord);

async function buildSeedFormEntries() {
  const schemaById = new Map(formSchemas.map((schema) => [schema.id, schema]));
  const bpFormB = {
    ...createBlankEntry(DEFAULT_FORM_SCHEMAS.find((schema) => schema.id === 'bp-form-b') ?? { sections: [] }),
    id: 'seed-bp-form-b-entry',
    header: {
      department: 'Department of Science and Technology',
      agency: 'DOST Central Office',
      fundSource: 'GAA',
    },
    sections: {
      requirements: [
        {
          id: 'seed-bp-form-b-requirement-1',
          level: 1,
          style: 'normal',
          name: 'Budget management system enhancement',
          quantity: 1,
          unitCost: 1500000,
          total: 1500000,
          remarks: 'Seed sample form entry',
        },
      ],
    },
    createdAt: '2026-05-09T00:00:00.000Z',
    updatedAt: '2026-05-09T00:00:00.000Z',
  };
  const matrix = {
    ...createBlankEntry(DEFAULT_FORM_SCHEMAS.find((schema) => schema.id === 'program-budget-matrix') ?? { sections: [] }),
    id: 'seed-program-budget-matrix-entry',
    header: {
      programCycle: '2027 Total Proposed Program',
      tier: 'Tier 1',
      department: 'Department of Science and Technology',
      agency: 'DOST Central Office',
      operatingUnit: 'Planning and Evaluation Service',
    },
    createdAt: '2026-05-09T00:00:00.000Z',
    updatedAt: '2026-05-09T00:00:00.000Z',
  };

  return Promise.all([
    generateFormEntryPdf({ entry: bpFormB, schemaRecord: schemaById.get(bpFormB.schemaId) }),
    generateFormEntryPdf({ entry: matrix, schemaRecord: schemaById.get(matrix.schemaId) }),
  ]);
}

if (!Array.isArray(seed.form_schemas) || seed.form_schemas.length === 0) {
  seed.form_schemas = formSchemas;
}

if (!Array.isArray(seed.form_entries) || seed.form_entries.length === 0) {
  seed.form_entries = await buildSeedFormEntries();
}

const sampleAttachment = seed.form_entries[0]
  ? {
    schemaId: seed.form_entries[0].schemaId,
    schemaName: formSchemas.find((schema) => schema.id === seed.form_entries[0].schemaId)?.name || seed.form_entries[0].schemaId,
    entryId: seed.form_entries[0].id,
    entryLabel: seed.form_entries[0].header?.department || seed.form_entries[0].header?.agency || seed.form_entries[0].id,
    pdfUrl: seed.form_entries[0].pdfUrl || '',
    pdfGeneratedAt: seed.form_entries[0].pdfGeneratedAt || '',
  }
  : null;

if (sampleAttachment && Array.isArray(seed['budget-requests']) && seed['budget-requests'][0]) {
  seed['budget-requests'][0] = {
    ...seed['budget-requests'][0],
    br_form_entries: [sampleAttachment],
    br_form_schema_id: sampleAttachment.schemaId,
    br_form_entry_id: sampleAttachment.entryId,
  };
}
const db = new DatabaseSync(sqlitePath);

db.exec(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE documents (
    resource TEXT NOT NULL,
    id TEXT NOT NULL,
    data TEXT NOT NULL,
    PRIMARY KEY (resource, id)
  );
`);

const insert = db.prepare('INSERT INTO documents (resource, id, data) VALUES (?, ?, ?)');

for (const [resource, rows] of Object.entries(seed)) {
  const arrRows = Array.isArray(rows) ? rows : [rows];
  arrRows.forEach((row, index) => {
    const id = row?.id ?? row?.[`${resource.replace(/-/g, '_')}_id`] ?? index + 1;
    insert.run(resource, String(id), JSON.stringify(row));
  });
}

db.close();
console.log(`Seeded SQLite mock database: ${sqlitePath}`);
