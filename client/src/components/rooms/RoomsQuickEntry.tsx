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

  // Group rooms by status for the status ribbon
  const roomsByStatus = React.useMemo(() => {
    const statuses = [
      { key: "available", label: "Available" },
      { key: "occupied", label: "Occupied" },
      { key: "cleaning", label: "Cleaning" },
      { key: "blocked", label: "Blocked" },
      { key: "oos", label: "Oos" }
    ];
    
    return statuses.map(({ key, label }) => ({
      status: label,
      count: key === "available" ? counts.available : 
             key === "occupied" ? counts.occupied :
             key === "cleaning" ? counts.cleaning :
             key === "blocked" ? counts.blocked :
             counts.oos
    }));
  }, [counts]);

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

  const StatusChip = ({ status, count }: { status: string; count: number }) => {
    const handleClick = () => {
      // Map status labels to filter values
      const filterMap: Record<string, string> = {
        "Available": "available",
        "Occupied": "occupied", 
        "Cleaning": "cleaning",
        "Blocked": "blocked",
        "Oos": "oos"
      };
      
      const filter = filterMap[status];
      openRoom({} as any, filter);
    };

    return (
      <button
        onClick={handleClick}
        className="text-xs rounded border border-gray-200 bg-gray-50 text-gray-700 px-2 py-1 mr-2 hover:bg-gray-100"
        title={`${status}: ${count} rooms`}
        data-testid={`chip-status-${status.toLowerCase()}`}
      >
        {status} {count}
      </button>
    );
  };

  return (
    <div>
      {/* Rooms Status Row */}
      <div className="flex items-center flex-wrap gap-1">
        <span className="text-xs font-medium text-slate-600 mr-2">Rooms:</span>
        {roomsByStatus.map(({ status, count }) => (
          <StatusChip key={status} status={status} count={count} />
        ))}
      </div>
    </div>
  );
}