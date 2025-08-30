import { useSyncExternalStore } from "react";

export type ObsPoint = {
  t: string;
  rr?: number; spo2?: number; hr?: number; sbp?: number; temp?: number; ews?: number;
  source?: "triage" | "obs" | "device";
};

const normalizeId = (id: unknown) => String(id ?? "");
const LS_KEY = "edflow_vitals_v1";
let saveTimer: any = null;

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
    console.log("VitalsStore.add:", id, point, "total points:", list.length);
    this.data.set(id, list); this.emit();
    this.persist();
  }

  bulkUpsert(patientId: string | number, points: ObsPoint[]) {
    const id = normalizeId(patientId);
    const merged = [...this.list(id), ...points].sort((a,b)=> Date.parse(a.t)-Date.parse(b.t));
    const byKey = new Map<string, ObsPoint>();
    for (const p of merged) byKey.set(p.t, p);
    this.data.set(id, Array.from(byKey.values())); this.emit();
    this.persist();
  }

  hydrateFromLocal() {
    try {
      const raw = typeof localStorage !== "undefined" ? localStorage.getItem(LS_KEY) : null;
      if (!raw) return;
      const obj = JSON.parse(raw) as Record<string, ObsPoint[]>;
      Object.entries(obj).forEach(([k, v]) => this.data.set(k, v));
      this.emit();
    } catch {}
  }

  private persist() {
    if (typeof localStorage === "undefined") return;
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      const obj: Record<string, ObsPoint[]> = {};
      this.data.forEach((v, k) => { obj[k] = v; });
      try { localStorage.setItem(LS_KEY, JSON.stringify(obj)); } catch {}
    }, 120);
  }
}

export const vitalsStore = new VitalsStore();
// Hydrate once on module import
try { vitalsStore.hydrateFromLocal(); } catch {}

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