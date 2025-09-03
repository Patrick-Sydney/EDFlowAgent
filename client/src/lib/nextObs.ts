// Compute "next obs due" using simple rule: last vitals + interval based on last EWS
// EWS >=5 => 15m, EWS >=3 => 30m, else 60m
import { journeyStore, JourneyEvent } from "@/stores/journeyStore";

export function nextObsDueISO(patientId: string): string | null {
  const all = journeyStore.list(patientId);

  const vitals = [...all].reverse().find(e => e.kind === "vitals");
  if (!vitals) return null;

  const ewsEv = [...all].reverse().find(e => e.kind === "ews_change");
  let ews = 0;
  if (ewsEv && typeof ewsEv.detail === "string") {
    const m = ewsEv.detail.match(/(\d+)/);
    if (m) ews = +m[1];
  }
  const mins = ews >= 5 ? 15 : ews >= 3 ? 30 : 60;
  const d = new Date(vitals.t);
  d.setMinutes(d.getMinutes() + mins);
  return d.toISOString();
}