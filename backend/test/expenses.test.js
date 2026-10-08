import assert from 'node:assert/strict';
import test from 'node:test';
import request from 'supertest';
import { createOwner, createTestApplication } from '../test-support/application.js';

async function addFuel(app, owner, date, value) {
  return request(app).post(`/vehicles/${owner.vehicle.id}/fuel-records`).set('Authorization', owner.authorization).send({
    date, mileage: 45000, liters: 10, total_price: value, fuel_type: 'gasolina', full_tank: true,
  }).expect(201);
}

async function addMaintenance(app, owner, date, value) {
  return request(app).post(`/vehicles/${owner.vehicle.id}/maintenance-records`).set('Authorization', owner.authorization).send({
    type: 'outro', date, mileage: 45000, description: 'Teste de gastos', cost: value,
  }).expect(201);
}

test('gastos: período inclusivo, categorias, custos ausentes e sem duplicação', async (t) => {
  const { app } = await createTestApplication(t);
  const owner = await createOwner(app);
  const path = `/vehicles/${owner.vehicle.id}/expenses`;
  const empty = await request(app).get(path).set('Authorization', owner.authorization).expect(200);
  assert.equal(empty.body.expenses.total, 0);
  assert.equal(empty.body.expenses.fuel_count, 0);
  assert.equal(empty.body.expenses.maintenance_count, 0);
  await addFuel(app, owner, '2026-09-30', 999);
  await addFuel(app, owner, '2026-10-01', 100.10);
  const fuel = await addFuel(app, owner, '2026-10-31', 200.20);
  await addMaintenance(app, owner, '2026-10-01', 50.30);
  const maintenance = await addMaintenance(app, owner, '2026-10-31', 49.40);
  await addMaintenance(app, owner, '2026-10-15');
  await addMaintenance(app, owner, '2026-11-01', 999);
  const url = `${path}?start_date=2026-10-01&end_date=2026-10-31`;
  const response = await request(app).get(url).set('Authorization', owner.authorization).expect(200);
  assert.deepEqual(response.body.expenses, {
    vehicle_id: String(owner.vehicle.id), start_date: '2026-10-01', end_date: '2026-10-31',
    fuel_total: 300.30, maintenance_total: 99.70, total: 400,
    fuel_count: 2, maintenance_count: 3, maintenance_without_cost: 1,
  });
  await request(app).delete(`/vehicles/${owner.vehicle.id}/fuel-records/${fuel.body.fuel_record.id}`)
    .set('Authorization', owner.authorization).expect(204);
  await request(app).put(`/vehicles/${owner.vehicle.id}/maintenance-records/${maintenance.body.maintenance_record.id}`)
    .set('Authorization', owner.authorization).send({ type: 'outro', date: '2026-10-31', mileage: 45000, description: 'Corrigido', cost: 9.60 }).expect(200);
  const updated = await request(app).get(url).set('Authorization', owner.authorization).expect(200);
  assert.equal(updated.body.expenses.total, 160);
  assert.equal(updated.body.expenses.fuel_count, 1);
});

test('gastos: isola usuário e veículo; rejeita intervalo inválido', async (t) => {
  const { app } = await createTestApplication(t);
  const a = await createOwner(app, 'a');
  const b = await createOwner(app, 'b');
  await addFuel(app, b, '2026-10-01', 500);
  const url = `/vehicles/${a.vehicle.id}/expenses`;
  await request(app).get(url).expect(401);
  await request(app).get(url).set('Authorization', b.authorization).expect(404);
  const response = await request(app).get(url).set('Authorization', a.authorization).expect(200);
  assert.equal(response.body.expenses.total, 0);
  for (const query of ['start_date=2026-10-31&end_date=2026-10-01', 'start_date=2026-02-30', 'start_date=hoje', 'user_id=2']) {
    await request(app).get(`${url}?${query}`).set('Authorization', a.authorization).expect(422);
  }
  await request(app).get('/vehicles/99999/expenses').set('Authorization', a.authorization).expect(404);
});

test('gastos: centavos são somados sem erro de ponto flutuante', async (t) => {
  const { app } = await createTestApplication(t);
  const owner = await createOwner(app);
  await addFuel(app, owner, '2026-10-01', 0.10);
  await addMaintenance(app, owner, '2026-10-01', 0.20);
  const response = await request(app).get(`/vehicles/${owner.vehicle.id}/expenses`).set('Authorization', owner.authorization).expect(200);
  assert.equal(response.body.expenses.total, 0.30);
});
