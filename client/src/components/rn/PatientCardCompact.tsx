import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, User } from "lucide-react";

export type PatientCardCompactProps = {
  name: string;
  status: string;        // e.g., "Waiting" | "In Triage" | "Room 4"
  timer?: string;        // e.g., "5h 15m waiting"
  complaint?: string;    // chief complaint snippet
  ews?: number;
  ageSex?: string;       // e.g., "36 M"; now moved to 2nd line
  onPrimary?: () => void;
  primaryLabel?: string; // e.g., "Start Triage" | "+ Obs"
  onOpen?: () => void;   // open full card / drawer
  rightExtras?: React.ReactNode; // optional extra actions/icons
};

const shortName = (full: string) => {
  const s = full.trim();
  if (s.length <= 28) return s; // usually fine on phone
  // Try to keep first + last initial
  const parts = s.split(/\s+/);
  if (parts.length >= 2) return `${parts[0]} ${parts[parts.length - 1][0]}.`;
  return s.slice(0, 26) + "…";
};

export function PatientCardCompact(props: PatientCardCompactProps) {
  const { name, status, timer, complaint, ews, ageSex, onPrimary, primaryLabel = "+ Obs", onOpen, rightExtras } = props;
  const display = shortName(name);
  return (
    <div className="rounded-2xl border bg-card p-3 active:scale-[0.99]" onClick={onOpen} role="button">
      <div className="grid grid-cols-[1fr_auto] gap-2 items-center">
        {/* Left block (min-w-0 allows truncation) */}
        <div className="min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <User className="h-4 w-4 text-muted-foreground shrink-0" />
            <div title={name} className="font-semibold text-lg truncate max-w-[58vw] sm:max-w-[40ch]">{display}</div>
            {typeof ews === "number" && <Badge variant="outline" className="shrink-0 text-xs">EWS {ews}</Badge>}
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground min-w-0">
            {ageSex && <span className="shrink-0">{ageSex}</span>}
            <span className="rounded-full bg-muted px-2 py-0.5 shrink-0">{status}</span>
            {timer && (
              <span className="flex items-center gap-1 min-w-0"><Clock className="h-3 w-3" /><span className="truncate">{timer}</span></span>
            )}
          </div>
          {complaint && <div className="mt-1 text-sm text-muted-foreground line-clamp-1">{complaint}</div>}
        </div>

        {/* Right: primary action (fixed width) */}
        <div className="ml-2 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {rightExtras}
          <Button className="h-11 rounded-full px-4 min-w-[96px] shrink-0" onClick={onPrimary}>{primaryLabel}</Button>
        </div>
      </div>
    </div>
  );
}