import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import RNViewAdapter from "@/views/RNView.adapter";
import { Lane, PatientLite } from "@/views/RNViewMobile";
import { VitalsModalWrapper } from "@/components/VitalsModalWrapper";
import { Encounter } from "@shared/schema";
import { useDashboardStore } from "@/stores/dashboardStore";
import { buildObsDefaults } from "@/lib/obsDefaults";
import { useVitals } from "../state/VitalsContext";

// Convert ED encounters to RN mobile format
function transformToLanes(encounters: Encounter[]): Lane[] {
  const waiting = encounters.filter(e => e.lane === "waiting");
  const triage = encounters.filter(e => e.lane === "triage");
  const roomed = encounters.filter(e => ["roomed", "diagnostics", "review", "ready"].includes(e.lane));
  
  const transformPatient = (e: Encounter): PatientLite => {
    // Parse name - assuming format "FirstName LastName"
    const nameParts = e.name.split(' ');
    const givenName = nameParts[0] || '';
    const familyName = nameParts.slice(1).join(' ') || '';
    
    const patient = {
      id: e.id,
      givenName,
      familyName,
      displayName: e.name,
      chiefComplaint: e.complaint,
      waitingFor: undefined, // Would need to calculate from timestamps
      ews: e.ats || undefined, // Using ATS as EWS for now
      roomName: e.room
    };
    
    console.log("transformPatient:", e.name, "ID:", e.id, "->", patient);
    return patient;
  };

  return [
    { id: "waiting", label: "Waiting", patients: waiting.map(transformPatient) },
    { id: "triage", label: "Triage", patients: triage.map(transformPatient) },
    { id: "roomed", label: "Room/Care", patients: roomed.map(transformPatient) }
  ];
}

export default function RNMobilePage() {
  const { data: encounters = [] } = useQuery<Encounter[]>({ queryKey: ['/api/encounters'] });
  const [obsModalOpen, setObsModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<PatientLite | null>(null);
  
  // We'll get patient-specific vitals functions when modal opens
  const lanes = useMemo(() => transformToLanes(encounters), [encounters]);

  const handleStartTriage = (patient: PatientLite) => {
    setSelectedPatient(patient);
    setObsModalOpen(true);
  };

  const handleOpenObs = (patient: PatientLite) => {
    console.log("RN Mobile handleOpenObs - received patient:", patient);
    setSelectedPatient(patient);
    setObsModalOpen(true);
  };

  const handleOpenCard = (patient: PatientLite) => {
    // Would open detailed patient info modal/drawer
  };

  const handleOpenVitals = (patient: PatientLite) => {
    // Would open vitals timeline/drawer
  };

  // Save handling is now done in VitalsModalWrapper

  // Get observation defaults for selected patient
  const obsDefaults = useMemo(() => {
    if (!selectedPatient) return {};
    // For now return empty defaults - observations would need to be added to schema
    return {};
  }, [selectedPatient]);

  const isFirstObs = useMemo(() => {
    if (!selectedPatient) return true;
    // For now assume first obs - observations would need to be added to schema
    return true;
  }, [selectedPatient]);

  return (
    <div className="min-h-screen bg-background">
      <RNViewAdapter
        lanes={lanes}
        onStartTriage={handleStartTriage}
        onOpenObs={handleOpenObs}
        onOpenCard={handleOpenCard}
        onOpenVitals={handleOpenVitals}
      />

      <VitalsModalWrapper
        open={obsModalOpen}
        onOpenChange={(open) => {
          setObsModalOpen(open);
          if (!open) setSelectedPatient(null);
        }}
        patientId={selectedPatient?.id || null}
        patientName={selectedPatient?.displayName || ""}
        defaults={obsDefaults}
        isFirstObs={isFirstObs}
        recorder="RN Mobile"
        isTriage={selectedPatient ? lanes.find(l => l.patients.some(p => p.id === selectedPatient.id))?.id === "triage" : false}
      />
      
    </div>
  );
}