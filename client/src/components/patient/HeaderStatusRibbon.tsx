// components/patient/HeaderStatusRibbon.tsx
import React from "react";
import Chip from "@/components/ui/Chip";
import { getArrivalISO, nextObsDueISO } from "@/lib/ewsAndNextObs";
import { useEwsChip } from "@/stores/selectors";
import { useVitalsStore } from "@/stores/vitalsStore";

type Props = {
  patient: {
    id: string; name?: string; age?: number|string; nhiMasked?: string;
    room?: string; ats?: number|string; allergy?: string|null;
    isolation?: boolean; falls?: boolean; o2Delivery?: string; spo2Target?: string;
    painScore?: number; painTs?: string;
  };
  rightActions?: React.ReactNode;
};

export default function HeaderStatusRibbon({ patient, rightActions }: Props) {
  const { ews } = useEwsChip(patient.id);
  const previousEws = useVitalsStore((s) => s.previousEWS(patient.id));
  const trend = ews != null && previousEws != null 
    ? (ews > previousEws ? "↑" : ews < previousEws ? "↓" : "=")
    : null;
  
  const arrISO = getArrivalISO(patient.id);
  const nextISO = nextObsDueISO(patient.id);

  const formatHM = (iso?: string | null) => iso ? new Date(iso).toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"}) : "—";

  return (
    <header className="sticky top-0 bg-white z-[1] p-4 border-b">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-lg font-semibold truncate">{patient.name ?? "—"}</div>
          <div className="mt-1 flex flex-wrap gap-2 text-xs">
            <Chip>Age {patient.age ?? "—"}</Chip>
            {patient.nhiMasked && <Chip>NHI {patient.nhiMasked}</Chip>}
            {patient.room && <Chip>Location {patient.room}</Chip>}
            {arrISO && <Chip>Arrived {formatHM(arrISO)}</Chip>}
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <Chip tone={ews!=null ? (ews>=5?"critical": ews>=3?"warning":"info") : "default"}>EWS {ews ?? "—"} {trend ?? ""}</Chip>
            {patient.ats!=null && <Chip>ATS {patient.ats}</Chip>}
            {patient.o2Delivery && <Chip title="Oxygen delivery">O₂: {patient.o2Delivery}</Chip>}
            {patient.spo2Target && <Chip>SpO₂ target {patient.spo2Target}</Chip>}
            {patient.painScore!=null && <Chip title="Pain score">Pain {patient.painScore}{patient.painTs ? ` @ ${formatHM(patient.painTs)}` : ""}</Chip>}
            {nextISO && (
              <Chip tone={Date.now() > new Date(nextISO).getTime() ? "critical" : "default"}>
                Monitoring: next {formatHM(nextISO)}
              </Chip>
            )}
            {patient.allergy && <Chip tone="warning">Allergy: {patient.allergy}</Chip>}
          </div>
        </div>
        <div className="shrink-0 flex items-center gap-2">{rightActions}</div>
      </div>
    </header>
  );
}