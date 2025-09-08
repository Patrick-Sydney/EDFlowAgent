import React, { useMemo, useCallback } from "react";
import PatientCardExpandable from "@/components/PatientCardExpandable";
import { useVitalsLast } from "@/stores/vitalsStore";

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
  
  // Memoize objects to prevent infinite re-renders
  const minVitals = useMemo(() => 
    last ? { 
      rr: last.rr, 
      spo2: last.spo2, 
      hr: last.hr, 
      sbp: last.sbp, 
      temp: last.temp, 
      takenAt: last.t 
    } : undefined,
    [last]
  );
  
  const status = useMemo(() => 
    laneLabel === "Room" ? (p.roomName ?? "Rooming") : laneLabel,
    [laneLabel, p.roomName]
  );
  
  const primaryLabel = useMemo(() => 
    laneLabel === "Waiting" ? "Start Triage" : laneLabel === "Triage" ? "+ Obs" : undefined,
    [laneLabel]
  );
  
  // Memoize alert flags to prevent object recreation
  const alertFlags = useMemo(() => ({
    isolation: p.isolationRequired ?? false,
    sepsisActive: false,
    strokePathway: false,
    stemiPathway: false,
    allergySevere: null
  }), [p.isolationRequired]);
  
  // Memoize event handlers to prevent function recreation
  const handlePrimary = useCallback(() => {
    if (primaryLabel === "Start Triage") {
      onStartTriage(p);
    } else if (primaryLabel === "+ Obs") {
      console.log("RNPatientRow onPrimary + Obs clicked for patient:", p);
      onOpenObs(p);
    }
  }, [primaryLabel, onStartTriage, onOpenObs, p]);
  
  const handleAddObs = useCallback((patient: any) => {
    onOpenObs(patient || p);
  }, [onOpenObs, p]);
  
  const handleOpenFull = useCallback(() => {
    onOpenCard(p);
  }, [onOpenCard, p]);
  

  return (
    <PatientCardExpandable
      role="RN"
      patientId={p.id}
      name={p.displayName || `${p.givenName ?? ''} ${p.familyName ?? ''}`.trim() || '—'}
      ageSex={p.age ? `${p.age}${p.sex ? ` ${p.sex}` : ''}` : p.sex}
      status={status}
      timer={p.waitingFor}
      complaint={p.chiefComplaint}
      locationLabel={p.roomName}
      ews={p.ews}
      ats={p.ats}
      minVitals={minVitals}
      isolationRequired={p.isolationRequired}
      alertFlags={alertFlags}
      data-testid={`patient-card-${p.id}`}
      primaryLabel={primaryLabel}
      onPrimary={primaryLabel ? handlePrimary : undefined}
      onAddObs={handleAddObs}
      onOpenFull={handleOpenFull}
    />
  );
}