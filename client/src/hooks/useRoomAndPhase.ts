import { useMemo } from "react";
import { useJourneyStore } from "@/stores/journeyStore";

/** Robustly extract a room label from a Journey event */
function extractRoom(ev: any): string | undefined {
  // Try several common places
  if (typeof ev?.label === "string" && ev.label.trim()) return ev.label.trim();
  if (typeof ev?.detail === "string" && ev.detail.trim()) return ev.detail.trim();
  if (ev?.detail?.room) return String(ev.detail.room);
  // Fallback: parse "Room 12" from free text
  const txt = `${ev?.label ?? ""} ${ev?.detail ?? ""}`.toLowerCase();
  const m = txt.match(/room\s*([a-z0-9\-]+)/i);
  return m ? `Room ${m[1]}` : undefined;
}

export type LanePhase = "Waiting" | "In Triage" | "Roomed" | "Diagnostics" | "Review";

/** Live room+phase for a single patient */
export function useRoomAndPhase(patientId: string): { room?: string; phase: LanePhase } {
  const events = useJourneyStore(s => s.events); // re-renders when immutable array changes
  
  if (patientId === "ABC1001") {
    console.log("[DEBUG] Hook for Alex (ABC1001) - events count:", events.length, "events:", events);
  }

  return useMemo(() => {
    let room: string | undefined = undefined;
    let phase: LanePhase = "Waiting";
    for (const ev of events) {
      if (ev.patientId !== patientId) continue;
      switch (ev.kind) {
        case "triage":
          phase = "In Triage";
          break;
        case "room_change":
          room = extractRoom(ev) ?? room;
          phase = "Roomed";
          break;
        case "order":
          if (phase === "Roomed") phase = "Diagnostics";
          break;
        case "result":
          if (phase === "Diagnostics") phase = "Review";
          break;
        default:
          break;
      }
    }
    return { room, phase };
  }, [events, patientId]);
}

/** Live phase map for a roster (efficient for lanes) */
export function usePhaseMap(patientIds: string[]): Record<string, LanePhase> {
  const events = useJourneyStore(s => s.events);
  return useMemo(() => {
    const map: Record<string, LanePhase> = {};
    for (const id of patientIds) map[id] = "Waiting";
    for (const ev of events) {
      const pid = ev.patientId;
      if (!pid || !(pid in map)) continue;
      switch (ev.kind) {
        case "triage":
          map[pid] = "In Triage"; break;
        case "room_change":
          map[pid] = "Roomed"; break;
        case "order":
          if (map[pid] === "Roomed") map[pid] = "Diagnostics"; break;
        case "result":
          if (map[pid] === "Diagnostics") map[pid] = "Review"; break;
      }
    }
    return map;
  }, [events, patientIds.join("|")]);
}