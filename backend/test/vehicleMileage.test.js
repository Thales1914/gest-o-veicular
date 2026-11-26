import assert from 'node:assert/strict';
import test from 'node:test';
import request from 'supertest';
import { createOwner, createTestApplication } from '../test-support/application.js';

const fuel = { date: '2026-10-01', mileage: 45800, liters: 40, total_price: 240, fuel_type: 'gasolina', full_tank: true };
const maintenance = { type: 'oleo', date: '2026-10-05', mileage: 46200, description: 'Troca de óleo' };

test('quilometragem: abastecimento e manutenção com km maior atualizam o veículo', async (t) => {
  const { app } = await createTestApplication(t);
  const { authorization, vehicle } = await createOwner(app);
  const base = `/vehicles/${vehicle.id}`;
  const mileage = async () => (await request(app).get(base).set('Authorization', authorization).expect(200)).body.vehicle.current_mileage;

  await request(app).post(`${base}/fuel-records`).set('Authorization', authorization).send(fuel).expect(201);
  assert.equal(await mileage(), 45800);
  const created = await request(app).post(`${base}/maintenance-records`).set('Authorization', authorization).send(maintenance).expect(201);
  assert.equal(await mileage(), 46200);
  await request(app).put(`${base}/maintenance-records/${created.body.maintenance_record.id}`).set('Authorization', authorization)
    .send({ ...maintenance, mileage: 47000 }).expect(200);
  assert.equal(await mileage(), 47000);
});

test('quilometragem: registro com km menor não diminui a do veículo', async (t) => {
  const { app } = await createTestApplication(t);
  const { authorization, vehicle } = await createOwner(app);
  const base = `/vehicles/${vehicle.id}`;
  await request(app).post(`${base}/fuel-records`).set('Authorization', authorization).send({ ...fuel, mileage: 30000 }).expect(201);
  const detail = await request(app).get(base).set('Authorization', authorization).expect(200);
  assert.equal(detail.body.vehicle.current_mileage, 45000);
});

test('quilometragem: rejeita criação e edição fora da ordem cronológica entre categorias', async (t) => {
  const { app } = await createTestApplication(t);
  const { authorization, vehicle } = await createOwner(app);
  const base = `/vehicles/${vehicle.id}`;
  const send = (category, input) => request(app).post(`${base}/${category}`).set('Authorization', authorization).send(input);
  const earlier = await send('fuel-records', { ...fuel, date: '2026-11-10', mileage: 31500 }).expect(201);
  const laterInput = { ...maintenance, date: '2026-11-15', mileage: 32000 };
  const later = await send('maintenance-records', laterInput).expect(201);
  const invalid = await send('fuel-records', { ...fuel, date: '2026-11-12', mileage: 31000 }).expect(422);
  assert.equal(invalid.body.errors[0].field, 'mileage');
  await send('maintenance-records', { ...maintenance, date: '2026-11-12', mileage: 32500 }).expect(422);
  await request(app).put(`${base}/fuel-records/${earlier.body.fuel_record.id}`).set('Authorization', authorization)
    .send({ ...fuel, date: '2026-11-10', mileage: 33000 }).expect(422);
  await request(app).put(`${base}/maintenance-records/${later.body.maintenance_record.id}`).set('Authorization', authorization)
    .send({ ...laterInput, mileage: 31000 }).expect(422);
  await request(app).put(`${base}/maintenance-records/${later.body.maintenance_record.id}`).set('Authorization', authorization)
    .send({ ...laterInput, mileage: 32100 }).expect(200);
});
