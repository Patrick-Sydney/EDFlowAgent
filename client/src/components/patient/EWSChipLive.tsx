import React from "react";
import { useVitalsLast } from "../../stores/vitalsStore";

export default function EWSChipLive({
  patientId,
  fallback,
}: {
  patientId: string | number;
  fallback?: number;
}) {
  const last = useVitalsLast(patientId);
  const ews = (last?.ews ?? fallback);
  return (
    <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs">
      EWS {ews ?? "—"}
    </span>
  );
}