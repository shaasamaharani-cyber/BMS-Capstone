/**
 * System Name: Budget Management System
 * Module Name: Forms Module
 *
 * Purpose of this file:
 * Provide helper functions and utility methods for seed_default_schemas.
 *
 * Author(s): QUT Group 27
 *
 * Copyright (C) 2026
 * by the Department of Science and Technology - Central Office
 * Developed by Team 27, Queensland University of Technology
 * All rights reserved.
 */

import { createSchema, deleteSchema, fetchAllSchemas, updateSchema } from '../../api/forms_api';
import { DEFAULT_FORM_SCHEMAS } from '../schemas/default_schemas';
import { toSchemaRecord } from './form_object';

let seedPromise = null;
const DEPRECATED_DEFAULT_SCHEMA_IDS = ['rdc-summary', 'program-budget-matrix'];

export function seedDefaultSchemas() {
  if (seedPromise) return seedPromise;

  seedPromise = (async () => {
    const existing = await fetchAllSchemas();
    const existingIds = existing.map((schema) => schema.id);

    for (const schema of DEFAULT_FORM_SCHEMAS) {
      const record = toSchemaRecord(schema);
      if (!existingIds.includes(schema.id)) {
        await createSchema(record);
      } else {
        // Fill the old empty Form B placeholder without replacing an institution's
        // customised layout or changing any saved entry data.
        const saved = existing.find((row) => row.id === schema.id);
        const savedSchema = saved?.schema || saved;
        if (schema.official && (savedSchema?.sections?.length || savedSchema?.headerFields?.length)) continue;
        await updateSchema(schema.id, record);
      }
    }

    for (const schemaId of DEPRECATED_DEFAULT_SCHEMA_IDS) {
      if (existingIds.includes(schemaId)) {
        await deleteSchema(schemaId).catch(() => {});
      }
    }
  })();

  return seedPromise;
}
