import { useJourneyStore } from "@/stores/journeyStore";
import { usePatientIndex } from "@/stores/patientIndexStore";
import { useDashboardStore } from "@/stores/dashboardStore";

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

  // 2) Update the encounter lane so patient moves to "Roomed" column immediately
  const dashboardState = useDashboardStore.getState();
  const encounter = dashboardState.encounters.find(e => String(e.id) === patientId);
  if (encounter) {
    // Update the encounter in place to move to "roomed" lane
    encounter.lane = "roomed";
    encounter.room = roomLabel.trim();
    encounter.lastUpdated = new Date();
    
    // No need to call a refresh method - the mutation is already applied
  }

  // 3) recompute the derived index immediately (header updates)
  usePatientIndex.getState().recompute();
}