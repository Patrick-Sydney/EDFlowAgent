import { create } from "zustand";
import { useJourneyStore } from "@/stores/journeyStore";

// Keep in sync with your app's lane names
export type LanePhase = "Waiting" | "In Triage" | "Roomed" | "Diagnostics" | "Review";

type RoomsIndexState = {
  roomById: Record<string, string | undefined>;
  phaseById: Record<string, LanePhase>;
  /** ticks whenever we recompute, useful for forcing memos to refresh */
  version: number;
  recompute: () => void;
};

// Build maps from Journey events
function build(events: any[]) {
  const roomById: Record<string, string | undefined> = {};
  const phaseById: Record<string, LanePhase> = {};
  for (const ev of events) {
    const pid = ev.patientId;
    if (!pid) continue;
    if (!phaseById[pid]) phaseById[pid] = "Waiting";

    switch (ev.kind) {
      case "triage":
        phaseById[pid] = "In Triage";
        break;
      case "room_change":
      case "room_assigned":             // tolerate alternate names
      case "encounter.location":        // tolerate FHIR-ish event
        // Try several places for the room label
        const label =
          ev.label ??
          (typeof ev.detail === "string" ? ev.detail : ev.detail?.room) ??
          undefined;
        if (label) roomById[pid] = label;
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

export const useRoomsIndex = create<RoomsIndexState>((set) => ({
  roomById: {},
  phaseById: {},
  version: 0,
  recompute: () => {
    const events = useJourneyStore.getState().events;
    const { roomById, phaseById } = build(events);
    set({ roomById, phaseById, version: Date.now() });
  },
}));

// Keep the index in sync with Journey, including on first load
useJourneyStore.subscribe(
  (s) => s.events,
  () => useRoomsIndex.getState().recompute()
);
useRoomsIndex.getState().recompute();