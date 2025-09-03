import { create, type StoreApi, type UseBoundStore } from "zustand";

export type JourneyEvent = {
  id: string;
  patientId: string;
  t: string;
  kind: string;
  label?: string;
  detail?: any;
  actor?: string;
  severity?: "info"|"warn"|"crit";
  ref?: string;
};

export type LanePhase = "Waiting" | "In Triage" | "Roomed" | "Diagnostics" | "Review";

type JourneyState = {
  events: JourneyEvent[];
  append: (ev: JourneyEvent) => void;
  hydrate: (evs: JourneyEvent[]) => void;
};

// ensure single instance even under HMR
let store: UseBoundStore<StoreApi<JourneyState>> =
  (globalThis as any).__EDFLOW_JOURNEY__;

if (!store) {
  store = create<JourneyState>((set) => ({
    events: [],
    append: (ev) => set((s) => ({ events: [...s.events, ev] })),   // immutable
    hydrate: (evs) => set(() => ({ events: [...evs] })),           // immutable
  }));
  (globalThis as any).__EDFLOW_JOURNEY__ = store;
  // dev visibility  
  if (import.meta?.env?.MODE !== "production") {
    console.info("[journeyStore] singleton created v2");
    store.subscribe((s) => {
      console.debug("[journeyStore] events:", s.events.length, "last:", s.events.at(-1)?.kind);
    });
    (window as any).EDJourney = {
      get: () => store.getState(),
      append: (ev: JourneyEvent) => store.getState().append(ev),
    };
  }
}

export const useJourneyStore = store;

// Legacy exports for compatibility
export const useJourney = () => {
  const events = useJourneyStore(s => s.events);
  return { events };
};

// Legacy journeyStore object for compatibility
export const journeyStore = {
  add(patientId: string|number, ev: Omit<JourneyEvent, "id"|"patientId"|"t"> & { t?: string }) {
    const pid = String(patientId);
    const item: JourneyEvent = {
      id: `${pid}-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
      patientId: pid,
      t: ev.t ?? new Date().toISOString(),
      kind: ev.kind,
      severity: ev.severity,
      label: ev.label || "",
      detail: ev.detail,
      actor: ev.actor,
      ref: ev.ref,
    };
    useJourneyStore.getState().append(item);
  },
  list(patientId: string|number): JourneyEvent[] {
    const pid = String(patientId);
    return useJourneyStore.getState().events.filter(e => e.patientId === pid);
  }
};