import assert from 'node:assert/strict';
import test from 'node:test';
import { daysUntil, dueLabel, dueStatus } from '../src/utils/dueDate.ts';

test('conta os dias pelo calendário local, mesmo perto da meia-noite', () => {
  assert.equal(daysUntil('2026-03-01', new Date(2026, 1, 28, 23, 59)), 1);
  assert.equal(daysUntil('2026-10-20', new Date(2026, 9, 22, 8)), -2);
  assert.equal(daysUntil('2027-01-01', new Date(2026, 11, 31)), 1);
});

test('mostra textos amigáveis para o vencimento', () => {
  assert.equal(dueLabel(-5), 'Venceu há 5 dias');
  assert.equal(dueLabel(-1), 'Venceu ontem');
  assert.equal(dueLabel(0), 'Vence hoje');
  assert.equal(dueLabel(1), 'Vence amanhã');
  assert.equal(dueLabel(12), 'Vence em 12 dias');
});

test('classifica em vencido, próximo ou em dia', () => {
  assert.equal(dueStatus(-1), 'vencido');
  assert.equal(dueStatus(0), 'proximo');
  assert.equal(dueStatus(30), 'proximo');
  assert.equal(dueStatus(31), 'em_dia');
});
