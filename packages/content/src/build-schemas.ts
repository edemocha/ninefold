import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { allSchemas } from './schema';

const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'schema');
mkdirSync(out, { recursive: true });
for (const [name, schema] of Object.entries(allSchemas())) {
  writeFileSync(join(out, `${name}.schema.json`), `${JSON.stringify(schema, null, 2)}\n`);
}
console.log(`Wrote ${Object.keys(allSchemas()).length} schemas to ${out}`);
