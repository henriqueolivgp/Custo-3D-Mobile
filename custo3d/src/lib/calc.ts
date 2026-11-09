import type { MaterialLine, Product, Settings, Spool } from '../types.ts';

export interface Breakdown {
  material: number;
  energy: number;
  wear: number;
  failures: number;
  packaging: number;
  /** Custo total de produção. */
  cost: number;
  /** Preço de venda = custo × (1 + margem). */
  price: number;
  profit: number;
  hours: number;
}

export interface CalcLine {
  grams: number;
  costPerGram: number;
}

export function costPerGram(spool: Pick<Spool, 'pricePaid' | 'weightG'>): number {
  return spool.weightG > 0 ? spool.pricePaid / spool.weightG : 0;
}

export function calcBreakdown(lines: CalcLine[], minutes: number, s: Settings): Breakdown {
  const hours = Math.max(0, minutes) / 60;
  const material = lines.reduce((sum, l) => sum + Math.max(0, l.grams) * l.costPerGram, 0);
  const energy = (s.printerWatts / 1000) * hours * s.energyPricePerKwh;
  const wear = hours * s.machineCostPerHour;
  const failures = (material + energy + wear) * (s.failureRatePct / 100);
  const packaging = s.packagingCost;
  const cost = material + energy + wear + failures + packaging;
  const price = cost * (1 + s.marginPct / 100);
  return { material, energy, wear, failures, packaging, cost, price, profit: price - cost, hours };
}

export interface ResolvedLine {
  line: MaterialLine;
  spool: Spool | undefined;
  costPerGram: number;
  /** A bobine foi apagada: usa-se o custo guardado. */
  missing: boolean;
}

export function resolveLines(materials: MaterialLine[], spools: Map<string, Spool>): ResolvedLine[] {
  return materials.map((line) => {
    const spool = spools.get(line.spoolId);
    return {
      line,
      spool,
      costPerGram: spool ? costPerGram(spool) : line.costPerGramSnapshot,
      missing: !spool,
    };
  });
}

export function productBreakdown(product: Product, spools: Map<string, Spool>, settings: Settings): Breakdown {
  const lines = resolveLines(product.materials, spools).map((r) => ({
    grams: r.line.grams,
    costPerGram: r.costPerGram,
  }));
  return calcBreakdown(lines, product.printMinutes, settings);
}
