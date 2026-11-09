export const FILAMENT_TYPES = ['PLA', 'PLA+', 'PETG', 'ABS', 'ASA', 'TPU', 'Nylon', 'Outro'] as const;
export type FilamentType = (typeof FILAMENT_TYPES)[number];

export interface Spool {
  id: string;
  colorName: string;
  colorHex: string;
  type: FilamentType;
  weightG: number;
  pricePaid: number;
  createdAt: number;
  updatedAt: number;
}

/** Linha de material de um produto. O snapshot só é usado se a bobine tiver sido apagada. */
export interface MaterialLine {
  id: string;
  spoolId: string;
  grams: number;
  costPerGramSnapshot: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  materials: MaterialLine[];
  printMinutes: number;
  createdAt: number;
  updatedAt: number;
}

export interface Settings {
  energyPricePerKwh: number;
  printerWatts: number;
  machineCostPerHour: number;
  failureRatePct: number;
  packagingCost: number;
  marginPct: number;
}

export interface AppData {
  version: 1;
  spools: Spool[];
  products: Product[];
  settings: Settings;
}

export interface SpoolInput {
  colorName: string;
  colorHex: string;
  type: FilamentType;
  weightG: number;
  pricePaid: number;
}

export interface MaterialInput {
  spoolId: string;
  grams: number;
  costPerGramSnapshot: number;
}

export interface ProductInput {
  name: string;
  description: string;
  materials: MaterialInput[];
  printMinutes: number;
}
