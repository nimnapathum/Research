// Load shared local configuration without forwarding Node env-file flags to Next workers.
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const envPath = fileURLToPath(new URL('../.env', import.meta.url));
if (existsSync(envPath)) process.loadEnvFile(envPath);
await import('../node_modules/next/dist/bin/next');
