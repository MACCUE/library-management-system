import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'prisma/config';

const apiEnvPath = fileURLToPath(new URL('./api/.env', import.meta.url));
if (existsSync(apiEnvPath)) {
  process.loadEnvFile(apiEnvPath);
}

export default defineConfig({
  schema: 'api/prisma/schema.prisma',
  migrations: {
    path: 'api/prisma/migrations',
    seed: 'node --experimental-strip-types api/prisma/seed.ts',
  },
});