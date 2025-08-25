import { useMemo } from "react";
import { useDashboardStore } from "@/stores/dashboardStore";

export function StatsBar() {
  const encounters = useDashboardStore((state) => state.encounters);
  
  const stats = useMemo(() => {
    const statsObj = {
      waiting: 0,
      triage: 0, 
      roomed: 0,
      diagnostics: 0,
      review: 0,
      ready: 0,
      discharged: 0,
      total: encounters.length
    };

    encounters.forEach(encounter => {
      if (encounter.lane in statsObj) {
        statsObj[encounter.lane as keyof typeof statsObj]++;
      }
    });

    return statsObj;
  }, [encounters]);

  const statItems = [
    { label: "Waiting", value: stats.waiting, color: "text-medical-blue" },
    { label: "In Triage", value: stats.triage, color: "text-medical-amber" },
    { label: "Roomed", value: stats.roomed, color: "text-medical-green" },
    { label: "Diagnostics", value: stats.diagnostics, color: "text-purple-600" },
    { label: "Review", value: stats.review, color: "text-blue-600" },
    { label: "Ready", value: stats.ready, color: "text-green-600" },
    { label: "Today", value: stats.discharged, color: "text-gray-600" }
  ];

  return (
    <div className="grid grid-cols-7 gap-4 mb-6">
      {statItems.map((stat, index) => (
        <div key={index} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className={`text-2xl font-bold ${stat.color}`} data-testid={`stat-${stat.label.toLowerCase().replace(/\s+/g, '-')}`}>
            {stat.value}
          </div>
          <div className="text-sm text-gray-600">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}
