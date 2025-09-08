import React from "react";
import EWSChipLive from "./EWSChipLive";
import { useVitalsLast } from "@/stores/vitalsStore";

export default function ClinicalSnapshot({
  patientId, complaint, ats, o2Label, rightAddon,
}: {
  patientId: string | number;
  complaint?: string;
  ats?: number | null;
  o2Label?: string | null;   // e.g. "O₂ 2 L/min"
  rightAddon?: React.ReactNode; // e.g., tiny trend widget
}) {
  const last = useVitalsLast(patientId);
  const lastStr = last?.t ? new Date(last.t).toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"}) : "—";
  return (
    <div className="rounded-xl border p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {complaint && <div className="text-sm font-medium truncate">{complaint}</div>}
          <div className="mt-0.5 text-[11px] text-muted-foreground flex items-center gap-2 flex-wrap">
            <EWSChipLive patientId={patientId} />
            <span>Last obs {lastStr}</span>
            {typeof ats === "number" && <span className="rounded-full border px-2 py-0.5">ATS {ats}</span>}
            {o2Label && <span className="rounded-full border px-2 py-0.5">{o2Label}</span>}
          </div>
        </div>
        {rightAddon ?? null}
      </div>
    </div>
  );
}