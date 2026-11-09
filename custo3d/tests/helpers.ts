import type { StorageAdapter } from '../src/store/createStore.ts';

export class MemoryAdapter implements StorageAdapter {
  data = new Map<string, string>();
  writes = 0;
  failReads = false;
  failWrites = false;
  async getItem(key: string) {
    if (this.failReads) throw new Error('read failed');
    return this.data.get(key) ?? null;
  }
  async setItem(key: string, value: string) {
    if (this.failWrites) throw new Error('write failed');
    this.writes++;
    this.data.set(key, value);
  }
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const SETTINGS = {
  energyPricePerKwh: 0.2,
  printerWatts: 120,
  machineCostPerHour: 0.3,
  failureRatePct: 5,
  packagingCost: 0.5,
  marginPct: 50,
};
