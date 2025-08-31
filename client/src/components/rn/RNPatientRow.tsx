import React from "react";
import PatientCardExpandable from "@/components/PatientCardExpandable";
import { useVitalsLast } from "../../stores/vitalsStore";

export function RNPatientRow({ 
  p, 
  laneLabel, 
  onStartTriage, 
  onOpenObs, 
  onOpenCard, 
  onOpenVitals 
}: {
  p: any; 
  laneLabel: string; 
  onStartTriage: (p: any) => void; 
  onOpenObs: (p: any) => void; 
  onOpenCard: (p: any) => void; 
  onOpenVitals: (p: any) => void;
}) {
  const last = useVitalsLast(p.id);
  const minVitals = last ? { 
    rr: last.rr, 
    spo2: last.spo2, 
    hr: last.hr, 
    sbp: last.sbp, 
    temp: last.temp, 
    takenAt: last.t 
  } : undefined;
  
  const status = laneLabel === "Room" ? (p.roomName ?? "Rooming") : laneLabel;
  const primaryLabel = laneLabel === "Waiting" ? "Start Triage" : laneLabel === "Triage" ? "+ Obs" : undefined;

  return (
    <PatientCardExpandable
      role="RN"
      patientId={p.id}
      name={p.displayName || `${p.givenName ?? ''} ${p.familyName ?? ''}`.trim() || '—'}
      ageSex={p.age ? `${p.age}${p.sex ? ` ${p.sex}` : ''}` : p.sex}
      status={status}
      timer={p.waitingFor}
      complaint={p.chiefComplaint}
      ews={p.ews}
      ats={p.ats}
      minVitals={minVitals}
      primaryLabel={primaryLabel}
      onPrimary={
        primaryLabel === "Start Triage" ? () => onStartTriage(p) :
        primaryLabel === "+ Obs" ? () => {
          console.log("RNPatientRow onPrimary + Obs clicked for patient:", p);
          onOpenObs(p);
        } : undefined
      }
      onAddObs={(patient) => {
        console.log("RNPatientRow onAddObs called with patient:", patient, "fallback p:", p);
        onOpenObs(patient || p);
      }}
      onOpenVitals={() => onOpenVitals(p)}
      onOpenFull={() => onOpenCard(p)}
    />
  );
}