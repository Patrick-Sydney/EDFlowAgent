import { normalizeRawObs } from "./normalize";
import { computeEws } from "@/clinical/ews";
import { useVitalsStore } from "@/stores/vitalsStore";
import { useJourneyStore } from "@/stores/journeyStore";

const ALGO = "adult-simple-v1" as const;

export function saveObservation(
  patientId: string,
  raw: any,
  actor: "RN"|"HCA"|"MD"="RN"
) {
  const now = new Date().toISOString();
  const n = normalizeRawObs(raw);
  const ews = computeEws(
    { rr: n.rr, hr: n.hr, sbp: n.sbp, spo2: n.spo2, temp: n.temp, loc: n.loc, onOxygen: n.o2?.onOxygen },
    ALGO
  );

  const obs = { t: now, ...n, ews, algoId: ALGO, source: n.source ?? "obs" } as const;

  useVitalsStore.getState().append(patientId, obs);

  // Journey: vitals
  useJourneyStore.getState().append({
    id: crypto.randomUUID(), patientId, t: now,
    kind: "vitals", label: "Obs",
    detail: { ...n, ews, algoId: ALGO, source: obs.source, actor, complete: hasCore(n) }
  });

  // Journey: ews_change (if delta)
  const prev = useVitalsStore.getState().lastEws(patientId);
  if (prev == null || prev !== ews) {
    useJourneyStore.getState().append({
      id: crypto.randomUUID(), patientId, t: now,
      kind: "ews_change", label: `EWS ${prev ?? "—"} → ${ews}`,
      severity: ews >= 5 ? "warn" : undefined,
      detail: { prev, next: ews, delta: prev == null ? null : ews - prev }
    });
  }

  return obs;
}

function hasCore(n: any) {
  return n.rr != null && n.hr != null && n.sbp != null && n.spo2 != null && n.temp != null;
}