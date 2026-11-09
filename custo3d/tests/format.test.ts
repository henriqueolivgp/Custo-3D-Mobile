import assert from 'node:assert/strict';
import { test } from 'node:test';
import { formatDuration, formatMoney, formatNumber, parseDecimal, sanitizeDecimal, toInputText } from '../src/lib/format.ts';

test('formatNumber usa vírgula e separador de milhares', () => {
  assert.equal(formatNumber(1234.5), '1\u00A0234,50');
  assert.equal(formatNumber(0), '0,00');
  assert.equal(formatNumber(0.019, 3), '0,019');
  assert.equal(formatNumber(1000000, 0), '1\u00A0000\u00A0000');
  assert.equal(formatNumber(-5.5), '-5,50');
  assert.equal(formatNumber(-0.001), '0,00', 'não mostra -0,00');
  assert.equal(formatNumber(NaN), '0');
});

test('formatMoney acrescenta €', () => {
  assert.equal(formatMoney(3.3456), '3,35\u00A0€');
});

test('formatDuration', () => {
  assert.equal(formatDuration(0), '0 min');
  assert.equal(formatDuration(45), '45 min');
  assert.equal(formatDuration(120), '2 h');
  assert.equal(formatDuration(135), '2 h 15 min');
});

test('parseDecimal aceita vírgula e ponto, rejeita lixo', () => {
  assert.equal(parseDecimal('12,5'), 12.5);
  assert.equal(parseDecimal('12.5'), 12.5);
  assert.equal(parseDecimal(' 7 '), 7);
  assert.equal(parseDecimal(',5'), 0.5);
  assert.equal(parseDecimal(''), null);
  assert.equal(parseDecimal(','), null);
  assert.equal(parseDecimal('1,2,3'), null);
  assert.equal(parseDecimal('abc'), null);
  assert.equal(parseDecimal('-3'), null);
});

test('sanitizeDecimal mantém só dígitos e um separador', () => {
  assert.equal(sanitizeDecimal('12a,5'), '12,5');
  assert.equal(sanitizeDecimal('1,2,3'), '1,23');
  assert.equal(sanitizeDecimal('1.2,3'), '1.23');
  assert.equal(sanitizeDecimal('-5'), '5');
  assert.equal(sanitizeDecimal('abc'), '');
});

test('toInputText', () => {
  assert.equal(toInputText(1000), '1000');
  assert.equal(toInputText(12.5), '12,5');
  assert.equal(toInputText(0.1 + 0.2), '0,3');
});
