import React from "react";
import { useUiPrefsStore } from "../../stores/uiPrefsStore";
import { useRoomCounts, useRoomThresholds } from "../../selectors/rooms";
import { useDashboardStore } from "../../stores/dashboardStore";

export default function RoomsQuickEntry() {
  const openRoom = useDashboardStore((s) => s.openRoom);
  const mode = useUiPrefsStore((s) => s.roomsQuickEntry);
  const counts = useRoomCounts();
  const t = useRoomThresholds();
  const spaces = useDashboardStore((s) => s.spaces || []);

  // Group rooms by type and calculate availability
  const roomsByType = React.useMemo(() => {
    const types = ["Resus", "Cubicle", "Observation", "Isolation", "Chair"] as const;
    return types.map(type => {
      const typeRooms = spaces.filter(space => space.type === type);
      const available = typeRooms.filter(space => !space.status || space.status === "available").length;
      const total = typeRooms.length;
      return { type, available, total, status: available === 0 ? "full" : available < total * 0.3 ? "low" : "ok" };
    }).filter(item => item.total > 0);
  }, [spaces]);

  // Group rooms by zone and calculate availability
  const roomsByZone = React.useMemo(() => {
    const zones = [...new Set(spaces.map(space => space.zone).filter(Boolean))];
    return zones.map(zone => {
      const zoneRooms = spaces.filter(space => space.zone === zone);
      const available = zoneRooms.filter(space => !space.status || space.status === "available").length;
      const total = zoneRooms.length;
      return { zone, available, total, status: available === 0 ? "full" : available < total * 0.3 ? "low" : "ok" };
    });
  }, [spaces]);

  // Always show the enhanced ribbon view now
  // if (mode === "button") {
  //   const badgeTone = t.crit ? "bg-red-600" : t.warn ? "bg-amber-500" : "bg-slate-300";
  //   return (
  //     <button
  //       onClick={() => openRoom({} as any)}
  //       className="inline-flex items-center gap-2 rounded border px-3 py-1.5"
  //       title="Open Room Management"
  //       data-testid="button-rooms"
  //     >
  //       <span className="font-medium">Rooms</span>
  //       <span className={`text-xs text-white px-1.5 py-0.5 rounded ${badgeTone}`}>
  //         {counts.available}/{counts.total}
  //       </span>
  //     </button>
  //   );
  // }

  // Enhanced ribbon with zones and types
  const TypeChip = ({ type, available, total, status }: { type: string; available: number; total: number; status: string }) => {
    const bgColor = status === "full" ? "bg-red-100 border-red-300 text-red-700" : 
                   status === "low" ? "bg-amber-100 border-amber-300 text-amber-700" : 
                   "bg-green-100 border-green-300 text-green-700";
    
    return (
      <button
        onClick={() => openRoom({} as any)}
        className={`text-xs rounded-full border px-2 py-1 mr-2 ${bgColor}`}
        title={`${type} rooms: ${available}/${total} available`}
        data-testid={`chip-type-${type.toLowerCase()}`}
      >
        {type} {available}/{total}
      </button>
    );
  };

  const ZoneChip = ({ zone, available, total, status }: { zone: string; available: number; total: number; status: string }) => {
    const bgColor = status === "full" ? "bg-red-50 border-red-200 text-red-600" : 
                   status === "low" ? "bg-amber-50 border-amber-200 text-amber-600" : 
                   "bg-blue-50 border-blue-200 text-blue-600";
    
    return (
      <button
        onClick={() => openRoom({} as any)}
        className={`text-xs rounded border px-2 py-1 mr-2 ${bgColor}`}
        title={`${zone}: ${available}/${total} available`}
        data-testid={`chip-zone-${zone?.toLowerCase()}`}
      >
        {zone} {available}/{total}
      </button>
    );
  };

  return (
    <div className="space-y-2">
      {/* Room Types Row */}
      <div className="flex items-center flex-wrap gap-1">
        <span className="text-xs font-medium text-slate-600 mr-2">Types:</span>
        {roomsByType.map(({ type, available, total, status }) => (
          <TypeChip key={type} type={type} available={available} total={total} status={status} />
        ))}
        <button 
          onClick={() => openRoom({} as any)} 
          className="ml-2 text-xs underline text-blue-600"
          data-testid="link-manage-rooms"
        >
          Manage
        </button>
      </div>
      
      {/* Zones Row (if zones exist) */}
      {roomsByZone.length > 0 && (
        <div className="flex items-center flex-wrap gap-1">
          <span className="text-xs font-medium text-slate-600 mr-2">Zones:</span>
          {roomsByZone.map(({ zone, available, total, status }) => (
            <ZoneChip key={zone} zone={zone!} available={available} total={total} status={status} />
          ))}
        </div>
      )}
    </div>
  );
}