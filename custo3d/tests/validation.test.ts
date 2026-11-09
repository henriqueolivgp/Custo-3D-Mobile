import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  draftMinutes, emptyProductDraft, emptySpoolDraft, productToDraft, resolveDraftLines, spoolToDraft,
  validateProduct, validateSpool,
} from '../src/lib/validation.ts';
import type { Product, Spool } from '../src/types.ts';

const spool: Spool = { id: 's1', colorName: 'Azul', colorHex: '#3B82F6', type: 'PETG', weightG: 1000, pricePaid: 22.5, createdAt: 0, updatedAt: 0 };

test('bobine válida aceita vírgula decimal', () => {
  const r = validateSpool({ ...emptySpoolDraft(), colorName: ' Azul ', weightG: '750', pricePaid: '18,9' });
  assert.ok(r.ok);
  if (r.ok) {
    assert.equal(r.value.colorName, 'Azul');
    assert.equal(r.value.weightG, 750);
    assert.equal(r.value.pricePaid, 18.9);
  }
});

test('bobine inválida devolve erros por campo', () => {
  const r = validateSpool({ ...emptySpoolDraft(), colorName: '  ', weightG: '0', pricePaid: '' });
  assert.ok(!r.ok);
  if (!r.ok) {
    assert.ok(r.errors.colorName && r.errors.weightG && r.errors.pricePaid);
  }
});

test('rascunho ↔ bobine mantém valores', () => {
  const d = spoolToDraft(spool);
  assert.deepEqual([d.weightG, d.pricePaid], ['1000', '22,5']);
});

test('produto vazio falha em tudo', () => {
  const r = validateProduct(emptyProductDraft(), [spool]);
  assert.ok(!r.ok);
  if (!r.ok) {
    assert.ok(r.errors.name);
    assert.ok(r.errors.time);
    assert.equal(Object.keys(r.errors.lines).length, 1);
  }
});

test('produto válido com snapshot do custo/g', () => {
  const d = emptyProductDraft();
  d.name = 'Suporte telemóvel';
  d.lines = [{ key: 'k', spoolId: 's1', grams: '42,5' }];
  d.hours = '1';
  d.minutes = '30';
  const r = validateProduct(d, [spool]);
  assert.ok(r.ok);
  if (r.ok) {
    assert.equal(r.value.printMinutes, 90);
    assert.equal(r.value.materials[0]!.grams, 42.5);
    assert.equal(r.value.materials[0]!.costPerGramSnapshot, 0.0225);
  }
});

test('linha com bobine apagada: aceita com snapshot, rejeita sem', () => {
  const base = emptyProductDraft();
  base.name = 'x'; base.minutes = '10';
  const withSnap = { ...base, lines: [{ key: 'k', spoolId: 'gone', grams: '5', snapshot: 0.03 }] };
  assert.ok(validateProduct(withSnap, []).ok);
  const noSnap = { ...base, lines: [{ key: 'k', spoolId: 'gone', grams: '5' }] };
  const r = validateProduct(noSnap, []);
  assert.ok(!r.ok);
});

test('tempo: horas e minutos combinam; vazio = 0', () => {
  assert.equal(draftMinutes({ hours: '', minutes: '' }), 0);
  assert.equal(draftMinutes({ hours: '2', minutes: '75' }), 195);
});

test('produto ↔ rascunho e cálculo ao vivo', () => {
  const p: Product = {
    id: 'p', name: 'Vaso', description: 'd', printMinutes: 125, createdAt: 0, updatedAt: 0,
    materials: [{ id: 'm1', spoolId: 's1', grams: 12.5, costPerGramSnapshot: 0.0225 }],
  };
  const d = productToDraft(p);
  assert.deepEqual([d.hours, d.minutes, d.lines[0]!.grams], ['2', '5', '12,5']);
  const calc = resolveDraftLines(d.lines, new Map([['s1', spool]]));
  assert.equal(calc[0]!.grams, 12.5);
  assert.equal(calc[0]!.costPerGram, 0.0225);
});
