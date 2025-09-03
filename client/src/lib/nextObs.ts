// Compute "next obs due" using simple rule: last vitals + interval based on last EWS
// EWS >=5 => 15m, EWS >=3 => 30m, else 60m
import { journeyStore, JourneyEvent } from "@/stores/journeyStore";

export function nextObsDueISO(patientId: string): string | null {
  const evs = journeyStore.list(patientId);

  const lastVitals = [...evs].reverse().find(e => e.kind === "vitals");
  if (!lastVitals) return null;

  // try to find last EWS value
  let ews = 0;
  const lastEws = [...evs].reverse().find(e => e.kind === "ews_change");
  if (lastEws && typeof lastEws.detail === "string") {
    const m = lastEws.detail.match(/(\d+)/); // crude parse if detail="EWS=5"
    if (m) ews = Number(m[1]);
  }

  const base = new Date(lastVitals.t);
  const mins = ews >= 5 ? 15 : ews >= 3 ? 30 : 60;
  base.setMinutes(base.getMinutes() + mins);
  return base.toISOString();
}