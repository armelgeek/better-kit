import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'sqlite',
  schema: './lib/schema/drizzle.ts',
  out: './drizzle',
  dbCredentials: {
    url: './drizzle-demo.db',
  },
});
