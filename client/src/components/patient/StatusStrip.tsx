import React from "react";
import { ShieldAlert, Wind, AlertTriangle, Timer, FlaskConical, Pill } from "lucide-react";

// NOTE: this strip now supports wrapping to avoid cramping the name line.

export type StatusFlags = {
  isolation?: boolean;
  allergy?: boolean;
  oxygen?: boolean;
  sepsis?: boolean;
  tasksDue?: number;        // count
  resultsPending?: number;  // count
};

function PillBadge({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <span
      title={title}
      className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs text-foreground/90"
    >
      {children}
    </span>
  );
}

export default function StatusStrip({ flags }: { flags?: StatusFlags }) {
  if (!flags) return null;
  const {
    isolation, allergy, oxygen, sepsis, tasksDue, resultsPending,
  } = flags;
  return (
    <div className="flex items-center gap-2 flex-wrap justify-end max-w-[360px]">
      {typeof tasksDue === "number" && tasksDue > 0 && (
        <PillBadge title={`${tasksDue} task${tasksDue === 1 ? "" : "s"} due`}>
          <Timer className="h-3.5 w-3.5" />
          {tasksDue}
        </PillBadge>
      )}
      {typeof resultsPending === "number" && resultsPending > 0 && (
        <PillBadge title={`${resultsPending} result${resultsPending === 1 ? "" : "s"} pending`}>
          <FlaskConical className="h-3.5 w-3.5" />
          {resultsPending}
        </PillBadge>
      )}
      {oxygen && (
        <PillBadge title="Receiving supplemental oxygen">
          <Wind className="h-3.5 w-3.5" />
          O₂
        </PillBadge>
      )}
      {allergy && (
        <PillBadge title="Allergy recorded">
          <Pill className="h-3.5 w-3.5" />
          Allergy
        </PillBadge>
      )}
      {isolation && (
        <PillBadge title="Isolation / precautions">
          <ShieldAlert className="h-3.5 w-3.5" />
          ISO
        </PillBadge>
      )}
      {sepsis && (
        <PillBadge title="Sepsis pathway/alert">
          <AlertTriangle className="h-3.5 w-3.5" />
          Sepsis
        </PillBadge>
      )}
    </div>
  );
}