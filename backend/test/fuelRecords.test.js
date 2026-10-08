import assert from 'node:assert/strict';
import test from 'node:test';
import request from 'supertest';
import { createOwner, createTestApplication } from '../test-support/application.js';

const input = { date: '2026-10-01', mileage: 45100, liters: 30.125, total_price: 185.25,
  fuel_type: 'gasolina', full_tank: true, gas_station: 'Posto teste', notes: 'Completo' };

test('abastecimentos: CRUD, período inclusivo e contrato numérico do mobile', async (t) => {
  const { app } = await createTestApplication(t);
  const { authorization, vehicle } = await createOwner(app);
  const path = `/vehicles/${vehicle.id}/fuel-records`;
  const create = await request(app).post(path).set('Authorization', authorization).send(input).expect(201);
  const record = create.body.fuel_record;
  assert.equal(record.date, input.date);
  assert.equal(record.liters, input.liters);
  assert.equal(record.total_price, input.total_price);
  assert.equal(typeof record.id, 'string');
  assert.equal(record.vehicle_id, String(vehicle.id));
  const url = `${path}/${record.id}`;
  await request(app).get(url).set('Authorization', authorization).expect(200);
  await request(app).post(path).set('Authorization', authorization).send({ ...input, date: '2026-09-30' }).expect(201);
  const list = await request(app).get(`${path}?start_date=2026-10-01&end_date=2026-10-01`).set('Authorization', authorization).expect(200);
  assert.equal(list.body.fuel_records.length, 1);
  const update = await request(app).put(url).set('Authorization', authorization)
    .send({ ...input, liters: 20.5, total_price: 100.10, full_tank: false, notes: undefined }).expect(200);
  assert.equal(update.body.fuel_record.total_price, 100.10);
  assert.equal(update.body.fuel_record.full_tank, false);
  assert.equal(update.body.fuel_record.notes, undefined);
  await request(app).delete(url).set('Authorization', authorization).expect(204);
  await request(app).get(url).set('Authorization', authorization).expect(404);
  await request(app).put(url).set('Authorization', authorization).send(input).expect(404);
  await request(app).delete(url).set('Authorization', authorization).expect(404);
});

test('abastecimentos: autenticação e isolamento por proprietário e veículo', async (t) => {
  const { app } = await createTestApplication(t);
  const a = await createOwner(app, 'a');
  const b = await createOwner(app, 'b');
  const path = `/vehicles/${a.vehicle.id}/fuel-records`;
  const created = await request(app).post(path).set('Authorization', a.authorization).send(input).expect(201);
  const id = created.body.fuel_record.id;
  for (const [method, url, body] of [['get', path], ['post', path, input], ['get', `${path}/${id}`], ['put', `${path}/${id}`, input], ['delete', `${path}/${id}`]]) {
    await request(app)[method](url).send(body).expect(401);
    await request(app)[method](url).set('Authorization', b.authorization).send(body).expect(404);
  }
  const otherPath = `/vehicles/${b.vehicle.id}/fuel-records/${id}`;
  await request(app).get(otherPath).set('Authorization', b.authorization).expect(404);
  await request(app).put(otherPath).set('Authorization', b.authorization).send(input).expect(404);
  await request(app).delete(otherPath).set('Authorization', b.authorization).expect(404);
  await request(app).get(`${path}/${id}`).set('Authorization', a.authorization).expect(200);
});

test('abastecimentos: rejeita dados inválidos sem salvar', async (t) => {
  const { app } = await createTestApplication(t);
  const { authorization, vehicle } = await createOwner(app);
  const path = `/vehicles/${vehicle.id}/fuel-records`;
  for (const invalid of [{ date: '2026-02-30' }, { date: '01/10/2026' }, { liters: 0 }, { liters: -1 },
    { total_price: 0 }, { total_price: 1.001 }, { mileage: -1 }, { mileage: 1.5 }, { mileage: 2147483648 },
    { fuel_type: 'agua' }, { full_tank: 'true' }, { vehicle_id: 99 }, { total_price: '50' }]) {
    await request(app).post(path).set('Authorization', authorization).send({ ...input, ...invalid }).expect(422);
  }
  await request(app).get(`${path}?start_date=2026-10-02&end_date=2026-10-01`).set('Authorization', authorization).expect(422);
  await request(app).get('/vehicles/999999999999999999999/fuel-records').set('Authorization', authorization).expect(422);
  const list = await request(app).get(path).set('Authorization', authorization).expect(200);
  assert.deepEqual(list.body.fuel_records, []);
});
