// src/stores/vitalsStore.ts
import { useSyncExternalStore } from "react";

export type ObsPoint = {
  t: string;
  rr?: number; spo2?: number; hr?: number; sbp?: number; temp?: number; ews?: number;
  source?: "triage" | "obs" | "device";
};

const normalizeId = (id: unknown) => String(id ?? "");

class VitalsStore {
  private data = new Map<string, ObsPoint[]>();
  private listeners = new Set<() => void>();
  private cache = new Map<string, { list: ObsPoint[], last?: ObsPoint }>();

  subscribe = (fn: () => void) => { this.listeners.add(fn); return () => this.listeners.delete(fn); };
  private emit() { 
    this.cache.clear(); // Clear cache when data changes
    this.listeners.forEach(fn => fn()); 
  }

  list(patientId: string) { 
    const id = normalizeId(patientId);
    if (!this.cache.has(id)) {
      const list = this.data.get(id) ?? [];
      this.cache.set(id, { list, last: list[list.length - 1] });
    }
    return this.cache.get(id)!.list;
  }
  
  last(patientId: string) { 
    const id = normalizeId(patientId);
    if (!this.cache.has(id)) {
      const list = this.data.get(id) ?? [];
      this.cache.set(id, { list, last: list[list.length - 1] });
    }
    return this.cache.get(id)!.last;
  }

  add(patientId: string, point: ObsPoint) {
    const id = normalizeId(patientId);
    const list = [...(this.data.get(id) ?? []), point].sort((a, b) => Date.parse(a.t) - Date.parse(b.t));
    this.data.set(id, list); this.emit();
  }

  bulkUpsert(patientId: string, points: ObsPoint[]) {
    const id = normalizeId(patientId);
    const merged = [...this.list(id), ...points].sort((a, b) => Date.parse(a.t) - Date.parse(b.t));
    // de-dupe by timestamp
    const dedup: ObsPoint[] = [];
    const seen = new Set(merged.map(p => p.t));
    for (const p of merged) if (!dedup.find(d => d.t === p.t)) dedup.push(p);
    this.data.set(id, dedup); this.emit();
  }
}

export const vitalsStore = new VitalsStore();

export function useVitalsList(patientId: string | number) {
  const id = normalizeId(patientId);
  return useSyncExternalStore(
    vitalsStore.subscribe,
    () => vitalsStore.list(id),
    () => vitalsStore.list(id)
  );
}

export function useVitalsLast(patientId: string | number) {
  const id = normalizeId(patientId);
  return useSyncExternalStore(
    vitalsStore.subscribe,
    () => vitalsStore.last(id),
    () => vitalsStore.last(id)
  );
}