import React from "react";
import { Clock, Bed } from "lucide-react";
import EWSChipLive from "./EWSChipLive";
import { useVitalsLast } from "../../stores/vitalsStore";

/**
 * Desktop-first collapsed header (no CTAs).
 * Left area = two rows:
 *  Row 1: Name · Age/Sex · Room · ATS · EWS (live)
 *  Row 2: Chief complaint · Timer · Last obs time
 * Right area (rendered by parent) = StatusStrip (desktop) or CTA (mobile)
 */
export default function CollapsedCardHeader({
  patientId,
  name,
  ageSex,
  ats,
  roomName,
  chiefComplaint,
  timerLabel,
}: {
  patientId: string | number;
  name: string;
  ageSex?: string;
  ats?: 1 | 2 | 3 | 4 | 5;
  roomName?: string | null;
  chiefComplaint?: string;
  timerLabel?: string; // e.g. "Waiting 00:47"
}) {
  const last = useVitalsLast(patientId);
  const lastStr = last?.t
    ? new Date(last.t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : undefined;

  return (
    <div className="min-w-0">
      {/* Row 1 */}
      <div className="flex items-center gap-2 min-w-0">
        <div className="font-semibold text-lg truncate max-w-[44ch]" title={name}>
          {name}
        </div>
        {ageSex && <span className="text-xs text-muted-foreground shrink-0">{ageSex}</span>}
        {roomName && (
          <span className="inline-flex items-center gap-1 text-xs rounded-full border px-2 py-0.5 shrink-0">
            <Bed className="h-3.5 w-3.5" />
            {roomName}
          </span>
        )}
        {typeof ats === "number" && (
          <span className="text-xs rounded-full border px-2 py-0.5 shrink-0">ATS {ats}</span>
        )}
        <EWSChipLive patientId={patientId} />
      </div>

      {/* Row 2 */}
      <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground min-w-0">
        {chiefComplaint && <span className="truncate">{chiefComplaint}</span>}
        {timerLabel && (
          <span className="inline-flex items-center gap-1 shrink-0">
            <Clock className="h-3 w-3" />
            {timerLabel}
          </span>
        )}
        <span className="shrink-0">•</span>
        <span className="shrink-0">Last obs: {lastStr ?? "—"}</span>
      </div>
    </div>
  );
}