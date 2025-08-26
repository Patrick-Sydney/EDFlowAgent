import { useEffect, useMemo } from "react";
import { useDashboardStore } from "@/stores/dashboardStore";

const STATUS = {
  available: { txt: "Available", cls: "bg-emerald-100 text-emerald-700" },
  cleaning: { txt: "Cleaning", cls: "bg-amber-100 text-amber-700" },
  occupied: { txt: "Occupied", cls: "bg-rose-100 text-rose-700" },
  blocked: { txt: "Blocked", cls: "bg-gray-200 text-gray-700" },
};

export default function SpaceSummaryBar() {
  const { spaces, loadSpaces, setSpaceFilterPreset } = useDashboardStore();

  useEffect(() => { 
    loadSpaces(); 
  }, [loadSpaces]);

  const counts = useMemo(() => {
    const byStatus = { available: 0, cleaning: 0, occupied: 0, blocked: 0 };
    const byZone: Record<string, Record<string, number>> = {};
    
    for (const s of spaces) {
      byStatus[s.status as keyof typeof byStatus] = (byStatus[s.status as keyof typeof byStatus] || 0) + 1;
      if (!byZone[s.zone]) {
        byZone[s.zone] = { available: 0, cleaning: 0, occupied: 0, blocked: 0 };
      }
      byZone[s.zone][s.status] = (byZone[s.zone][s.status] || 0) + 1;
    }
    return { byStatus, byZone };
  }, [spaces]);

  return (
    <div className="sticky top-0 z-20 bg-white border-b p-3">
      <div className="flex flex-wrap items-center gap-3 mb-2">
        <h3 className="font-semibold text-sm sm:text-base">Treatment Spaces</h3>
        {Object.entries(counts.byStatus).map(([k, v]) => (
          <button
            key={k}
            className={`px-2 py-0.5 rounded-full text-xs ${STATUS[k as keyof typeof STATUS].cls} hover:opacity-80 transition-opacity`}
            onClick={() => setSpaceFilterPreset({ status: k })}
            title={`Show ${STATUS[k as keyof typeof STATUS].txt}`}
          >
            {STATUS[k as keyof typeof STATUS].txt}: {v}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-3 text-xs">
        {Object.entries(counts.byZone).map(([zone, vals]) => (
          <div key={zone} className="flex items-center gap-1">
            <span className="font-medium">Zone {zone}:</span>
            {Object.entries(vals).map(([k, v]) => v > 0 && (
              <button
                key={k}
                className={`px-1.5 py-0.5 rounded-full ${STATUS[k as keyof typeof STATUS].cls} hover:opacity-80 transition-opacity`}
                onClick={() => setSpaceFilterPreset({ zone, status: k })}
                title={`Zone ${zone} • ${STATUS[k as keyof typeof STATUS].txt}`}
              >
                {v}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}