import React from "react";
import { X, Loader2 } from "lucide-react";
import EWSChipLive from "../patient/EWSChipLive";
import { useVitalsList } from "../../stores/vitalsStore";

/**
 * Mobile-first sticky header for the Record Observations modal.
 * - Calm, compact, and readable on phones
 * - Shows patient name (truncated), age/sex, cohort tag, live EWS, last obs time
 * - Close button in the header (fixes the old sticky footer overlap)
 * - Optional saving/dirty indicators
 */
export default function ObsModalHeaderMobile({
  patientId,
  patientName,
  ageSex,
  cohort = "Adult",
  dirty = false,
  isSaving = false,
  onClose,
}: {
  patientId: string | number;
  patientName: string;
  ageSex?: string;
  cohort?: "Adult" | "PEWS" | "MEWS" | string;
  dirty?: boolean;
  isSaving?: boolean;
  onClose: () => void;
}) {
  const list = useVitalsList(patientId);
  const last = list.length ? list[list.length - 1] : undefined;
  const lastStr = last?.t
    ? new Date(last.t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : null;

  // Debug logging
  console.log("ObsModalHeader:", patientId, "list length:", list.length, "last:", last);

  return (
    <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b">
      <div className="px-4 py-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="rounded-full border px-2 py-0.5">{cohort}</span>
            {ageSex && <span className="truncate">{ageSex}</span>}
            {dirty && (
              <span className="rounded-full border px-2 py-0.5">Unsaved</span>
            )}
            {isSaving && (
              <span className="inline-flex items-center gap-1 text-xs"><Loader2 className="h-3 w-3 animate-spin"/>Saving…</span>
            )}
          </div>

          <div className="mt-0.5 flex items-center gap-2 min-w-0">
            <h1 className="font-semibold truncate max-w-[60vw] sm:max-w-[40ch]" title={patientName}>{patientName}</h1>
            {/* Live EWS chip (updates after +Obs via vitalsStore) */}
            <EWSChipLive patientId={patientId} />
          </div>

          <div className="mt-0.5 text-[11px] text-muted-foreground">
            {lastStr ? (
              <>Last obs {lastStr}</>
            ) : (
              <>No observations yet</>
            )}
          </div>
        </div>

        <button
          aria-label="Close"
          onClick={onClose}
          className="shrink-0 rounded-full p-2 hover:bg-muted active:bg-muted/80"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}