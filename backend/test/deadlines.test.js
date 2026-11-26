import assert from 'node:assert/strict';
import test from 'node:test';
import request from 'supertest';
import { DeadlineService } from '../src/services/DeadlineService.js';
import { createOwner, createTestApplication } from '../test-support/application.js';

function inDays(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

test('vencimentos: junta documentos e IPVA pendente, do mais urgente ao mais distante', async (t) => {
  const { app } = await createTestApplication(t);
  const { authorization, vehicle } = await createOwner(app);
  const base = `/vehicles/${vehicle.id}`;
  const send = (path, body) => request(app).post(`${base}/${path}`).set('Authorization', authorization).send(body).expect(201);
  await send('documents', { type: 'seguro', title: 'Seguro', expiry_date: inDays(10) });
  await send('documents', { type: 'crlv', title: 'CRLV vencido', expiry_date: inDays(-3) });
  await send('documents', { type: 'licenciamento', title: 'Licenciamento', expiry_date: inDays(200) });
  await send('documents', { type: 'outro', title: 'Sem vencimento' });
  await send('ipva', { year: 2030, total_value: 900, installments: 1, due_date: inDays(0), status: 'pendente' });
  await send('ipva', { year: 2031, total_value: 900, installments: 1, due_date: inDays(5), status: 'pago' });

  const response = await request(app).get(`${base}/deadlines`).set('Authorization', authorization).expect(200);
  const { deadlines } = response.body;
  assert.equal(deadlines.days, 30);
  assert.deepEqual(deadlines.items.map((item) => [item.title, item.status, item.days_left]), [
    ['CRLV vencido', 'vencido', -3],
    ['IPVA 2030', 'proximo', 0],
    ['Seguro', 'proximo', 10],
  ]);
  assert.equal(deadlines.overdue_count, 1);
  assert.equal(deadlines.upcoming_count, 2);
  const wider = await request(app).get(`${base}/deadlines?days=365`).set('Authorization', authorization).expect(200);
  assert.equal(wider.body.deadlines.items.length, 4);
});

test('vencimentos: só o dono acessa e o período precisa ser válido', async (t) => {
  const { app } = await createTestApplication(t);
  const a = await createOwner(app, 'a');
  const b = await createOwner(app, 'b');
  const url = `/vehicles/${a.vehicle.id}/deadlines`;
  await request(app).get(url).expect(401);
  await request(app).get(url).set('Authorization', b.authorization).expect(404);
  for (const days of ['0', '366', 'abc']) {
    await request(app).get(`${url}?days=${days}`).set('Authorization', a.authorization).expect(422);
  }
});

test('vencimentos: conta os dias pela data local, sem depender da hora', async () => {
  const repository = { listDueItems: async () => [{ kind: 'document', id: '1', title: 'Seguro', type: 'seguro', due_date: '2026-03-01' }] };
  const vehicleService = { detail: async () => ({}) };
  const service = new DeadlineService(repository, vehicleService, () => new Date(2026, 1, 28, 23, 59));
  const result = await service.summarize('1', '1', { days: 30 });
  assert.equal(result.items[0].days_left, 1);
});

test('vencimentos: ignora parcelas pagas e reflete alterações e exclusões', async (t) => {
  const { app } = await createTestApplication(t);
  const owner = await createOwner(app);
  const base = `/vehicles/${owner.vehicle.id}`;
  const input = { year: 2026, total_value: 100, installments: 2, due_date: inDays(0), status: 'pendente' };
  const record = (await request(app).post(`${base}/ipva`).set('Authorization', owner.authorization).send(input).expect(201)).body.ipva_record;
  const get = async () => (await request(app).get(`${base}/deadlines?days=365`).set('Authorization', owner.authorization).expect(200)).body.deadlines;
  assert.equal((await get()).items.length, 2);
  const details = record.installment_details.map((item, index) => ({ ...item, status: index === 0 ? 'pago' : 'pendente' }));
  await request(app).put(`${base}/ipva/${record.id}`).set('Authorization', owner.authorization)
    .send({ ...input, installment_details: details }).expect(200);
  assert.equal((await get()).items.length, 1);
  assert.equal((await get()).items[0].installment_number, 2);
  await request(app).delete(`${base}/ipva/${record.id}`).set('Authorization', owner.authorization).expect(204);
  assert.equal((await get()).items.length, 0);
});

test('vencimentos: calendário brasileiro na virada UTC e IDs grandes sem perda', async () => {
  const repository = { listDueItems: async () => ['9007199254740993', '9007199254740992'].map(id => ({ kind: 'document', id, due_date: '2026-03-01' })) };
  const service = new DeadlineService(repository, { detail: async () => ({}) }, () => new Date('2026-03-01T01:30:00Z'));
  const result = await service.summarize('1', '1', { days: 30 });
  assert.equal(result.items[0].days_left, 1);
  assert.equal(result.items[0].id, '9007199254740992');
});
