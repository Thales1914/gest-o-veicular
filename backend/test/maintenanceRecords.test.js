import assert from 'node:assert/strict';
import test from 'node:test';
import request from 'supertest';
import { createOwner, createTestApplication } from '../test-support/application.js';

const input = { type: 'oleo', date: '2026-10-01', mileage: 45100, description: 'Óleo e filtro',
  cost: 120.50, oil_type: 'sintetico', next_service_mileage: 50100 };

test('manutenções: CRUD e campos de óleo, revisão, pneus e bateria', async (t) => {
  const { app } = await createTestApplication(t);
  const { authorization, vehicle } = await createOwner(app);
  const path = `/vehicles/${vehicle.id}/maintenance-records`;
  const create = await request(app).post(path).set('Authorization', authorization).send(input).expect(201);
  assert.equal(create.body.maintenance_record.cost, 120.5);
  assert.equal(create.body.maintenance_record.date, input.date);
  assert.equal(typeof create.body.maintenance_record.id, 'string');
  const url = `${path}/${create.body.maintenance_record.id}`;
  const variants = [
    { type: 'oleo', oil_type: 'semissintetico', next_service_mileage: 55000 },
    { type: 'revisao', service_notes: 'Freios e suspensão', next_service_mileage: 60000 },
    { type: 'pneus', brand: 'Michelin', warranty_months: 12 },
    { type: 'bateria', brand: 'Moura', warranty_months: 24 },
    { type: 'outro', cost: undefined },
  ];
  for (const fields of variants) {
    const update = await request(app).put(url).set('Authorization', authorization)
      .send({ date: input.date, mileage: input.mileage, description: 'Manutenção', cost: 90.25, ...fields }).expect(200);
    for (const [key, value] of Object.entries(fields)) assert.equal(update.body.maintenance_record[key], value);
    assert.equal(update.body.maintenance_record.oil_type, fields.oil_type);
    const detail = await request(app).get(url).set('Authorization', authorization).expect(200);
    assert.equal(detail.body.maintenance_record.type, fields.type);
  }
  const list = await request(app).get(`${path}?start_date=2026-10-01&end_date=2026-10-01`).set('Authorization', authorization).expect(200);
  assert.equal(list.body.maintenance_records.length, 1);
  const empty = await request(app).get(`${path}?start_date=2026-10-02`).set('Authorization', authorization).expect(200);
  assert.deepEqual(empty.body.maintenance_records, []);
  await request(app).delete(url).set('Authorization', authorization).expect(204);
  await request(app).get(url).set('Authorization', authorization).expect(404);
  await request(app).put(url).set('Authorization', authorization).send(input).expect(404);
  await request(app).delete(url).set('Authorization', authorization).expect(404);
});

test('manutenções: isolamento de registros e rotas autenticadas', async (t) => {
  const { app } = await createTestApplication(t);
  const a = await createOwner(app, 'a');
  const b = await createOwner(app, 'b');
  const path = `/vehicles/${a.vehicle.id}/maintenance-records`;
  const create = await request(app).post(path).set('Authorization', a.authorization).send(input).expect(201);
  const id = create.body.maintenance_record.id;
  for (const [method, url, body] of [['get', path], ['post', path, input], ['get', `${path}/${id}`], ['put', `${path}/${id}`, input], ['delete', `${path}/${id}`]]) {
    await request(app)[method](url).send(body).expect(401);
    await request(app)[method](url).set('Authorization', b.authorization).send(body).expect(404);
  }
  const otherUrl = `/vehicles/${b.vehicle.id}/maintenance-records/${id}`;
  await request(app).get(otherUrl).set('Authorization', b.authorization).expect(404);
  await request(app).put(otherUrl).set('Authorization', b.authorization).send(input).expect(404);
  await request(app).delete(otherUrl).set('Authorization', b.authorization).expect(404);
});

test('manutenções: datas, custos e campos inválidos recebem 422', async (t) => {
  const { app } = await createTestApplication(t);
  const { authorization, vehicle } = await createOwner(app);
  const path = `/vehicles/${vehicle.id}/maintenance-records`;
  for (const invalid of [{ type: 'invalido' }, { date: '2026-02-29' }, { mileage: -1 }, { description: ' ' },
    { cost: -1 }, { cost: 1.001 }, { warranty_months: -1 }, { warranty_months: 1.5 },
    { next_service_mileage: -1 }, { oil_type: 'agua' }, { user_id: 99 }]) {
    await request(app).post(path).set('Authorization', authorization).send({ ...input, ...invalid }).expect(422);
  }
  await request(app).get(`${path}?start_date=2026-10-02&end_date=2026-10-01`).set('Authorization', authorization).expect(422);
  const list = await request(app).get(path).set('Authorization', authorization).expect(200);
  assert.deepEqual(list.body.maintenance_records, []);
});
