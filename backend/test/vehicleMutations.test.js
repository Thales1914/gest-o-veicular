import assert from 'node:assert/strict';
import test from 'node:test';
import request from 'supertest';
import { createOwner, createTestApplication } from '../test-support/application.js';

const input = { brand: 'Toyota', model: 'Corolla', year: 2021, plate: 'xyz-4321', current_mileage: 46000 };

test('veículos: edita, normaliza placa e mantém a propriedade', async (t) => {
  const { app } = await createTestApplication(t);
  const { authorization, vehicle } = await createOwner(app);
  const url = `/vehicles/${vehicle.id}`;
  const response = await request(app).put(url).set('Authorization', authorization).send(input).expect(200);
  assert.equal(response.body.vehicle.plate, 'XYZ4321');
  assert.equal(response.body.vehicle.model, input.model);
  assert.equal(response.body.vehicle.current_mileage, input.current_mileage);
  assert.equal(response.body.vehicle.user_id, vehicle.user_id);
  const detail = await request(app).get(url).set('Authorization', authorization).expect(200);
  assert.equal(detail.body.vehicle.brand, input.brand);
  for (const invalid of [{ plate: 'ERRADO' }, { current_mileage: -1 }, { year: 1700 }, { user_id: '2' }, { model: ' ' }]) {
    await request(app).put(url).set('Authorization', authorization).send({ ...input, ...invalid }).expect(422);
  }
  await request(app).put('/vehicles/999999999999999999999').set('Authorization', authorization).send(input).expect(422);
  await request(app).delete('/vehicles/invalid').set('Authorization', authorization).expect(422);
  await request(app).delete(url).set('Authorization', authorization).expect(204);
  await request(app).get(url).set('Authorization', authorization).expect(404);
  await request(app).put(url).set('Authorization', authorization).send(input).expect(404);
  await request(app).delete(url).set('Authorization', authorization).expect(404);
});

test('veículos: outro usuário não pode editar ou excluir', async (t) => {
  const { app } = await createTestApplication(t);
  const a = await createOwner(app, 'a');
  const b = await createOwner(app, 'b');
  const url = `/vehicles/${a.vehicle.id}`;
  await request(app).put(url).send(input).expect(401);
  await request(app).delete(url).expect(401);
  await request(app).put(url).set('Authorization', b.authorization).send(input).expect(404);
  await request(app).delete(url).set('Authorization', b.authorization).expect(404);
  const response = await request(app).get(url).set('Authorization', a.authorization).expect(200);
  assert.equal(response.body.vehicle.model, 'Civic');
});

test('veículos: exclusão em cascata remove somente registros do veículo excluído', async (t) => {
  const { app, pool } = await createTestApplication(t);
  const a = await createOwner(app, 'a');
  const b = await createOwner(app, 'b');
  for (const owner of [a, b]) {
    const url = `/vehicles/${owner.vehicle.id}`;
    await request(app).post(`${url}/fuel-records`).set('Authorization', owner.authorization).send({
      date: '2026-10-01', mileage: 46000, liters: 20, total_price: 110, fuel_type: 'gasolina', full_tank: false,
    }).expect(201);
    await request(app).post(`${url}/maintenance-records`).set('Authorization', owner.authorization).send({
      type: 'outro', date: '2026-10-01', mileage: 46000, description: 'Teste', cost: 80,
    }).expect(201);
  }
  await request(app).delete(`/vehicles/${a.vehicle.id}`).set('Authorization', a.authorization).expect(204);
  for (const table of ['fuel_records', 'maintenance_records']) {
    const remaining = await pool.query(`SELECT vehicle_id FROM ${table}`);
    assert.equal(remaining.rowCount, 1);
    assert.equal(String(remaining.rows[0].vehicle_id), String(b.vehicle.id));
  }
});
