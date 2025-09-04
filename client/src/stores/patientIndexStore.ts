import { create } from "zustand";
import { useJourneyStore } from "@/stores/journeyStore";

export type Phase = "Waiting" | "In Triage" | "Roomed" | "Diagnostics" | "Review";

type PatientIndexState = {
  roomById: Record<string, string | undefined>;
  phaseById: Record<string, Phase>;
  recompute: () => void;
};

function build(events: ReturnType<typeof useJourneyStore.getState>["events"]) {
  const roomById: Record<string, string | undefined> = {};
  const phaseById: Record<string, Phase> = {};
  const seen = new Set<string>();

  // default all to Waiting lazily; we only care about those with events
  for (const ev of events) {
    const pid = ev.patientId;
    if (!seen.has(pid)) { phaseById[pid] = "Waiting"; seen.add(pid); }

    switch (ev.kind) {
      case "triage":
        phaseById[pid] = "In Triage";
        break;
      case "room_change":
        roomById[pid] = ev.label || (typeof ev.detail === "string" ? ev.detail : ev.detail?.room);
        phaseById[pid] = "Roomed";
        break;
      case "order":
        if (phaseById[pid] === "Roomed") phaseById[pid] = "Diagnostics";
        break;
      case "result":
        if (phaseById[pid] === "Diagnostics") phaseById[pid] = "Review";
        break;
      default:
        break;
    }
  }
  return { roomById, phaseById };
}

export const usePatientIndex = create<PatientIndexState>((set) => ({
  roomById: {},
  phaseById: {},
  recompute: () => {
    const { roomById, phaseById } = build(useJourneyStore.getState().events);
    set({ roomById, phaseById });
  },
}));

// keep index in sync with Journey changes
useJourneyStore.subscribe(() => usePatientIndex.getState().recompute());
// initial build
usePatientIndex.getState().recompute();

// Convenience selectors
export const useRoomFor = (patientId: string) =>
  usePatientIndex((s) => s.roomById[patientId]);

export const usePhaseFor = (patientId: string) =>
  usePatientIndex((s) => s.phaseById[patientId] ?? "Waiting");