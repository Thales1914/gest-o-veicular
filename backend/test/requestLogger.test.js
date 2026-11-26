import assert from 'node:assert/strict';
import test from 'node:test';
import express from 'express';
import request from 'supertest';
import { requestLogger } from '../src/middlewares/requestLogger.js';

test('registra método, caminho, status e tempo sem dados sensíveis', async () => {
  const logs = [];
  const app = express();
  app.use(requestLogger((line) => logs.push(line)));
  app.use(express.json());
  app.post('/auth/login', (_request, response) => response.sendStatus(401));

  await request(app).post('/auth/login?token=query-secret')
    .set('Authorization', 'Bearer header-secret')
    .send({ password: 'body-secret' }).expect(401);

  assert.equal(logs.length, 1);
  assert.match(logs[0], /^POST \/auth\/login -> 401 - \d+ ms$/);
  assert.ok(!logs[0].includes('secret'));
});
