import assert from 'node:assert/strict';
import test from 'node:test';
import request from 'supertest';
import { createOwner, createTestApplication } from '../test-support/application.js';

const input = { year: 2026, total_value: 1500.00, installments: 3, due_date: '2026-11-20', status: 'pendente' };

test('IPVA: cadastra, lista, marca como pago e exclui', async (t) => {
  const { app } = await createTestApplication(t);
  const { authorization, vehicle } = await createOwner(app);
  const path = `/vehicles/${vehicle.id}/ipva`;
  const create = await request(app).post(path).set('Authorization', authorization).send(input).expect(201);
  assert.equal(create.body.ipva_record.total_value, 1500);
  assert.equal(create.body.ipva_record.installment_value, 500);
  assert.equal(create.body.ipva_record.status, 'pendente');
  await request(app).post(path).set('Authorization', authorization)
    .send({ ...input, year: 2025, due_date: '2025-11-20', status: 'pago' }).expect(201);
  const list = await request(app).get(path).set('Authorization', authorization).expect(200);
  assert.deepEqual(list.body.ipva_records.map((item) => item.year), [2026, 2025]);
  const url = `${path}/${create.body.ipva_record.id}`;
  const paid = await request(app).put(url).set('Authorization', authorization).send({ ...input, status: 'pago' }).expect(200);
  assert.equal(paid.body.ipva_record.status, 'pago');
  await request(app).delete(url).set('Authorization', authorization).expect(204);
  await request(app).get(url).set('Authorization', authorization).expect(404);
});

test('IPVA: não repete o mesmo ano para o mesmo veículo', async (t) => {
  const { app } = await createTestApplication(t);
  const { authorization, vehicle } = await createOwner(app);
  const path = `/vehicles/${vehicle.id}/ipva`;
  await request(app).post(path).set('Authorization', authorization).send(input).expect(201);
  await request(app).post(path).set('Authorization', authorization).send(input).expect(409);
});

test('IPVA: só o dono acessa e dados inválidos recebem 422', async (t) => {
  const { app } = await createTestApplication(t);
  const a = await createOwner(app, 'a');
  const b = await createOwner(app, 'b');
  const path = `/vehicles/${a.vehicle.id}/ipva`;
  const create = await request(app).post(path).set('Authorization', a.authorization).send(input).expect(201);
  const id = create.body.ipva_record.id;
  for (const [method, url, body] of [['get', path], ['post', path, input], ['get', `${path}/${id}`], ['put', `${path}/${id}`, input], ['delete', `${path}/${id}`]]) {
    await request(app)[method](url).send(body).expect(401);
    await request(app)[method](url).set('Authorization', b.authorization).send(body).expect(404);
  }
  for (const invalid of [{ total_value: 0 }, { total_value: 10.001 }, { installments: 0 }, { installments: 13 },
    { status: 'atrasado' }, { due_date: '2026-13-01' }, { year: 1800 }, { user_id: 1 }]) {
    await request(app).post(path).set('Authorization', a.authorization).send({ ...input, year: 2030, ...invalid }).expect(422);
  }
});
