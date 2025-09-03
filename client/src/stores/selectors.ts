// stores/selectors.ts
import { useJourneyStore } from "./journeyStore";

export const useCurrentRoom = (patientId: string) =>
  useJourneyStore((s) => s.currentRoomById[patientId]);

export const usePhase = (patientId: string) =>
  useJourneyStore((s) => s.phaseById[patientId] ?? "Waiting");