import { useEffect, useState } from "react";

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
    window.dispatchEvent(new CustomEvent("journey:updated", { detail: { patientId: pid }}));
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