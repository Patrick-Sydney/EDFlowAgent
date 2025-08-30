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

  return (
    <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs">
      EWS {ews ?? "—"}{getTrendIcon()}
    </span>
  );
}