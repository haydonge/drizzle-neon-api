import type { Config } from 'drizzle-kit';

export default {
    dialect: "postgresql", // "mysql" | "sqlite" | "postgresql"  我自己加的
    schema: './src/db/schema.ts',
    out: './drizzle',
  } satisfies Config;
  