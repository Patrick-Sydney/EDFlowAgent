// stores/selectors.ts
import { useJourneyStore } from "@/stores/journeyStore";

export const useCurrentRoom = (patientId: string) => {
  return useJourneyStore((s) => {
    const ev = [...s.events].reverse().find(e =>
      e.patientId === patientId &&
      (e.kind === "room_change" || e.kind === "room_assigned" || e.kind === "encounter.location")
    );
    return ev?.label ?? (typeof ev?.detail === "string" ? ev.detail : ev?.detail?.room);
  });
};

export const usePhase = (patientId: string) => {
  return useJourneyStore((s) => {
    let phase = "Waiting";
    for (const ev of s.events) {
      if (ev.patientId !== patientId) continue;
      if (ev.kind === "triage") phase = "In Triage";
      if (ev.kind === "room_change") phase = "Roomed";
      if (ev.kind === "order" && phase === "Roomed") phase = "Diagnostics";
      if (ev.kind === "result" && phase === "Diagnostics") phase = "Review";
    }
    return phase;
  });
};

// EWS selectors - single source of truth for all EWS calculations
import { useVitalsStore } from "@/stores/vitalsStore";

export function useLatestObs(patientId: string) {
  return useVitalsStore((s) => s.last(patientId));
}

export function useEwsChip(patientId: string) {
  const last = useVitalsStore((s) => s.last(patientId));
  return { ews: last?.ews, t: last?.t, algoId: last?.algoId ?? "adult-simple-v1" };
}