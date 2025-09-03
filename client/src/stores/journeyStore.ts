import { useEffect, useState } from "react";
import { create } from "zustand";

export type LanePhase = "Waiting" | "In Triage" | "Roomed" | "Diagnostics" | "Review";

export type JourneyEvent = {
  id: string;
  patientId: string;
  t: string; // ISO
  kind:
    | "arrival" | "triage" | "room_change" | "vitals" | "ews_change"
    | "order" | "result" | "med_admin" | "task"
    | "note" | "communication" | "alert";
  severity?: "info" | "attention" | "critical";
  label: string;
  detail?: string;
  actor?: { id?: string; name?: string; role?: "RN"|"MD"|"Clerk" };
  ref?: { type: string; id: string };
};

type MapT = Record<string, JourneyEvent[]>;
const eventsByPatient: MapT = {};

function sortByTimeAsc(a: JourneyEvent, b: JourneyEvent) {
  return Date.parse(a.t) - Date.parse(b.t);
}

// helper: build indexes once per mutation
function buildIndexes(events: JourneyEvent[]) {
  const currentRoomById: Record<string, string | undefined> = {};
  const phaseById: Record<string, LanePhase> = {};

  // We assume time ascending; if not guaranteed, sort a copy by time
  const evs = [...events].sort((a,b)=> new Date(a.t).getTime() - new Date(b.t).getTime());

  for (const ev of evs) {
    const pid = ev.patientId;
    if (!phaseById[pid]) phaseById[pid] = "Waiting";

    switch (ev.kind) {
      case "triage":
        phaseById[pid] = "In Triage";
        break;
      case "room_change":
        // update room and bump phase
        currentRoomById[pid] = ev.label;
        phaseById[pid] = "Roomed";
        break;
      case "order":
        if (phaseById[pid] === "Roomed") phaseById[pid] = "Diagnostics";
        break;
      case "result":
        // simple heuristic: after first results, move to Review if not already
        if (phaseById[pid] === "Diagnostics") phaseById[pid] = "Review";
        break;
      default:
        break;
    }
  }
  return { currentRoomById, phaseById };
}

type JourneyState = {
  events: JourneyEvent[];
  // NEW live indexes
  currentRoomById: Record<string, string | undefined>;
  phaseById: Record<string, LanePhase>;
  append: (ev: JourneyEvent) => void;
  hydrate?: (evs: JourneyEvent[]) => void;
};

export const useJourneyStore = create<JourneyState>((set, get) => ({
  events: [],
  currentRoomById: {},
  phaseById: {},
  append: (ev) => {
    console.log("[DEBUG] JourneyStore.append called with:", ev);
    set((s) => {
      const newEvents = [...s.events, ev];
      const indexes = buildIndexes(newEvents);
      return { 
        events: newEvents, 
        currentRoomById: indexes.currentRoomById, 
        phaseById: indexes.phaseById 
      };
    });
  },
  hydrate: (evs) => set({ events: [...evs] }),
}));

export const journeyStore = {
  add(patientId: string|number, ev: Omit<JourneyEvent, "id"|"patientId"|"t"> & { t?: string }) {
    const pid = String(patientId);
    const list = (eventsByPatient[pid] ||= []);
    const item: JourneyEvent = {
      id: `${pid}-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
      patientId: pid,
      t: ev.t ?? new Date().toISOString(),
      kind: ev.kind,
      severity: ev.severity,
      label: ev.label,
      detail: ev.detail,
      actor: ev.actor,
      ref: ev.ref,
    };
    // guard duplicate write based on recent similar events
    const last = list.at(-1);
    if (last && last.label === ev.label && Date.parse(item.t) - Date.parse(last.t) < 100) {
      return last; // skip duplicate
    }
    list.push(item);
    list.sort(sortByTimeAsc);
    // Also update the zustand store
    const fullEvent: JourneyEvent = item;
    // Also update the zustand store
    useJourneyStore.getState().append(fullEvent);
    return item;
  },
  list(patientId: string|number) {
    const pid = String(patientId);
    return (eventsByPatient[pid] ||= []).slice().sort(sortByTimeAsc);
  },
};

/** Subscribe-ish hook (event + light poll as fallback). */
export function useJourney(patientId: string|number, pollMs = 1500) {
  const pid = String(patientId);
  const [rows, setRows] = useState<JourneyEvent[]>(() => journeyStore.list(pid));
  useEffect(() => {
    setRows(journeyStore.list(pid));
    const id = window.setInterval(() => setRows(journeyStore.list(pid)), pollMs);
    const onUpd = (e: Event) => {
      const d = (e as CustomEvent).detail;
      if (!d?.patientId || String(d.patientId) === pid) {
        setRows(journeyStore.list(pid));
      }
    };
    window.addEventListener("journey:updated", onUpd as EventListener);
    return () => { window.clearInterval(id); window.removeEventListener("journey:updated", onUpd as EventListener); };
  }, [pid, pollMs]);
  return rows;
}