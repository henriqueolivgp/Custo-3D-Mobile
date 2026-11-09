import { costPerGram } from '../lib/calc.ts';
import { newId } from '../lib/ids.ts';
import type {
  AppData,
  FilamentType,
  MaterialLine,
  Product,
  ProductInput,
  Settings,
  Spool,
  SpoolInput,
} from '../types.ts';
import { FILAMENT_TYPES } from '../types.ts';

/** Compatível com o AsyncStorage. */
export interface StorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}

export const STORAGE_KEY = 'custo3d:data:v1';

export const DEFAULT_SETTINGS: Settings = {
  energyPricePerKwh: 0.2,
  printerWatts: 150,
  machineCostPerHour: 0.3,
  failureRatePct: 5,
  packagingCost: 0.5,
  marginPct: 50,
};

export interface StoreState {
  ready: boolean;
  /** Não foi possível ler os dados guardados: as alterações não são gravadas, para não os perder. */
  readError: boolean;
  spools: Spool[];
  products: Product[];
  settings: Settings;
}

/* ---------- Validação dos dados lidos do disco ---------- */

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const str = (v: unknown, max: number): string | null => (typeof v === 'string' ? v.slice(0, max) : null);

export function sanitizeSettings(raw: unknown): Settings {
  const out: Settings = { ...DEFAULT_SETTINGS };
  if (!isObj(raw)) return out;
  (Object.keys(DEFAULT_SETTINGS) as (keyof Settings)[]).forEach((k) => {
    const n = num(raw[k]);
    if (n !== null && n >= 0) out[k] = n;
  });
  return out;
}

function sanitizeSpool(raw: unknown): Spool | null {
  if (!isObj(raw)) return null;
  const id = str(raw.id, 40);
  const colorName = str(raw.colorName, 40);
  const weightG = num(raw.weightG);
  const pricePaid = num(raw.pricePaid);
  if (!id || !colorName || weightG === null || weightG <= 0 || pricePaid === null || pricePaid < 0) return null;
  const hex = typeof raw.colorHex === 'string' && /^#[0-9a-fA-F]{6}$/.test(raw.colorHex) ? raw.colorHex : '#8C9096';
  const type = FILAMENT_TYPES.includes(raw.type as FilamentType) ? (raw.type as FilamentType) : 'Outro';
  return {
    id,
    colorName,
    colorHex: hex,
    type,
    weightG,
    pricePaid,
    createdAt: num(raw.createdAt) ?? 0,
    updatedAt: num(raw.updatedAt) ?? 0,
  };
}

function sanitizeProduct(raw: unknown): Product | null {
  if (!isObj(raw)) return null;
  const id = str(raw.id, 40);
  const name = str(raw.name, 80);
  const printMinutes = num(raw.printMinutes);
  if (!id || !name || printMinutes === null || printMinutes < 0) return null;
  const materials: MaterialLine[] = [];
  if (Array.isArray(raw.materials)) {
    for (const m of raw.materials) {
      if (!isObj(m)) continue;
      const mid = str(m.id, 40);
      const spoolId = str(m.spoolId, 40);
      const grams = num(m.grams);
      const snap = num(m.costPerGramSnapshot);
      if (!mid || !spoolId || grams === null || grams <= 0) continue;
      materials.push({ id: mid, spoolId, grams, costPerGramSnapshot: snap !== null && snap >= 0 ? snap : 0 });
    }
  }
  return {
    id,
    name,
    description: str(raw.description, 500) ?? '',
    materials,
    printMinutes,
    createdAt: num(raw.createdAt) ?? 0,
    updatedAt: num(raw.updatedAt) ?? 0,
  };
}

export function sanitizeData(raw: unknown): Pick<StoreState, 'spools' | 'products' | 'settings'> {
  const o = isObj(raw) ? raw : {};
  const spools = (Array.isArray(o.spools) ? o.spools : []).map(sanitizeSpool).filter((s): s is Spool => s !== null);
  const products = (Array.isArray(o.products) ? o.products : [])
    .map(sanitizeProduct)
    .filter((p): p is Product => p !== null);
  return { spools, products, settings: sanitizeSettings(o.settings) };
}

/* ---------- Store ---------- */

export function createStore(adapter: StorageAdapter, options: { debounceMs?: number } = {}) {
  const debounceMs = options.debounceMs ?? 400;
  let state: StoreState = {
    ready: false,
    readError: false,
    spools: [],
    products: [],
    settings: { ...DEFAULT_SETTINGS },
  };
  const listeners = new Set<() => void>();
  let timer: ReturnType<typeof setTimeout> | null = null;
  let dirty = false;
  let queue: Promise<void> = Promise.resolve();

  const getState = () => state;
  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  };

  function flush(): Promise<void> {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    if (dirty && state.ready && !state.readError) {
      dirty = false;
      const data: AppData = { version: 1, spools: state.spools, products: state.products, settings: state.settings };
      const payload = JSON.stringify(data);
      queue = queue
        .then(() => adapter.setItem(STORAGE_KEY, payload))
        .catch(() => {
          dirty = true; // volta a tentar na próxima alteração ou ao ir para segundo plano
        });
    }
    return queue;
  }

  function set(patch: Partial<StoreState>, persist = true) {
    state = { ...state, ...patch };
    listeners.forEach((l) => l());
    if (persist) {
      dirty = true;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        void flush();
      }, debounceMs);
    }
  }

  async function load(): Promise<void> {
    let raw: string | null = null;
    let readError = false;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        raw = await adapter.getItem(STORAGE_KEY);
        readError = false;
        break;
      } catch {
        readError = true;
        await new Promise((r) => setTimeout(r, 150));
      }
    }
    let loaded: Pick<StoreState, 'spools' | 'products' | 'settings'> = {
      spools: [],
      products: [],
      settings: { ...DEFAULT_SETTINGS },
    };
    if (raw) {
      try {
        loaded = sanitizeData(JSON.parse(raw));
      } catch {
        // Dados corrompidos: guarda uma cópia para recuperação e arranca limpo.
        await adapter.setItem(STORAGE_KEY + ':corrupt', raw).catch(() => undefined);
      }
    }
    set({ ...loaded, ready: true, readError }, false);
  }

  function saveSpool(input: SpoolInput, id?: string): Spool {
    const now = Date.now();
    const existing = id ? state.spools.find((s) => s.id === id) : undefined;
    const spool: Spool = existing
      ? { ...existing, ...input, updatedAt: now }
      : { ...input, id: newId(), createdAt: now, updatedAt: now };
    const spools = existing ? state.spools.map((s) => (s.id === spool.id ? spool : s)) : [spool, ...state.spools];

    // Mantém os snapshots dos produtos em dia com o preço atual da bobine.
    const cpg = costPerGram(spool);
    const stale = (p: Product) => p.materials.some((m) => m.spoolId === spool.id && m.costPerGramSnapshot !== cpg);
    const products = state.products.some(stale)
      ? state.products.map((p) =>
          stale(p)
            ? {
                ...p,
                materials: p.materials.map((m) => (m.spoolId === spool.id ? { ...m, costPerGramSnapshot: cpg } : m)),
              }
            : p,
        )
      : state.products; // mesma referência: ecrãs de produtos não re-renderizam
    set({ spools, products });
    return spool;
  }

  function removeSpool(id: string): void {
    set({ spools: state.spools.filter((s) => s.id !== id) });
  }

  function saveProduct(input: ProductInput, id?: string): Product {
    const now = Date.now();
    const existing = id ? state.products.find((p) => p.id === id) : undefined;
    const materials: MaterialLine[] = input.materials.map((m) => ({ ...m, id: newId() }));
    const product: Product = existing
      ? { ...existing, ...input, materials, updatedAt: now }
      : { ...input, materials, id: newId(), createdAt: now, updatedAt: now };
    const products = existing
      ? state.products.map((p) => (p.id === product.id ? product : p))
      : [product, ...state.products];
    set({ products });
    return product;
  }

  function removeProduct(id: string): void {
    set({ products: state.products.filter((p) => p.id !== id) });
  }

  function updateSettings(patch: Partial<Settings>): void {
    set({ settings: sanitizeSettings({ ...state.settings, ...patch }) });
  }

  function productsUsingSpool(spoolId: string): number {
    return state.products.filter((p) => p.materials.some((m) => m.spoolId === spoolId)).length;
  }

  return {
    getState,
    subscribe,
    load,
    flush,
    saveSpool,
    removeSpool,
    saveProduct,
    removeProduct,
    updateSettings,
    productsUsingSpool,
  };
}

export type Store = ReturnType<typeof createStore>;
