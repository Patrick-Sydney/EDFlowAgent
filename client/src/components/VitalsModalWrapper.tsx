import React from "react";
import ObservationSetModalTouch from "./ObservationSetModalTouch";
import { vitalsStore, ObsPoint } from "../stores/vitalsStore";
import { useDashboardStore } from "../stores/dashboardStore";

export function VitalsModalWrapper({
  open,
  onOpenChange,
  patientId,
  patientName,
  defaults,
  isFirstObs,
  isTriage,
  recorder
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string | null;
  patientName: string;
  defaults: any;
  isFirstObs: boolean;
  isTriage: boolean;
  recorder: string;
}) {
  const handleSave = async (observations: any[]) => {
    if (!patientId) return;
    
    // Transform observations to our format
    const obsRecord: Record<string, number> = {};
    observations.forEach(obs => {
      switch(obs.type) {
        case 'RR': obsRecord.rr = parseFloat(obs.value); break;
        case 'SpO2': obsRecord.spo2 = parseFloat(obs.value); break;
        case 'HR': obsRecord.hr = parseFloat(obs.value); break;
        case 'BP': 
          const bpMatch = obs.value.match(/^(\d+)/);
          if (bpMatch) obsRecord.sbp = parseFloat(bpMatch[1]);
          break;
        case 'Temp': obsRecord.temp = parseFloat(obs.value); break;
      }
    });
    
    // 1) Instant UI update
    const point: ObsPoint = {
      t: new Date().toISOString(),
      rr: obsRecord.rr,
      spo2: obsRecord.spo2,
      hr: obsRecord.hr,
      sbp: obsRecord.sbp,
      temp: obsRecord.temp,
      source: "obs",
    };
    
    vitalsStore.add(patientId, point);
    
    // Debug logging
    console.log("save for", patientId, point);
    
    // 2) Optional server save (do not block the UI)
    try {
      await useDashboardStore.getState().addObservation(patientId, observations);
    } catch (error) {
      console.error("Failed to save to backend:", error);
    }
    
    // Close modal
    onOpenChange(false);
  };

  return (
    <ObservationSetModalTouch
      open={open}
      onOpenChange={onOpenChange}
      patientName={patientName}
      defaults={defaults}
      isFirstObs={isFirstObs}
      onSave={handleSave}
      recorder={recorder}
      isTriage={isTriage}
    />
  );
}