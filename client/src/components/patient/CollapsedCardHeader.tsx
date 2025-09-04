import React from "react";
import { Clock, Bed, ShieldAlert } from "lucide-react";
import EWSChipLive from "./EWSChipLive";
import { useVitalsLast } from "../../stores/vitalsStore";
import { useRoomFor } from "../../stores/patientIndexStore";

/**
 * Desktop-first collapsed header (no CTAs).
 * Reflowed to avoid cramping:
 *  Row A: Name (two-line clamp) · Age/Sex
 *  Row B: Location chip (e.g., RESUS 2 / OBS 5 / Cubicle 7) · EWS (live) · ATS · Timer · Last obs
 *  Row C: Chief complaint (single-line clamp)
 * Right column (rendered by parent) = StatusStrip (desktop) or CTA (mobile)
 */
export default function CollapsedCardHeader({
  patientId,
  name,
  ageSex,
  ats,
  locationLabel,
  chiefComplaint,
  timerLabel,
  isolationRequired,
}: {
  patientId: string | number;
  name: string;
  ageSex?: string;
  ats?: 1 | 2 | 3 | 4 | 5;
  /** e.g., "RESUS 2", "OBS 5", "Cubicle 7", "ISO 1" */
  locationLabel?: string | null;
  chiefComplaint?: string;
  timerLabel?: string; // e.g. "Waiting 00:47"
  isolationRequired?: boolean;
}) {
  const last = useVitalsLast(patientId);
  const lastStr = last?.t
    ? new Date(last.t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : undefined;
  
  // Use live room selector as fallback to ensure real-time updates
  const liveRoom = useRoomFor(String(patientId));
  const displayLocation = locationLabel ?? liveRoom;
  

  return (
    <div className="min-w-0">
      {/* Row A: Name (allow 2 lines), Age/Sex and Red Flags to the side */}
      <div className="flex items-start justify-between gap-2 min-w-0">
        <div className="flex items-start gap-2 min-w-0">
          <div className="font-semibold text-lg leading-snug line-clamp-2" title={name}>
            {name}
          </div>
          {ageSex && <span className="text-xs text-muted-foreground shrink-0 mt-0.5">{ageSex}</span>}
        </div>
        {/* Red flag badges in top right */}
        {isolationRequired && (
          <div className="flex items-center gap-1 shrink-0">
            <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/40 text-rose-800 bg-rose-50 px-1.5 py-0.5 text-xs font-medium">
              <ShieldAlert className="h-3 w-3" />
              ISO
            </span>
          </div>
        )}
      </div>

      {/* Row B: Location + live chips + timers */}
      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
        {displayLocation && (
          <span className="inline-flex items-center gap-1 rounded-full border border-slate-300 px-2 py-0.5 bg-slate-50 text-slate-700 font-medium" data-testid="room-chip">
            <Bed className="h-3.5 w-3.5" />
            {displayLocation}
          </span>
        )}
        <EWSChipLive patientId={patientId} />
        {ats && (
          <span className="rounded-full border px-2 py-0.5 bg-background text-foreground">ATS {ats}</span>
        )}
        {timerLabel && (
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {timerLabel}
          </span>
        )}
        <span className="">Last obs: {lastStr ?? "—"}</span>
      </div>

      {/* Row C: Complaint */}
      {chiefComplaint && (
        <div className="mt-1 text-sm text-muted-foreground line-clamp-1">{chiefComplaint}</div>
      )}
    </div>
  );
}