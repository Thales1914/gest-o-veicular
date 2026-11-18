import assert from 'node:assert/strict';
import test from 'node:test';
import request from 'supertest';
import { createOwner, createTestApplication } from '../test-support/application.js';

test('IPVA: centavos exatos, calendário e pagamento parcial persistente', async (t) => {
  const { app } = await createTestApplication(t);
  const owner = await createOwner(app);
  const path = `/vehicles/${owner.vehicle.id}/ipva`;
  const input = { year: 2026, total_value: 100, installments: 3, due_date: '2026-01-31', status: 'pendente' };
  const record = (await request(app).post(path).set('Authorization', owner.authorization).send(input).expect(201)).body.ipva_record;
  assert.deepEqual(record.installment_details.map(item => item.amount), [33.34, 33.33, 33.33]);
  assert.deepEqual(record.installment_details.map(item => item.due_date), ['2026-01-31', '2026-02-28', '2026-03-31']);
  const details = record.installment_details.map((item, index) => ({ ...item, status: index === 0 ? 'pago' : 'pendente' }));
  const updated = (await request(app).put(`${path}/${record.id}`).set('Authorization', owner.authorization)
    .send({ ...input, installment_details: details }).expect(200)).body.ipva_record;
  assert.equal(updated.status, 'pendente'); assert.equal(updated.paid_installments, 1);
  assert.equal(updated.next_due_date, '2026-02-28');
  await request(app).put(`${path}/${record.id}`).set('Authorization', owner.authorization)
    .send({ ...input, installment_details: [{ ...details[0], amount: 100 }, ...details.slice(1)] }).expect(422);
  await request(app).post(path).set('Authorization', owner.authorization).send({ ...input, year: 2027, total_value: 0.01, installments: 12 }).expect(422);
});
