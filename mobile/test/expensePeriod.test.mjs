import assert from 'node:assert/strict';
import test from 'node:test';
import { monthPeriod, parseExpenseDate } from '../src/utils/expensePeriod.ts';

test('período atual usa o calendário local e inclui o dia de hoje', () => {
  assert.deepEqual(monthPeriod(false, new Date(2026, 9, 7, 23, 45)), {
    start_date: '2026-10-01', end_date: '2026-10-07',
  });
});

test('mês anterior trata a virada do ano e fevereiro bissexto', () => {
  assert.deepEqual(monthPeriod(true, new Date(2026, 0, 1)), {
    start_date: '2025-12-01', end_date: '2025-12-31',
  });
  assert.deepEqual(monthPeriod(true, new Date(2024, 2, 1)), {
    start_date: '2024-02-01', end_date: '2024-02-29',
  });
});

test('filtro rejeita datas inexistentes e aceita um dia bissexto válido', () => {
  for (const date of ['', '31/04/2026', '29/02/2026', '00/10/2026', '01/13/2026', '2026-10-01', '1/10/2026', '01/01/1899']) {
    assert.equal(parseExpenseDate(date), null, date);
  }
  assert.equal(parseExpenseDate('29/02/2024'), '2024-02-29');
  assert.equal(parseExpenseDate('07/10/2026'), '2026-10-07');
});
