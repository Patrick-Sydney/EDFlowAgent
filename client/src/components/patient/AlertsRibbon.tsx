import React from "react";
import { AlertTriangle, ShieldAlert, Activity } from "lucide-react";

export type AlertFlags = {
  isolation?: boolean;            // true if precautions required
  sepsisActive?: boolean;
  strokePathway?: boolean;
  stemiPathway?: boolean;
  allergySevere?: string | null;  // label for tooltip
};

export default function AlertsRibbon({ flags }: { flags?: AlertFlags }) {
  if (!flags) return null;
  const items: React.ReactNode[] = [];
  if (flags.sepsisActive) items.push(
    <span key="sepsis" className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 text-amber-800 bg-amber-50 px-2 py-0.5 text-xs">
      <AlertTriangle className="h-3.5 w-3.5" /> Sepsis pathway
    </span>
  );
  if (flags.strokePathway) items.push(
    <span key="stroke" className="inline-flex items-center gap-1 rounded-full border border-indigo-500/40 text-indigo-800 bg-indigo-50 px-2 py-0.5 text-xs">
      <Activity className="h-3.5 w-3.5" /> Stroke pathway
    </span>
  );
  if (flags.stemiPathway) items.push(
    <span key="stemi" className="inline-flex items-center gap-1 rounded-full border border-rose-500/40 text-rose-800 bg-rose-50 px-2 py-0.5 text-xs">
      <Activity className="h-3.5 w-3.5" /> STEMI pathway
    </span>
  );
  if (flags.isolation) items.push(
    <span key="iso" className="inline-flex items-center gap-1 rounded-full border border-rose-500/40 text-rose-800 bg-rose-50 px-2 py-0.5 text-xs">
      <ShieldAlert className="h-3.5 w-3.5" /> Isolation precautions
    </span>
  );
  if (flags.allergySevere) items.push(
    <span key="allergy" title={flags.allergySevere ?? undefined} className="inline-flex items-center gap-1 rounded-full border border-rose-500/40 text-rose-800 bg-rose-50 px-2 py-0.5 text-xs">
      <ShieldAlert className="h-3.5 w-3.5" /> Severe allergy
    </span>
  );
  if (items.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">{items}</div>
  );
}