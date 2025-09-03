import { useJourneyStore } from "@/stores/journeyStore";

export function assignRoomEvent(patientId: string, roomLabel: string, actor = "Charge RN") {
  useJourneyStore.getState().append({
    id: crypto.randomUUID(),
    patientId,
    t: new Date().toISOString(),
    kind: "room_change" as const,
    label: roomLabel,
    actor: { name: actor, role: "RN" as const },
    detail: "Assigned",
  });
}