import React, { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Activity, ListChecks } from "lucide-react";
import ObservationSetModalTouch, { type TouchObservation } from "@/components/ObservationSetModalTouch";
import { buildObsDefaults } from "@/lib/obsDefaults";
import { saveObsToStore } from "@/components/patient/ObsSaveToStore";
import EWSChipLive from "@/components/patient/EWSChipLive";

export type Role = "reception" | "charge" | "rn" | "md";
export type ATS = 1|2|3|4|5;

export interface EWS { score: number; riskLevel: "low"|"medium"|"high"; calculatedAt: string }
export interface PatientLite {
  id: string; name: string; age: number; sex: "M"|"F"|"X"; location: string; arrival: string; ats?: ATS; ews: EWS;
  observations: Array<{ id: string; type: string; value: string; unit?: string; takenAt: string; recordedBy: string; phase?: string }>;
}

export default function LanePatientTile({ patient, role, onAddObservations }:{ patient: PatientLite; role: Role; onAddObservations?: (pid: string, list: TouchObservation[])=>void }){
  const [open, setOpen] = useState(false);
  const defaults = useMemo(()=> buildObsDefaults(patient.observations as any), [patient.observations]);
  const lastObs = useMemo(()=> patient.observations.slice().sort((a,b)=>a.takenAt.localeCompare(b.takenAt)).at(-1), [patient.observations]);

  return (
    <div className="flex items-center justify-between gap-2">
      <div className="min-w-0">
        <div className="font-medium truncate">{patient.name} <span className="text-muted-foreground">• {patient.age} {patient.sex}</span></div>
        <div className="text-xs text-muted-foreground truncate">{patient.location} • Arrived {new Date(patient.arrival).toLocaleTimeString()}</div>
        {lastObs && <div className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground"><Activity className="h-3 w-3"/>Last obs {new Date(lastObs.takenAt).toLocaleTimeString()}</div>}
      </div>
      <div className="flex items-center gap-2">
        <EWSChipLive patientId={patient.id} fallback={patient.ews.score} />
        {(role==='rn' || role==='charge') && (
          <Button size="sm" onClick={()=>setOpen(true)}>+ Obs</Button>
        )}
        {role==='hca' && (
          <span className="text-xs text-slate-500">View only</span>
        )}
      </div>

      <ObservationSetModalTouch
        open={open}
        onOpenChange={setOpen}
        patientName={`${patient.name} • ${patient.age} ${patient.sex}`}
        patientId={patient.id}
        defaults={defaults}
        recorder={role.toUpperCase()}
        isTriage={/triage/i.test(patient.location)}
        onSave={(list)=> {
          // Transform and save to vitals store for instant UI update
          const obsRecord: Record<string, number> = {};
          list.forEach(obs => {
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
          saveObsToStore(patient.id, obsRecord);
          
          // Also save to API via callback
          onAddObservations?.(patient.id, list);
        }}
      />
    </div>
  );
}