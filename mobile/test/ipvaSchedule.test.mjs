import assert from 'node:assert/strict';
import test from 'node:test';
import { makeIpvaSchedule } from '../src/utils/ipvaSchedule.ts';

test('parcelas preservam o valor total em centavos', () => {
  const schedule = makeIpvaSchedule(1000, 3, '2026-01-15', 'pendente');
  assert.deepEqual(schedule.map((item) => item.amount), [333.34, 333.33, 333.33]);
  assert.equal(schedule.reduce((total, item) => total + Math.round(item.amount * 100), 0), 100000);
});

test('datas mensais respeitam meses curtos e virada do ano', () => {
  const schedule = makeIpvaSchedule(300, 3, '2026-12-31', 'pago');
  assert.deepEqual(schedule.map((item) => item.due_date), ['2026-12-31', '2027-01-31', '2027-02-28']);
  assert.ok(schedule.every((item) => item.status === 'pago'));
});

test('dados inválidos não geram parcelas', () => {
  assert.deepEqual(makeIpvaSchedule(0, 3, '2026-01-01', 'pendente'), []);
  assert.deepEqual(makeIpvaSchedule(10, 13, '2026-01-01', 'pendente'), []);
  assert.deepEqual(makeIpvaSchedule(10, 2, '01/01/2026', 'pendente'), []);
});
