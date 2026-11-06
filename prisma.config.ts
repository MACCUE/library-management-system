import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'api/prisma/schema.prisma',
  migrations: {
    path: 'api/prisma/migrations',
    seed: 'node --experimental-strip-types api/prisma/seed.ts',
  },
});