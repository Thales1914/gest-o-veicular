import assert from 'node:assert/strict';
import test from 'node:test';
import request from 'supertest';
import { createOwner, createTestApplication } from '../test-support/application.js';

const input = { type: 'crlv', title: 'CRLV 2026', number: '123456789',
  issue_date: '2026-01-10', expiry_date: '2026-12-31', notes: 'Documento digital' };

test('documentos: cadastra, lista, detalha, edita e exclui', async (t) => {
  const { app } = await createTestApplication(t);
  const { authorization, vehicle } = await createOwner(app);
  const path = `/vehicles/${vehicle.id}/documents`;
  const create = await request(app).post(path).set('Authorization', authorization).send(input).expect(201);
  assert.equal(typeof create.body.document.id, 'string');
  assert.equal(create.body.document.expiry_date, input.expiry_date);
  await request(app).post(path).set('Authorization', authorization)
    .send({ type: 'seguro', title: 'Seguro', expiry_date: '2026-11-15' }).expect(201);
  await request(app).post(path).set('Authorization', authorization)
    .send({ type: 'outro', title: 'Nota fiscal' }).expect(201);
  const list = await request(app).get(path).set('Authorization', authorization).expect(200);
  assert.deepEqual(list.body.documents.map((item) => item.title), ['Seguro', 'CRLV 2026', 'Nota fiscal']);
  assert.equal(list.body.documents[2].expiry_date, undefined);
  const url = `${path}/${create.body.document.id}`;
  const update = await request(app).put(url).set('Authorization', authorization)
    .send({ type: 'crlv', title: 'CRLV 2027', expiry_date: '2027-12-31' }).expect(200);
  assert.equal(update.body.document.title, 'CRLV 2027');
  assert.equal(update.body.document.number, undefined);
  const detail = await request(app).get(url).set('Authorization', authorization).expect(200);
  assert.equal(detail.body.document.expiry_date, '2027-12-31');
  await request(app).delete(url).set('Authorization', authorization).expect(204);
  await request(app).get(url).set('Authorization', authorization).expect(404);
});

test('documentos: só o dono acessa e dados inválidos recebem 422', async (t) => {
  const { app } = await createTestApplication(t);
  const a = await createOwner(app, 'a');
  const b = await createOwner(app, 'b');
  const path = `/vehicles/${a.vehicle.id}/documents`;
  const create = await request(app).post(path).set('Authorization', a.authorization).send(input).expect(201);
  const id = create.body.document.id;
  for (const [method, url, body] of [['get', path], ['post', path, input], ['get', `${path}/${id}`], ['put', `${path}/${id}`, input], ['delete', `${path}/${id}`]]) {
    await request(app)[method](url).send(body).expect(401);
    await request(app)[method](url).set('Authorization', b.authorization).send(body).expect(404);
  }
  for (const invalid of [{ type: 'rg' }, { title: ' ' }, { expiry_date: '2026-02-30' },
    { issue_date: '2027-01-01', expiry_date: '2026-01-01' }, { user_id: 1 }]) {
    await request(app).post(path).set('Authorization', a.authorization).send({ ...input, ...invalid }).expect(422);
  }
  const list = await request(app).get(path).set('Authorization', a.authorization).expect(200);
  assert.equal(list.body.documents.length, 1);
});

test('documentos: excluir o veículo apaga os documentos dele', async (t) => {
  const { app, pool } = await createTestApplication(t);
  const { authorization, vehicle } = await createOwner(app);
  await request(app).post(`/vehicles/${vehicle.id}/documents`).set('Authorization', authorization).send(input).expect(201);
  await request(app).delete(`/vehicles/${vehicle.id}`).set('Authorization', authorization).expect(204);
  const rows = await pool.query('SELECT COUNT(*) AS total FROM vehicle_documents');
  assert.equal(Number(rows.rows[0].total), 0);
});
