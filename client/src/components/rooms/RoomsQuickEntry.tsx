import React from "react";
import { useUiPrefsStore } from "../../stores/uiPrefsStore";
import { useRoomCounts, useRoomThresholds } from "../../selectors/rooms";

export default function RoomsQuickEntry({ onOpen }: { onOpen: () => void }) {
  const mode = useUiPrefsStore((s) => s.roomsQuickEntry);
  const counts = useRoomCounts();
  const t = useRoomThresholds();

  if (mode === "button") {
    const badgeTone = t.crit ? "bg-red-600" : t.warn ? "bg-amber-500" : "bg-slate-300";
    return (
      <button
        onClick={onOpen}
        className="inline-flex items-center gap-2 rounded border px-3 py-1.5"
        title="Open Room Management"
        data-testid="button-rooms"
      >
        <span className="font-medium">Rooms</span>
        <span className={`text-xs text-white px-1.5 py-0.5 rounded ${badgeTone}`}>
          {counts.available}/{counts.total}
        </span>
      </button>
    );
  }

  // neutral chip cluster
  const Chip = ({ label, value, emphasize=false }:{label:string; value:number; emphasize?:boolean}) => (
    <button
      onClick={onOpen}
      className={`text-xs rounded-full border px-2 py-1 mr-2 ${emphasize ? "font-semibold" : ""}`}
      title="Open Room Management"
      data-testid={`chip-${label.toLowerCase()}`}
    >
      {label}: {value}
    </button>
  );

  return (
    <div className="flex items-center">
      <Chip label="Available" value={counts.available} emphasize />
      <Chip label="Occupied" value={counts.occupied} />
      <Chip label="Cleaning" value={counts.cleaning} />
      <Chip label="Blocked" value={counts.blocked} />
      <Chip label="OOS" value={counts.oos} />
      <button onClick={onOpen} className="ml-2 text-xs underline" data-testid="link-manage-rooms">
        Manage
      </button>
    </div>
  );
}