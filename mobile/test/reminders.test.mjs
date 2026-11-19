import assert from 'node:assert/strict';
import test from 'node:test';
import { planReminders } from '../src/utils/reminders.ts';

const now = new Date(2026, 10, 2, 10, 0);
const doc = (due_date, extra = {}) => ({ kind: 'document', id: '1', title: 'Seguro', type: 'seguro', due_date, days_left: 0, status: 'proximo', ...extra });

test('documento: avisa 7 dias antes e no dia, às 9h', () => {
  const plan = planReminders('Honda Civic', [doc('2026-11-20')], [], now);
  assert.deepEqual(plan.map((item) => [item.id, item.date.getDate(), item.date.getHours()]), [
    ['document:1:0:7d', 13, 9],
    ['document:1:0:0d', 20, 9],
  ]);
  assert.match(plan[0].body, /Honda Civic/);
});

test('não agenda datas que já passaram', () => {
  assert.equal(planReminders('Civic', [doc('2026-11-05')], [], now).length, 1);
  assert.equal(planReminders('Civic', [doc('2026-10-30')], [], now).length, 0);
});

test('cada parcela de IPVA ganha os próprios lembretes', () => {
  const items = [1, 2].map((n) => doc(`2026-1${n}-20`, { kind: 'ipva', id: '7', title: `IPVA • parcela ${n}`, installment_number: n }));
  const ids = planReminders('Civic', items, [], now).map((item) => item.id);
  assert.equal(new Set(ids).size, 4);
});

test('cuidados próximos ou vencidos avisam no próximo horário das 9h', () => {
  const care = [
    { type: 'oleo', record_id: '1', next_service_mileage: 50000, remaining_km: 500, status: 'soon' },
    { type: 'revisao', record_id: '2', next_service_mileage: 40000, remaining_km: -100, status: 'overdue' },
    { type: 'pneus', record_id: null, next_service_mileage: null, remaining_km: null, status: 'unscheduled' },
  ];
  const plan = planReminders('Civic', [], care, now);
  assert.deepEqual(plan.map((item) => item.id).sort(), ['care:oleo', 'care:revisao']);
  assert.equal(plan[0].date.getDate(), 3);
});
