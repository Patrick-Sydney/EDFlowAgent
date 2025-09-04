import React from "react";
import { useRoomCounts, useRoomThresholds } from "../../selectors/rooms";

export default function RoomsContextBanner({ onOpen }: { onOpen: () => void }) {
  const c = useRoomCounts();
  const t = useRoomThresholds();
  const show = t.warn || t.crit;
  if (!show) return null;

  const tone = t.crit ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200";
  const msg = t.crit
    ? `Rooms: ${c.available} available · ${c.cleaning} cleaning · ${c.blocked} blocked`
    : `Rooms: ${c.available} available · ${c.cleaning} cleaning`;

  return (
    <div className={`flex items-center justify-between border ${tone} rounded px-3 py-2`}>
      <div className="text-sm">{msg}</div>
      <button 
        onClick={onOpen} 
        className="text-sm underline"
        data-testid="link-open-room-management"
      >
        Open Room Management
      </button>
    </div>
  );
}