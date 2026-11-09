import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DEFAULT_SETTINGS, STORAGE_KEY, createStore, sanitizeData } from '../src/store/createStore.ts';
import type { SpoolInput } from '../src/types.ts';
import { MemoryAdapter, sleep } from './helpers.ts';

const input: SpoolInput = { colorName: 'Preto', colorHex: '#1B1B1F', type: 'PLA', weightG: 1000, pricePaid: 20 };

async function fresh(adapter = new MemoryAdapter(), debounceMs = 5) {
  const store = createStore(adapter, { debounceMs });
  await store.load();
  return { store, adapter };
}

test('arranque vazio com definições por omissão', async () => {
  const { store } = await fresh();
  const s = store.getState();
  assert.equal(s.ready, true);
  assert.deepEqual(s.spools, []);
  assert.deepEqual(s.settings, DEFAULT_SETTINGS);
});

test('guarda e volta a carregar tudo (persistência)', async () => {
  const { store, adapter } = await fresh();
  const spool = store.saveSpool(input);
  const product = store.saveProduct({
    name: 'Chaveiro', description: 'Com argola', printMinutes: 45,
    materials: [{ spoolId: spool.id, grams: 8, costPerGramSnapshot: 0.02 }],
  });
  store.updateSettings({ marginPct: 80 });
  await store.flush();

  const { store: again } = await fresh(adapter);
  const s = again.getState();
  assert.equal(s.spools.length, 1);
  assert.equal(s.spools[0]!.id, spool.id);
  assert.equal(s.products[0]!.id, product.id);
  assert.equal(s.products[0]!.materials[0]!.grams, 8);
  assert.equal(s.settings.marginPct, 80);
});

test('várias alterações seguidas geram uma só escrita (debounce)', async () => {
  const { store, adapter } = await fresh(new MemoryAdapter(), 20);
  for (let i = 0; i < 10; i++) store.saveSpool({ ...input, colorName: 'C' + i });
  await sleep(80);
  await store.flush();
  assert.equal(adapter.writes, 1);
  assert.equal(JSON.parse(adapter.data.get(STORAGE_KEY)!).spools.length, 10);
});

test('editar bobine atualiza snapshots dos produtos; apagar mantém o produto', async () => {
  const { store } = await fresh();
  const spool = store.saveSpool(input);
  const p = store.saveProduct({
    name: 'X', description: '', printMinutes: 10,
    materials: [{ spoolId: spool.id, grams: 10, costPerGramSnapshot: 0.02 }],
  });
  store.saveSpool({ ...input, pricePaid: 30 }, spool.id);
  assert.equal(store.getState().spools.length, 1);
  assert.equal(store.getState().products[0]!.materials[0]!.costPerGramSnapshot, 0.03);
  assert.equal(store.productsUsingSpool(spool.id), 1);

  store.removeSpool(spool.id);
  assert.equal(store.getState().spools.length, 0);
  assert.equal(store.getState().products[0]!.id, p.id);
});

test('editar produto mantém id e createdAt; novos aparecem primeiro', async () => {
  const { store } = await fresh();
  const mat = [{ spoolId: 's', grams: 1, costPerGramSnapshot: 0.01 }];
  const a = store.saveProduct({ name: 'A', description: '', printMinutes: 5, materials: mat });
  const b = store.saveProduct({ name: 'B', description: '', printMinutes: 5, materials: mat });
  assert.deepEqual(store.getState().products.map((p) => p.name), ['B', 'A']);
  const a2 = store.saveProduct({ name: 'A2', description: '', printMinutes: 9, materials: mat }, a.id);
  assert.equal(a2.id, a.id);
  assert.equal(a2.createdAt, a.createdAt);
  assert.equal(store.getState().products.length, 2);
  store.removeProduct(b.id);
  assert.equal(store.getState().products.length, 1);
});

test('notifica subscritores e permite cancelar', async () => {
  const { store } = await fresh();
  let calls = 0;
  const off = store.subscribe(() => calls++);
  store.saveSpool(input);
  assert.equal(calls, 1);
  off();
  store.saveSpool(input);
  assert.equal(calls, 1);
});

test('referências estáveis: alterar bobines não muda products/settings', async () => {
  const { store } = await fresh();
  const before = store.getState();
  store.saveSpool(input);
  const after = store.getState();
  assert.equal(after.products, before.products);
  assert.equal(after.settings, before.settings);
  assert.notEqual(after.spools, before.spools);
});

test('JSON corrompido: arranca limpo, guarda cópia e continua a gravar', async () => {
  const adapter = new MemoryAdapter();
  adapter.data.set(STORAGE_KEY, '{not json');
  const { store } = await fresh(adapter);
  assert.deepEqual(store.getState().spools, []);
  assert.equal(adapter.data.get(STORAGE_KEY + ':corrupt'), '{not json');
  assert.equal(store.getState().readError, false);
  store.saveSpool(input);
  await store.flush();
  assert.equal(JSON.parse(adapter.data.get(STORAGE_KEY)!).spools.length, 1);
});

test('falha de leitura: não grava por cima dos dados existentes', async () => {
  const adapter = new MemoryAdapter();
  adapter.data.set(STORAGE_KEY, JSON.stringify({ version: 1, spools: [{ ...input, id: 'a', createdAt: 1, updatedAt: 1 }], products: [], settings: {} }));
  adapter.failReads = true;
  const { store } = await fresh(adapter);
  assert.equal(store.getState().readError, true);
  store.saveSpool(input);
  await store.flush();
  assert.equal(adapter.writes, 0);
  assert.equal(JSON.parse(adapter.data.get(STORAGE_KEY)!).spools.length, 1);
});

test('falha de escrita é recuperada no flush seguinte', async () => {
  const { store, adapter } = await fresh();
  adapter.failWrites = true;
  store.saveSpool(input);
  await store.flush();
  assert.equal(adapter.writes, 0);
  adapter.failWrites = false;
  store.saveSpool({ ...input, colorName: 'Outra' });
  await store.flush();
  assert.equal(adapter.writes, 1);
  assert.equal(JSON.parse(adapter.data.get(STORAGE_KEY)!).spools.length, 2);
});

test('sanitizeData descarta entradas inválidas e corrige campos', () => {
  const d = sanitizeData({
    spools: [
      { id: 'ok', colorName: 'A', colorHex: 'xyz', type: 'WOOD', weightG: 500, pricePaid: 10 },
      { id: 'bad', colorName: 'B', weightG: -1, pricePaid: 10 },
      null, 'lixo',
    ],
    products: [
      { id: 'p', name: 'P', printMinutes: 10, materials: [{ id: 'm', spoolId: 'ok', grams: 5 }, { id: 'x', spoolId: 'ok', grams: 0 }] },
      { id: 'q', name: '', printMinutes: 10 },
    ],
    settings: { marginPct: -5, packagingCost: 2, energyPricePerKwh: 'x' },
  });
  assert.equal(d.spools.length, 1);
  assert.equal(d.spools[0]!.type, 'Outro');
  assert.equal(d.spools[0]!.colorHex, '#8C9096');
  assert.equal(d.products.length, 1);
  assert.equal(d.products[0]!.materials.length, 1);
  assert.equal(d.settings.marginPct, DEFAULT_SETTINGS.marginPct);
  assert.equal(d.settings.packagingCost, 2);
  assert.equal(d.settings.energyPricePerKwh, DEFAULT_SETTINGS.energyPricePerKwh);
  assert.deepEqual(sanitizeData(null).spools, []);
});
