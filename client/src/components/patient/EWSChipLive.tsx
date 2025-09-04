import React from "react";
import { useVitalsLast, useVitalsPreviousEWS } from "../../stores/vitalsStore";

export default function EWSChipLive({
  patientId,
  fallback,
}: {
  patientId: string | number;
  fallback?: number;
}) {
  const last = useVitalsLast(patientId);
  const previousEWS = useVitalsPreviousEWS(patientId);
  const ews = (last?.ews ?? fallback);
  
  // Calculate trend indicator
  const getTrendIcon = () => {
    if (ews == null || previousEWS == null) return null;
    if (ews > previousEWS) return <span className="text-red-500 ml-0.5 text-xs">↗</span>;
    if (ews < previousEWS) return <span className="text-green-500 ml-0.5 text-xs">↘</span>;
    return <span className="text-gray-400 ml-0.5 text-xs">→</span>;
  };

  // Match expanded card color logic: critical (>=5), warning (>=3), info (<3), default (null)
  const getChipClasses = () => {
    const baseClasses = "inline-flex items-center rounded-full border px-2 py-0.5 text-xs";
    if (ews == null) return `${baseClasses} bg-slate-100 text-slate-700 border-slate-200`;
    if (ews >= 5) return `${baseClasses} bg-red-100 text-red-700 border-red-200`;
    if (ews >= 3) return `${baseClasses} bg-amber-50 text-amber-700 border-amber-200`;
    return `${baseClasses} bg-blue-50 text-blue-700 border-blue-200`;
  };

  return (
    <span className={getChipClasses()}>
      EWS {ews ?? "—"}{getTrendIcon()}
    </span>
  );
}