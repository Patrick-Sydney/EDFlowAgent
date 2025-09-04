// Centralised room management commands so UI stays dumb.
// Integrates with existing dashboard store spaces API and journey/task stores.

import { useDashboardStore } from "@/stores/dashboardStore";
import { useJourneyStore } from "@/stores/journeyStore";
import { useTaskStore } from "@/stores/taskStore";

// Optional audit events
type RoomEvent = { 
  id: string; 
  roomId: string; 
  t: string; 
  kind: string; 
  patientId?: string; 
  note?: string; 
  actor?: string 
};

const emitRoomEvent = (e: RoomEvent) => { 
  try { (window as any).__roomEvents?.push?.(e); } catch {} 
};

const nowISO = () => new Date().toISOString();

// --- Helpers using existing dashboard store API ---
const getDashboard = () => useDashboardStore.getState();
const getJourney = () => useJourneyStore.getState();
const getTasks = () => useTaskStore.getState();

// Find space by ID
const findSpaceById = (spaceId: string) =>
  getDashboard().spaces.find(s => s.id === spaceId);

// Find patient encounter by ID
const findEncounterById = (patientId: string) =>
  getDashboard().encounters.find(e => e.id === patientId);

// HCA task helper (idempotent-ish)
const createHcaTask = (task: {
  patientId?: string; 
  roomId?: string; 
  label: string; 
  dueAt?: string
}) => {
  try {
    getTasks().upsert({
      kind: "clean_room",
      origin: "manual",
      assignedTo: "HCA",
      label: task.label,
      detail: task.roomId ? `Room: ${task.roomId}` : undefined,
      patientId: task.patientId,
      dueAt: task.dueAt
    });
  } catch (e) {
    console.warn("Failed to create HCA task:", e);
  }
};

export async function assignRoom(patientId: string, roomId: string, actor = "Charge RN") {
  if (!patientId || !roomId) return;

  const encounter = findEncounterById(patientId);
  const space = findSpaceById(roomId);
  if (!encounter || !space) {
    console.warn("Assign room: encounter or space not found", { patientId, roomId });
    return;
  }

  try {
    // 1) Source of truth: Journey event
    getJourney().append({
      id: crypto.randomUUID(),
      patientId, 
      t: nowISO(),
      kind: "room_change", 
      label: space.id, 
      actor, 
      detail: "Assigned"
    });

    // 2) Use existing dashboard store API
    await getDashboard().assignSpace(patientId, roomId, "Room assigned via management drawer");

    emitRoomEvent({ 
      id: crypto.randomUUID(), 
      roomId, 
      t: nowISO(), 
      kind: "assigned", 
      patientId, 
      actor 
    });
  } catch (error) {
    console.error("Failed to assign room:", error);
    throw error;
  }
}

export async function reassignRoom(patientId: string, toRoomId: string, actor = "Charge RN") {
  if (!patientId || !toRoomId) return;

  const encounter = findEncounterById(patientId);
  const space = findSpaceById(toRoomId);
  if (!encounter || !space) {
    console.warn("Reassign room: encounter or space not found", { patientId, toRoomId });
    return;
  }

  try {
    // 1) Journey event
    getJourney().append({
      id: crypto.randomUUID(),
      patientId,
      t: nowISO(),
      kind: "room_change",
      label: space.id,
      actor,
      detail: "Reassigned"
    });

    // 2) Use existing dashboard store API
    await getDashboard().reassignSpace(patientId, toRoomId, "Room reassigned via management drawer");

    emitRoomEvent({ 
      id: crypto.randomUUID(), 
      roomId: toRoomId, 
      t: nowISO(), 
      kind: "reassigned", 
      patientId, 
      actor 
    });
  } catch (error) {
    console.error("Failed to reassign room:", error);
    throw error;
  }
}

export async function releaseRoom(patientId: string, actor = "Charge RN") {
  if (!patientId) return;

  const encounter = findEncounterById(patientId);
  if (!encounter || !encounter.room) {
    console.warn("Release room: encounter or room not found", { patientId });
    return;
  }

  try {
    // 1) Use existing dashboard store API
    await getDashboard().releaseSpace(patientId, true); // makeCleaning = true

    // 2) HCA task to clean
    createHcaTask({ 
      roomId: encounter.room, 
      label: `Clean room ${encounter.room}` 
    });

    // 3) Journey communication
    getJourney().append({
      id: crypto.randomUUID(),
      patientId,
      t: nowISO(),
      kind: "communication",
      label: "Room released",
      detail: { roomId: encounter.room },
      actor
    });

    emitRoomEvent({ 
      id: crypto.randomUUID(), 
      roomId: encounter.room, 
      t: nowISO(), 
      kind: "released", 
      actor 
    });
  } catch (error) {
    console.error("Failed to release room:", error);
    throw error;
  }
}

export async function markSpaceReady(spaceId: string, actor = "HCA") {
  if (!spaceId) return;

  try {
    await getDashboard().markSpaceReady(spaceId);
    
    emitRoomEvent({ 
      id: crypto.randomUUID(), 
      roomId: spaceId, 
      t: nowISO(), 
      kind: "clean_done", 
      actor 
    });
  } catch (error) {
    console.error("Failed to mark space ready:", error);
    throw error;
  }
}

export async function markSpaceForCleaning(spaceId: string, actor = "Charge RN") {
  if (!spaceId) return;

  try {
    await getDashboard().markSpaceClean(spaceId);
    
    createHcaTask({ 
      roomId: spaceId, 
      label: `Clean room ${spaceId}` 
    });

    emitRoomEvent({ 
      id: crypto.randomUUID(), 
      roomId: spaceId, 
      t: nowISO(), 
      kind: "clean_start", 
      actor 
    });
  } catch (error) {
    console.error("Failed to mark space for cleaning:", error);
    throw error;
  }
}

// Note: Dashboard store doesn't have block/unblock/OOS methods in the current codebase
// These would need to be added to the dashboard store if required
export function blockRoom(spaceId: string, note?: string, actor = "Charge RN") {
  console.warn("Block room functionality not implemented in dashboard store");
  emitRoomEvent({ 
    id: crypto.randomUUID(), 
    roomId: spaceId, 
    t: nowISO(), 
    kind: "blocked", 
    note, 
    actor 
  });
}

export function unblockRoom(spaceId: string, actor = "Charge RN") {
  console.warn("Unblock room functionality not implemented in dashboard store");
  emitRoomEvent({ 
    id: crypto.randomUUID(), 
    roomId: spaceId, 
    t: nowISO(), 
    kind: "unblocked", 
    actor 
  });
}

export function setOutOfService(spaceId: string, actor = "Charge RN") {
  console.warn("Out of service functionality not implemented in dashboard store");
  emitRoomEvent({ 
    id: crypto.randomUUID(), 
    roomId: spaceId, 
    t: nowISO(), 
    kind: "oos", 
    actor 
  });
}

export function setInService(spaceId: string, actor = "Charge RN") {
  console.warn("In service functionality not implemented in dashboard store");
  emitRoomEvent({ 
    id: crypto.randomUUID(), 
    roomId: spaceId, 
    t: nowISO(), 
    kind: "in_service", 
    actor 
  });
}