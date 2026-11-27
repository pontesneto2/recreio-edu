import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { OPENAPI_SNAPSHOT_URL, openApiDocument } from '../openapi.ts';
import { serializeOpenApi } from '../shared/openapi/document.ts';

await writeFile(OPENAPI_SNAPSHOT_URL, serializeOpenApi(openApiDocument));
console.log(`OpenAPI gravado em ${fileURLToPath(OPENAPI_SNAPSHOT_URL)}`);
