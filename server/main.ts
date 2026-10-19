import { fileURLToPath } from 'node:url';
import { buildApp } from './app.ts';

const app = await buildApp({
  dbPath: process.env.DB_PATH ?? ':memory:',
  testHooks: process.env.TEST_HOOKS === '1',
  clientDir: process.env.CLIENT_DIR ?? fileURLToPath(new URL('../dist/web', import.meta.url)),
});

await app.listen({ host: process.env.HOST ?? '0.0.0.0', port: Number(process.env.PORT ?? 3000) });
console.log(`listening on :${process.env.PORT ?? 3000}, test hooks ${process.env.TEST_HOOKS === '1' ? 'on' : 'off'}`);
