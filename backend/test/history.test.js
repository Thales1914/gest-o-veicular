import assert from 'node:assert/strict';
import test from 'node:test';
import request from 'supertest';
import { createOwner, createTestApplication } from '../test-support/application.js';

test('histórico: combina categorias, pagina, filtra e reflete edição/exclusão', async (t) => {
  const { app } = await createTestApplication(t);
  const owner = await createOwner(app);
  const base = `/vehicles/${owner.vehicle.id}`;
  const get = (query = '') => request(app).get(`${base}/history${query}`).set('Authorization', owner.authorization);
  assert.equal((await get().expect(200)).body.history.total, 0);
  const input = { date: '2026-10-01', mileage: 45000, liters: 10, total_price: 50, fuel_type: 'gasolina', full_tank: true };
  const fuel = await request(app).post(`${base}/fuel-records`).set('Authorization', owner.authorization).send(input).expect(201);
  for (const date of ['2026-10-01', '2026-10-02']) {
    await request(app).post(`${base}/maintenance-records`).set('Authorization', owner.authorization)
      .send({ type: 'outro', date, mileage: 45000, description: 'Inspeção', ...(date.endsWith('02') ? { cost: 0 } : {}) }).expect(201);
  }
  const page = (await get('?limit=2').expect(200)).body.history;
  assert.equal(page.total, 3); assert.equal(page.has_more, true);
  assert.equal(page.entries[0].date, '2026-10-02'); assert.equal(page.entries[0].amount, 0);
  const next = (await get('?limit=2&offset=2').expect(200)).body.history;
  assert.equal(next.has_more, false); assert.equal(next.entries[0].amount, null);
  assert.equal((await get('?category=fuel').expect(200)).body.history.total, 1);
  assert.equal((await get('?category=maintenance&start_date=2026-10-02&end_date=2026-10-02').expect(200)).body.history.total, 1);
  const path = `${base}/fuel-records/${fuel.body.fuel_record.id}`;
  await request(app).put(path).set('Authorization', owner.authorization).send({ ...input, total_price: 80 }).expect(200);
  assert.equal((await get('?category=fuel').expect(200)).body.history.entries[0].amount, 80);
  await request(app).delete(path).set('Authorization', owner.authorization).expect(204);
  assert.equal((await get('?category=fuel').expect(200)).body.history.total, 0);
});

test('histórico: autenticação, isolamento, IDs e filtros inválidos', async (t) => {
  const { app } = await createTestApplication(t);
  const owner = await createOwner(app);
  const other = await createOwner(app, 'b');
  const path = `/vehicles/${owner.vehicle.id}/history`;
  await request(app).get(path).expect(401);
  await request(app).get(path).set('Authorization', 'Bearer invalid').expect(401);
  await request(app).get(path).set('Authorization', other.authorization).expect(404);
  for (const query of ['category=invalid', 'limit=0', 'limit=101', 'offset=-1', 'offset=100001', 'limit[]=1', 'user_id=1', 'start_date=2026-02-30', 'start_date=2026-10-31&end_date=2026-10-01']) {
    await request(app).get(`${path}?${query}`).set('Authorization', owner.authorization).expect(422);
  }
  for (const id of ['0', 'abc', '9223372036854775808']) {
    await request(app).get(`/vehicles/${id}/history`).set('Authorization', owner.authorization).expect(422);
  }
});
