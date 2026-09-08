import { createApp } from './app.js';
import { db } from './config/database.js';
import { env } from './config/env.js';

const app = createApp({
  config: { corsOrigin: env.CORS_ORIGIN },
});

const server = app.listen(env.PORT, () => {
  console.log(`API disponível em http://localhost:${env.PORT}`);
});

async function shutdown(signal) {
  console.log(`${signal} recebido. Encerrando servidor...`);
  server.close(async () => {
    await db.end();
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

