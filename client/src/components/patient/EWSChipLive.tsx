import React from "react";
import { useEwsChip } from "@/stores/selectors";
import { vitalsStore } from "@/stores/vitalsStore";

export default function EWSChipLive({
  patientId,
  fallback,
}: {
  patientId: string | number;
  fallback?: number;
}) {
  const { ews } = useEwsChip(String(patientId));
  const previousEWS = vitalsStore.previousEWS(String(patientId));
  const finalEws = (ews ?? fallback);
  
  // Calculate trend indicator
  const getTrendIcon = () => {
    if (finalEws == null || previousEWS == null) return null;
    if (finalEws > previousEWS) return <span className="text-red-500 ml-0.5 text-xs">↗</span>;
    if (finalEws < previousEWS) return <span className="text-green-500 ml-0.5 text-xs">↘</span>;
    return <span className="text-gray-400 ml-0.5 text-xs">→</span>;
  };

  // Match expanded card color logic: critical (>=5), warning (>=3), info (<3), default (null)
  const getChipClasses = () => {
    const baseClasses = "inline-flex items-center rounded-full border px-2 py-0.5 text-xs";
    if (finalEws == null) return `${baseClasses} bg-slate-100 text-slate-700 border-slate-200`;
    if (finalEws >= 5) return `${baseClasses} bg-red-100 text-red-700 border-red-200`;
    if (finalEws >= 3) return `${baseClasses} bg-amber-50 text-amber-700 border-amber-200`;
    return `${baseClasses} bg-blue-50 text-blue-700 border-blue-200`;
  };

  return (
    <span className={getChipClasses()}>
      EWS {finalEws ?? "—"}{getTrendIcon()}
    </span>
  );
}