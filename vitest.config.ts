import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.ts'],
  },
  resolve: {
    alias: [
      {
        find: /^@\/public\/(.*)/,
        replacement: `${root}/public/$1`,
      },
      {
        find: /^@\/prisma\/(.*)/,
        replacement: `${root}/src/generated/prisma/$1`,
      },
      {
        find: /^@\/(.*)/,
        replacement: `${root}/src/$1`,
      },
    ],
  },
});
