import React, { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Activity, ListChecks } from "lucide-react";
import ObservationSetModalTouch, { type Observation as TouchObservation } from "@/components/ObservationSetModalTouch";
import { buildObsDefaults } from "@/lib/obsDefaults";

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
        <Badge className={patient.ews.riskLevel==='high' ? 'bg-red-600' : patient.ews.riskLevel==='medium' ? 'bg-yellow-500' : 'bg-green-600'}>EWS {patient.ews.score}</Badge>
        {(role==='rn' || role==='charge') && (
          <Button size="sm" onClick={()=>setOpen(true)}>+ Obs</Button>
        )}
      </div>

      <ObservationSetModalTouch
        open={open}
        onOpenChange={setOpen}
        patientName={`${patient.name} • ${patient.age} ${patient.sex}`}
        defaults={defaults}
        recorder={role.toUpperCase()}
        isTriage={/triage/i.test(patient.location)}
        onSave={(list)=> onAddObservations?.(patient.id, list)}
      />
    </div>
  );
}