import assert from 'node:assert/strict';
import test from 'node:test';
import request from 'supertest';
import { createOwner, createTestApplication } from '../test-support/application.js';

test('cuidados: quilometragem real, limites de alerta e manutenção mais recente por tipo', async (t) => {
  const { app } = await createTestApplication(t);
  const owner = await createOwner(app);
  const base = `/vehicles/${owner.vehicle.id}`;
  const get = async () => (await request(app).get(`${base}/care`).set('Authorization', owner.authorization).expect(200)).body.care;
  const empty = await get();
  assert.equal(empty.current_mileage, 45000);
  assert.ok(empty.items.every((item) => item.status === 'unscheduled' && item.remaining_km === null));
  const add = (type, next, date = '2026-10-01') => request(app).post(`${base}/maintenance-records`)
    .set('Authorization', owner.authorization).send({ type, date, mileage: 45000, description: 'Teste de cuidados', next_service_mileage: next }).expect(201);
  await add('oleo', 0);
  await add('revisao', 47000);
  await add('pneus', 48001);
  await add('bateria', 50000);
  await request(app).post(`${base}/fuel-records`).set('Authorization', owner.authorization)
    .send({ date: '2026-10-02', mileage: 47000, liters: 10, total_price: 50, fuel_type: 'gasolina', full_tank: true }).expect(201);
  const care = await get();
  assert.equal(care.current_mileage, 47000);
  assert.deepEqual(care.items.map((item) => item.status), ['overdue', 'overdue', 'upcoming', 'upcoming']);
  const recent = await add('oleo', 48000, '2026-10-03');
  assert.equal((await get()).items[0].status, 'soon');
  await request(app).put(`${base}/maintenance-records/${recent.body.maintenance_record.id}`).set('Authorization', owner.authorization)
    .send({ type: 'oleo', date: '2026-10-03', mileage: 47000, description: 'Sem agendamento' }).expect(200);
  assert.equal((await get()).items[0].status, 'unscheduled');
  await request(app).delete(`${base}/maintenance-records/${recent.body.maintenance_record.id}`).set('Authorization', owner.authorization).expect(204);
  assert.equal((await get()).items[0].status, 'overdue');
});

test('cuidados: exige autenticação e propriedade do veículo; valida parâmetros', async (t) => {
  const { app } = await createTestApplication(t);
  const owner = await createOwner(app);
  const other = await createOwner(app, 'b');
  const path = `/vehicles/${owner.vehicle.id}/care`;
  await request(app).get(path).expect(401);
  await request(app).get(path).set('Authorization', other.authorization).expect(404);
  await request(app).get(`${path}?user_id=2`).set('Authorization', owner.authorization).expect(422);
  await request(app).get('/vehicles/abc/care').set('Authorization', owner.authorization).expect(422);
  await request(app).get('/vehicles/999999/care').set('Authorization', owner.authorization).expect(404);
});
