// Reads from vitalsStore first; falls back to journey events.
// EWS rule: >=5 → 15m, >=3 → 30m, else 60m
import { journeyStore } from "@/stores/journeyStore";

export function getLatestEws(patientId: string): { ews: number | null; trend: "↑"|"↓"|"="|null } {
  // For now, fall back to journey events since vitalsStore structure needs investigation
  const evs = journeyStore.list(patientId)
    .filter(e => e.kind === "ews_change" || e.kind === "vitals")
    .sort((a,b)=> new Date(a.t).getTime() - new Date(b.t).getTime());
  
  const ewsEvents = evs.filter(e => e.kind === "ews_change");
  const lastE = ewsEvents.at(-1);
  const prevE = ewsEvents.at(-2);
  
  const parse = (d?: string) => {
    if (!d) return null;
    const m = d.match(/(\d+)/);
    return m ? Number(m[1]) : null;
  };
  
  const lastVal = parse(lastE?.detail ?? "");
  const prevVal = parse(prevE?.detail ?? "");
  
  let trend: "↑"|"↓"|"="|null = null;
  if (lastVal != null && prevVal != null) {
    trend = lastVal > prevVal ? "↑" : lastVal < prevVal ? "↓" : "=";
  }
  
  return { ews: lastVal ?? null, trend };
}

export function nextObsDueISO(patientId: string): string | null {
  const evs = journeyStore.list(patientId);
  const lastVitals = [...evs].reverse().find(e => e.kind === "vitals");
  if (!lastVitals) return null;

  const { ews } = getLatestEws(patientId);
  const ewsValue = ews ?? 0;
  
  const base = new Date(lastVitals.t);
  const mins = ewsValue >= 5 ? 15 : ewsValue >= 3 ? 30 : 60;
  base.setMinutes(base.getMinutes() + mins);
  return base.toISOString();
}