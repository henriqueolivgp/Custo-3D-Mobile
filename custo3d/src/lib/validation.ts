import type { FilamentType, Product, ProductInput, Spool, SpoolInput } from '../types.ts';
import { costPerGram } from './calc.ts';
import { parseDecimal, toInputText } from './format.ts';
import { newId } from './ids.ts';

export type Result<V, E> = { ok: true; value: V } | { ok: false; errors: E };

/* ---------- Bobines ---------- */

export interface SpoolDraft {
  colorName: string;
  colorHex: string;
  type: FilamentType;
  weightG: string;
  pricePaid: string;
}

export type SpoolErrors = Partial<Record<'colorName' | 'weightG' | 'pricePaid', string>>;

export function emptySpoolDraft(): SpoolDraft {
  return { colorName: 'Preto', colorHex: '#1B1B1F', type: 'PLA', weightG: '1000', pricePaid: '' };
}

export function spoolToDraft(s: Spool): SpoolDraft {
  return {
    colorName: s.colorName,
    colorHex: s.colorHex,
    type: s.type,
    weightG: toInputText(s.weightG),
    pricePaid: toInputText(s.pricePaid, 2),
  };
}

export function validateSpool(d: SpoolDraft): Result<SpoolInput, SpoolErrors> {
  const errors: SpoolErrors = {};
  const colorName = d.colorName.trim();
  if (!colorName) errors.colorName = 'Indica o nome da cor.';
  else if (colorName.length > 40) errors.colorName = 'Máximo de 40 caracteres.';

  const weightG = parseDecimal(d.weightG);
  if (weightG === null || weightG <= 0) errors.weightG = 'Indica o peso da bobine em gramas.';
  else if (weightG > 20000) errors.weightG = 'Peso demasiado grande.';

  const pricePaid = parseDecimal(d.pricePaid);
  if (pricePaid === null) errors.pricePaid = 'Indica quanto pagaste pela bobine.';
  else if (pricePaid > 10000) errors.pricePaid = 'Valor demasiado alto.';

  if (Object.keys(errors).length > 0 || weightG === null || pricePaid === null) return { ok: false, errors };
  return { ok: true, value: { colorName, colorHex: d.colorHex, type: d.type, weightG, pricePaid } };
}

/* ---------- Produtos ---------- */

export interface LineDraft {
  key: string;
  spoolId: string | null;
  grams: string;
  /** Custo/g guardado, usado se a bobine já não existir. */
  snapshot?: number;
}

export interface ProductDraft {
  name: string;
  description: string;
  lines: LineDraft[];
  hours: string;
  minutes: string;
}

export interface ProductErrors {
  name?: string;
  materials?: string;
  lines: Record<string, { spool?: string; grams?: string }>;
  time?: string;
}

export function emptyProductDraft(): ProductDraft {
  return { name: '', description: '', lines: [{ key: newId(), spoolId: null, grams: '' }], hours: '', minutes: '' };
}

export function productToDraft(p: Product): ProductDraft {
  const h = Math.floor(p.printMinutes / 60);
  const m = p.printMinutes % 60;
  return {
    name: p.name,
    description: p.description,
    lines: p.materials.map((l) => ({
      key: l.id,
      spoolId: l.spoolId,
      grams: toInputText(l.grams),
      snapshot: l.costPerGramSnapshot,
    })),
    hours: h > 0 ? String(h) : '',
    minutes: m > 0 ? String(m) : '',
  };
}

export function draftMinutes(d: Pick<ProductDraft, 'hours' | 'minutes'>): number {
  const h = parseInt(d.hours || '0', 10) || 0;
  const m = parseInt(d.minutes || '0', 10) || 0;
  return h * 60 + m;
}

export interface DraftLineCalc {
  grams: number | null;
  costPerGram: number | null;
}

/** Interpreta as linhas do rascunho (para o cálculo em tempo real). */
export function resolveDraftLines(lines: LineDraft[], spools: Map<string, Spool>): DraftLineCalc[] {
  return lines.map((l) => {
    const grams = parseDecimal(l.grams);
    const spool = l.spoolId ? spools.get(l.spoolId) : undefined;
    const cpg = spool ? costPerGram(spool) : (l.snapshot ?? null);
    return { grams: grams !== null && grams > 0 ? grams : null, costPerGram: l.spoolId ? cpg : null };
  });
}

export function validateProduct(d: ProductDraft, spools: Spool[]): Result<ProductInput, ProductErrors> {
  const errors: ProductErrors = { lines: {} };
  const map = new Map(spools.map((s) => [s.id, s]));

  const name = d.name.trim();
  if (!name) errors.name = 'Dá um nome ao produto.';
  else if (name.length > 80) errors.name = 'Máximo de 80 caracteres.';

  if (d.lines.length === 0) errors.materials = 'Adiciona pelo menos um material.';

  const resolved = resolveDraftLines(d.lines, map);
  const materials: ProductInput['materials'] = [];
  d.lines.forEach((line, i) => {
    const r = resolved[i]!;
    const lineErrors: { spool?: string; grams?: string } = {};
    if (!line.spoolId) lineErrors.spool = 'Escolhe uma bobine.';
    else if (r.costPerGram === null) lineErrors.spool = 'Esta bobine já não existe. Escolhe outra.';
    if (r.grams === null) lineErrors.grams = 'Indica as gramas gastas.';
    if (lineErrors.spool || lineErrors.grams) errors.lines[line.key] = lineErrors;
    else materials.push({ spoolId: line.spoolId!, grams: r.grams!, costPerGramSnapshot: r.costPerGram! });
  });

  const printMinutes = draftMinutes(d);
  if (printMinutes <= 0) errors.time = 'Indica o tempo de impressão.';

  const failed = errors.name || errors.materials || errors.time || Object.keys(errors.lines).length > 0;
  if (failed) return { ok: false, errors };
  return { ok: true, value: { name, description: d.description.trim().slice(0, 500), materials, printMinutes } };
}
