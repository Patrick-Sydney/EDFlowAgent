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

  add(patientId: string | number, point: ObsPoint) {
    const id = normalizeId(patientId);
    const list = [...(this.data.get(id) ?? []), point].sort((a,b)=> Date.parse(a.t)-Date.parse(b.t));
    this.data.set(id, list); this.emit();
  }

  bulkUpsert(patientId: string | number, points: ObsPoint[]) {
    const id = normalizeId(patientId);
    const merged = [...this.list(id), ...points].sort((a,b)=> Date.parse(a.t)-Date.parse(b.t));
    const byKey = new Map<string, ObsPoint>();
    for (const p of merged) byKey.set(p.t, p);
    this.data.set(id, Array.from(byKey.values())); this.emit();
  }
}

export const vitalsStore = new VitalsStore();

export function useVitalsList(patientId: string | number) {
  const id = String(patientId ?? "");
  return useSyncExternalStore(
    vitalsStore.subscribe,
    () => vitalsStore.list(id),
    () => vitalsStore.list(id)
  );
}

export function useVitalsLast(patientId: string | number) {
  const id = String(patientId ?? "");
  return useSyncExternalStore(
    vitalsStore.subscribe,
    () => vitalsStore.last(id),
    () => vitalsStore.last(id)
  );
}