import assert from 'node:assert/strict';
import { test } from 'node:test';
import { calcBreakdown, costPerGram, productBreakdown, resolveLines } from '../src/lib/calc.ts';
import type { Product, Spool } from '../src/types.ts';
import { SETTINGS } from './helpers.ts';

const close = (a: number, b: number, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} !== ${b}`);

const spool = (id: string, price: number, weight: number): Spool => ({
  id, colorName: 'Preto', colorHex: '#000000', type: 'PLA', weightG: weight, pricePaid: price, createdAt: 0, updatedAt: 0,
});

test('custo por grama', () => {
  close(costPerGram({ pricePaid: 20, weightG: 1000 }), 0.02);
  assert.equal(costPerGram({ pricePaid: 20, weightG: 0 }), 0);
});

test('cálculo completo: 50 g a 0,02 €/g, 2 h', () => {
  const b = calcBreakdown([{ grams: 50, costPerGram: 0.02 }], 120, SETTINGS);
  close(b.material, 1.0);
  close(b.energy, 0.12 * 2 * 0.2); // 0,048
  close(b.wear, 0.6);
  close(b.failures, (1.0 + 0.048 + 0.6) * 0.05); // 0,0824
  close(b.packaging, 0.5);
  close(b.cost, 2.2304);
  close(b.price, 2.2304 * 1.5);
  close(b.profit, b.price - b.cost);
  close(b.hours, 2);
});

test('várias bobines somam', () => {
  const b = calcBreakdown(
    [{ grams: 30, costPerGram: 0.02 }, { grams: 10, costPerGram: 0.05 }],
    0,
    { ...SETTINGS, packagingCost: 0, failureRatePct: 0, marginPct: 0 },
  );
  close(b.material, 0.6 + 0.5);
  close(b.cost, 1.1);
  close(b.price, 1.1);
});

test('valores negativos não geram custos negativos', () => {
  const b = calcBreakdown([{ grams: -10, costPerGram: 0.02 }], -30, SETTINGS);
  assert.equal(b.material, 0);
  assert.equal(b.energy, 0);
  assert.equal(b.wear, 0);
});

test('bobine apagada usa o snapshot; bobine existente usa o preço atual', () => {
  const product: Product = {
    id: 'p', name: 'x', description: '', printMinutes: 60, createdAt: 0, updatedAt: 0,
    materials: [
      { id: 'a', spoolId: 's1', grams: 100, costPerGramSnapshot: 0.01 },
      { id: 'b', spoolId: 'gone', grams: 100, costPerGramSnapshot: 0.03 },
    ],
  };
  const map = new Map([['s1', spool('s1', 30, 1000)]]);
  const r = resolveLines(product.materials, map);
  assert.equal(r[0]!.missing, false);
  close(r[0]!.costPerGram, 0.03);
  assert.equal(r[1]!.missing, true);
  close(r[1]!.costPerGram, 0.03);
  close(productBreakdown(product, map, SETTINGS).material, 6);
});
