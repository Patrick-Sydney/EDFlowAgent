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
    const bgColor = status === "Available" ? "bg-green-50 border-green-200 text-green-600" :
                   status === "Occupied" ? "bg-blue-50 border-blue-200 text-blue-600" :
                   status === "Cleaning" ? "bg-yellow-50 border-yellow-200 text-yellow-600" :
                   status === "Blocked" ? "bg-red-50 border-red-200 text-red-600" :
                   "bg-gray-50 border-gray-200 text-gray-600";
    
    return (
      <button
        onClick={() => openRoom({} as any)}
        className={`text-xs rounded border px-2 py-1 mr-2 ${bgColor}`}
        title={`${status}: ${count} rooms`}
        data-testid={`chip-status-${status.toLowerCase()}`}
      >
        {status} {count}
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
      
      {/* Status Row */}
      <div className="flex items-center flex-wrap gap-1">
        <span className="text-xs font-medium text-slate-600 mr-2">Status:</span>
        {roomsByStatus.map(({ status, count }) => (
          <StatusChip key={status} status={status} count={count} />
        ))}
      </div>
    </div>
  );
}