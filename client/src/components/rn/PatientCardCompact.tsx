import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, User } from "lucide-react";

export type PatientCardCompactProps = {
  name: string;
  status: string;        // e.g., "Waiting" | "In Triage" | "Room 4"
  timer?: string;        // e.g., "23m waiting"
  complaint?: string;    // chief complaint snippet
  ews?: number;
  onPrimary?: () => void;
  primaryLabel?: string; // e.g., "Start Triage" | "+ Obs"
  onOpen?: () => void;   // open full card / drawer
  rightExtras?: React.ReactNode; // optional extra actions/icons
};

export function PatientCardCompact(props: PatientCardCompactProps) {
  const { name, status, timer, complaint, ews, onPrimary, primaryLabel = "+ Obs", onOpen, rightExtras } = props;
  return (
    <div className="rounded-2xl border bg-card p-3 active:scale-[0.99]" onClick={onOpen} role="button">
      <div className="flex items-center gap-2 justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <div className="font-semibold text-lg truncate max-w-[58vw] sm:max-w-[40ch]">{name}</div>
            {typeof ews === "number" && <Badge variant="outline">EWS {ews}</Badge>}
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
            <span className="rounded-full bg-muted px-2 py-0.5">{status}</span>
            {timer && (
              <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{timer}</span>
            )}
          </div>
          {complaint && <div className="mt-1 text-sm text-muted-foreground truncate">{complaint}</div>}
        </div>
        <div className="ml-2 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {rightExtras}
          <Button className="h-11 rounded-full px-4" onClick={onPrimary}>{primaryLabel}</Button>
        </div>
      </div>
      {/* quick chips row (optional) */}
      <div className="mt-2 flex gap-2" onClick={(e) => e.stopPropagation()}>
        <Button size="sm" variant="outline" className="rounded-full">Details</Button>
        <Button size="sm" variant="outline" className="rounded-full">+ Obs</Button>
      </div>
    </div>
  );
}