import React, { useMemo } from "react";
import Chip from "@/components/ui/Chip";
import { journeyStore, JourneyEvent } from "@/stores/journeyStore";

type Props = { patientId: string; complaint?: string };

export default function PathwayClocks({ patientId, complaint }: Props) {
  const lower = (complaint || "").toLowerCase();
  const isACS = /chest|sob|shortness of breath|acs|ami/.test(lower);
  const isSepsis = /sepsis|fever|rigor|infection/.test(lower);
  const status = useMemo(() => {
    const evs = journeyStore.list(patientId);
    const has = (s: string) => evs.some((e: JourneyEvent) => (e.label || "").toLowerCase().includes(s));
    return {
      ecgDone: has("ecg"),
      aspirinGiven: has("aspirin") || has("asa"),
      tropTaken: has("trop"),
      lactateDone: has("lactate"),
      abxGiven: has("antibiot"),
    };
  }, [patientId]);

  if (!isACS && !isSepsis) return null;

  return (
    <div className="mt-2 flex flex-wrap gap-2 text-xs">
      {isACS && (
        <>
          <Chip tone={status.ecgDone ? "default" : "warning"} title="Time-to-ECG">
            {status.ecgDone ? "ECG: done" : "ECG: due <10m"}
          </Chip>
          <Chip tone={status.tropTaken ? "default" : "warning"} title="First troponin">
            {status.tropTaken ? "Troponin: taken" : "Troponin: due"}
          </Chip>
          <Chip tone={status.aspirinGiven ? "default" : "warning"} title="Aspirin">
            {status.aspirinGiven ? "Aspirin: given" : "Aspirin: due"}
          </Chip>
        </>
      )}
      {isSepsis && (
        <>
          <Chip tone={status.abxGiven ? "default" : "warning"} title="Antibiotics">
            {status.abxGiven ? "Antibiotics: given" : "Antibiotics: due"}
          </Chip>
          <Chip tone={status.lactateDone ? "default" : "warning"} title="Lactate">
            {status.lactateDone ? "Lactate: taken" : "Lactate: due"}
          </Chip>
        </>
      )}
    </div>
  );
}