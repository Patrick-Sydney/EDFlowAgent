import { useJourneyStore } from "@/stores/journeyStore";
import { usePatientIndex } from "@/stores/patientIndexStore";

export function assignRoom(patientId: string, roomLabel: string, actor="Charge RN") {
  if (!patientId || !roomLabel.trim()) return;

  // 1) append Journey event (source of truth)
  useJourneyStore.getState().append({
    id: crypto.randomUUID(),
    patientId,
    t: new Date().toISOString(),
    kind: "room_change",
    label: roomLabel.trim(),
    actor,
  });

  // 2) recompute the derived index immediately (header + lanes react)
  usePatientIndex.getState().recompute();
}