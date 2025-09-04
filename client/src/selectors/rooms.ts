import { useDashboardStore } from "../stores/dashboardStore";

export type RoomStatus = "available" | "occupied" | "cleaning" | "blocked" | "oos";

export function useRoomCounts() {
  const spaces = useDashboardStore((s) => s.spaces || []);
  
  const c = { total: spaces.length, available: 0, occupied: 0, cleaning: 0, blocked: 0, oos: 0 };
  for (const space of spaces) {
    const status = space.status || "available";
    // Map server status names to our types
    const mappedStatus = status === "out of service" ? "oos" : status;
    if (c.hasOwnProperty(mappedStatus)) {
      (c as any)[mappedStatus] += 1;
    }
  }
  return c;
}

export function useRoomThresholds() {
  const { available, blocked, cleaning } = useRoomCounts();
  return {
    ok: available > 0 && blocked === 0 && cleaning <= 2,
    warn: (available === 0) || (cleaning > 2),
    crit: blocked > 0,
  };
}