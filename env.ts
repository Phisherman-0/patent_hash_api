/**
 * env.ts — MUST be the first import in index.ts
 *
 * ES module `import` statements are resolved (and their side-effects run)
 * in declaration order before any code in the importing file executes.
 * By placing this as the first import, dotenv is guaranteed to populate
 * process.env before any other module (db.ts, etc.) reads from it.
 */
import dotenv from 'dotenv';

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

if (IS_PRODUCTION) {
  dotenv.config({ path: '.env.production' });
} else {
  dotenv.config({ path: '.env' });
}
