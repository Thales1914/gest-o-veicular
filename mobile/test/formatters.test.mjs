import assert from 'node:assert/strict';
import test from 'node:test';
import { formatConsumption, parseDecimal } from '../src/utils/formatters.ts';

test('interpreta valores brasileiros com e sem separador de milhar', () => {
  assert.equal(parseDecimal('2.400,00'), 2400);
  assert.equal(parseDecimal('2400,00'), 2400);
  assert.equal(parseDecimal('40,5'), 40.5);
  assert.equal(parseDecimal('1.234.567,89'), 1234567.89);
});

test('exibe consumo em português brasileiro', () => {
  assert.equal(formatConsumption(13.25), '13,3 km/l');
});
