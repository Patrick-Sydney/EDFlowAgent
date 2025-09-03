// components/patient/PathwayTimers.tsx
import React, { useMemo } from "react";
import Chip from "@/components/ui/Chip";
import { acsTimers, sepsisTimers, TimerState } from "@/lib/pathwayTimers";

export default function PathwayTimers({ patientId, complaint }:{patientId:string; complaint?:string}) {
  const lower = (complaint||"").toLowerCase();
  const isACS = /chest|sob|shortness of breath|acs|ami/.test(lower);
  const isSepsis = /sepsis|rigor|fever|infection/.test(lower);

  const timers = useMemo(() => {
    const t: TimerState[] = [];
    if (isACS) t.push(...acsTimers(patientId));
    if (isSepsis) t.push(...sepsisTimers(patientId));
    return t;
  }, [patientId, isACS, isSepsis]);

  if (!timers.length) return null;

  const fmt = (iso?: string) => iso ? new Date(iso).toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" }) : "";

  return (
    <div className="mt-2 flex flex-wrap gap-2 text-xs">
      {timers.map(t => (
        <Chip key={t.label}
          tone={t.state==="due" ? "warning" : "default"}
          title={t.state==="done" ? `Done ${fmt(t.tDone)}` : t.dueAt ? `Due ${fmt(t.dueAt)}` : ""}
        >
          {t.label}: {t.state==="done" ? "done" : t.state==="ordered" ? "ordered" : "due"}
        </Chip>
      ))}
    </div>
  );
}