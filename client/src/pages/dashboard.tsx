import { useEffect, useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { StatsBar } from "@/components/StatsBar";
import { PatientLane } from "@/components/PatientLane";
import { useDashboardStore } from "@/stores/dashboardStore";
import { sseManager } from "@/lib/sse";
import { useJourneyStore } from "@/stores/journeyStore";
import { type Encounter, LANES } from "@shared/schema";
import RegisterDrawer from "@/components/RegisterDrawer";
import TriageDrawer from "@/components/TriageDrawer";
import RoomManagementDrawer from "@/components/RoomManagementDrawer";
import SpaceSummaryBar from "@/components/SpaceSummaryBar";
import ReceptionView from "@/components/ReceptionView";
import { ObservationDemo } from "@/components/ObservationDemo";
import { useMonitoringScheduler } from "@/hooks/useMonitoringScheduler";
import RNViewAdapter from "@/views/RNView.adapter";
import { Lane, PatientLite } from "@/views/RNViewMobile";
import ChargeViewMobile, { ChargeLane, ChargePatient } from "@/views/ChargeViewMobile";
import MDViewMobile, { MDLane, MDPatient } from "@/views/MDViewMobile";
import ObservationSetModalTouch from "@/components/ObservationSetModalTouch";
import { buildObsDefaults } from "@/lib/obsDefaults";
import { saveObsToStore } from "@/components/patient/ObsSaveToStore";
import AppHeaderMobile, { Role } from "@/components/app/AppHeaderMobile";
import PatientIdentitySheet, { PatientIdentity } from "@/components/PatientIdentitySheet";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Dashboard() {
  const { encounters, setEncounters, setDemoMode, roleView, setRoleView, resetDemo, demoMode } = useDashboardStore();
  const [obsModalOpen, setObsModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<PatientLite | null>(null);
  const [identityOpen, setIdentityOpen] = useState(false);
  const [selectedIdentity, setSelectedIdentity] = useState<PatientIdentity | null>(null);
  const { toast } = useToast();
  
  // Start monitoring scheduler for automatic task status updates
  useMonitoringScheduler();

  // Fetch initial encounters and config
  const { data, isLoading, error } = useQuery<Encounter[]>({
    queryKey: ['/api/encounters'],
    staleTime: 0, // Always fetch fresh data
  });

  // Fetch config to determine demo mode
  const { data: config } = useQuery<{demoMode: boolean, triageInRoom: boolean}>({
    queryKey: ['/api/config'],
    staleTime: 300000, // Cache for 5 minutes
  });

  // Initialize SSE connection and set initial data
  useEffect(() => {
    if (data) {
      setEncounters(data);
    }
    
    if (config) {
      setDemoMode(config.demoMode);
    }
    
    // Seed demo vitals data for timeline testing
    if (typeof window !== 'undefined') {
      (window as any).ED_DEMO = {
        observations: {
          'a431685d-7e3a-4e9e-8a84-123456789abc': {
            observations: [
              { t: '2025-08-29T10:00:00+12:00', rr: 22, spo2: 94, hr: 118, sbp: 102, temp: 38.1, source: 'triage', ews: 5 },
              { t: '2025-08-29T10:30:00+12:00', rr: 24, spo2: 92, hr: 124, sbp: 98, temp: 38.4, source: 'obs', ews: 6 },
              { t: '2025-08-29T11:15:00+12:00', rr: 20, spo2: 96, hr: 110, sbp: 104, temp: 37.9, source: 'obs', ews: 4 },
            ],
            events: [
              { t: '2025-08-29T10:10:00+12:00', type: 'cultures', label: 'Blood cultures' },
              { t: '2025-08-29T10:20:00+12:00', type: 'lactate', label: 'Lactate' },
              { t: '2025-08-29T10:25:00+12:00', type: 'abx', label: 'Antibiotics' },
              { t: '2025-08-29T10:28:00+12:00', type: 'fluids', label: 'Fluids 30 mL/kg' },
            ]
          }
        }
      };
    }
    
    // Start SSE connection
    sseManager.connect();

    // Keyboard shortcut: Ctrl/Cmd+F for Charge View  
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f") {
        e.preventDefault();
        try {
          setRoleView("charge");
        } catch (error) {
          console.error("Failed to set charge view:", error);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    // Cleanup on unmount
    return () => {
      sseManager.disconnect();
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [data, config, setEncounters, setDemoMode, setRoleView]);

  const getEncountersByLane = useDashboardStore((state) => state.getEncountersByLane);
  const phaseById = useJourneyStore((s) => s.phaseById);
  
  // Calculate time since arrival for each patient
  const calculateWaitingTime = (arrivalTime: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - arrivalTime.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    
    if (diffHours > 0) {
      return `${diffHours}h ${diffMins % 60}m`;
    }
    return `${diffMins}m`;
  };
  
  // Transform encounters to mobile RN format
  const rnLanes = useMemo(() => {
    const waiting = encounters.filter(e => e.lane === "waiting");
    const triage = encounters.filter(e => e.lane === "triage");
    const roomed = encounters.filter(e => ["roomed", "diagnostics", "review", "ready"].includes(e.lane));
    
    const transformPatient = (e: Encounter): PatientLite => {
      return {
        id: e.id,
        givenName: e.name.split(' ')[0] || '',
        familyName: e.name.split(' ').slice(1).join(' ') || '',
        displayName: e.name,
        chiefComplaint: e.complaint,
        waitingFor: calculateWaitingTime(new Date(e.arrivalTime)),
        ews: e.ats, // Using ATS as EWS for now
        roomName: e.room,
        age: e.age,
        sex: e.sex
      };
    };

    return [
      { id: "waiting", label: "Waiting", patients: waiting.map(transformPatient) },
      { id: "triage", label: "Triage", patients: triage.map(transformPatient) },
      { id: "roomed", label: "Room/Care", patients: roomed.map(transformPatient) }
    ];
  }, [encounters]);
  
  // Transform encounters for Charge mobile view
  const chargeLanes = useMemo(() => {
    const waiting = encounters.filter(e => e.lane === "waiting");
    const triage = encounters.filter(e => e.lane === "triage"); 
    const roomed = encounters.filter(e => ["roomed", "diagnostics", "review", "ready"].includes(e.lane));
    
    const transformChargePatient = (e: Encounter): ChargePatient => ({
      id: e.id,
      givenName: e.name.split(' ')[0] || '',
      familyName: e.name.split(' ').slice(1).join(' ') || '',
      displayName: e.name,
      chiefComplaint: e.complaint,
      waitingFor: `${calculateWaitingTime(new Date(e.arrivalTime))} waiting`,
      ews: e.ats,
      roomName: e.room,
      age: e.age,
      sex: e.sex,
      arrivalAt: e.arrivalTime
    });

    return [
      { id: 'waiting' as const, label: "Waiting", patients: waiting.map(transformChargePatient) },
      { id: 'intriage' as const, label: "In Triage", patients: triage.map(transformChargePatient) },
      { id: 'room' as const, label: "In Rooms", patients: roomed.map(transformChargePatient) }
    ];
  }, [encounters]);
  
  // Transform encounters for MD mobile view
  const mdLanes = useMemo(() => {
    const worklist = encounters.filter(e => ["roomed", "diagnostics"].includes(e.lane));
    const results = encounters.filter(e => e.lane === "review");
    const dispo = encounters.filter(e => e.lane === "ready");
    
    const transformMDPatient = (e: Encounter): MDPatient => ({
      id: e.id,
      givenName: e.name.split(' ')[0] || '',
      familyName: e.name.split(' ').slice(1).join(' ') || '',
      displayName: e.name,
      chiefComplaint: e.complaint,
      mdWaiting: `${calculateWaitingTime(new Date(e.arrivalTime))} waiting for MD`,
      ews: e.ats,
      roomName: e.room,
      age: e.age,
      sex: e.sex,
      resultsReady: e.lane === "review",
      dispoReady: e.lane === "ready"
    });

    return [
      { id: 'worklist' as const, label: "Worklist", patients: worklist.map(transformMDPatient) },
      { id: 'results' as const, label: "Results", patients: results.map(transformMDPatient) },
      { id: 'dispo' as const, label: "Disposition", patients: dispo.map(transformMDPatient) }
    ];
  }, [encounters]);
  
  // RN Mobile handlers
  const handleStartTriage = (patient: PatientLite) => {
    const encounter = encounters.find(e => e.id === patient.id);
    if (encounter) {
      useDashboardStore.getState().openTriage(encounter);
    }
  };

  const handleOpenObs = (patient: PatientLite) => {
    setSelectedPatient(patient);
    setObsModalOpen(true);
  };

  const handleOpenCard = (patient: PatientLite | ChargePatient | MDPatient) => {
    // Open patient details - could expand later
    console.log("Open patient card for:", patient.displayName);
  };

  const handleSaveObs = async (observations: any[]) => {
    if (!selectedPatient) return;
    
    // Transform and save to vitals store for instant UI update
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
    saveObsToStore(selectedPatient.id, obsRecord);
    
    // Also save to API
    await useDashboardStore.getState().addObservation(selectedPatient.id, observations);
    
    setObsModalOpen(false);
    setSelectedPatient(null);
  };
  
  // Get observation defaults for selected patient
  const obsDefaults = useMemo(() => {
    if (!selectedPatient) return {};
    // For now return empty defaults - would need obs in schema
    return {};
  }, [selectedPatient]);

  const isFirstObs = useMemo(() => {
    if (!selectedPatient) return true;
    // For now assume first obs - would need obs in schema
    return true;
  }, [selectedPatient]);
  
  // Mobile header handlers
  const handleMobileRoleChange = (role: Role) => {
    const roleMap: Record<Role, string> = {
      "RN view": "rn",
      "Charge view": "charge", 
      "MD view": "md"
    };
    setRoleView(roleMap[role]);
  };
  
  const handleMobileScenarios = async () => {
    if (!demoMode) return;
    
    // For simplicity, just trigger a surge scenario on mobile
    try {
      await apiRequest('POST', '/api/scenario/surge');
      toast({
        title: "Scenario Activated",
        description: "Surge scenario has been triggered.",
      });
    } catch (error) {
      toast({
        title: "Error", 
        description: "Failed to activate scenario.",
        variant: "destructive",
      });
    }
  };
  
  // Charge mobile handlers
  const handleAssignRoom = (patient: ChargePatient) => {
    console.log("Assign room for:", patient.displayName);
    // TODO: Implement room assignment logic
  };
  
  // MD mobile handlers  
  const handleSeeNow = (patient: MDPatient) => {
    console.log("See now:", patient.displayName);
    // TODO: Implement see now logic
  };
  
  const handleOpenResults = (patient: MDPatient) => {
    console.log("Open results for:", patient.displayName);
    // TODO: Implement results view
  };
  
  const handleOrderSet = (patient: MDPatient) => {
    console.log("Order set for:", patient.displayName);
    // TODO: Implement order sets
  };
  
  const handleDispo = (patient: MDPatient) => {
    console.log("Disposition for:", patient.displayName);
    // TODO: Implement disposition logic
  };
  
  // Identity sheet handler
  const handleOpenIdentity = (patient: PatientLite | ChargePatient | MDPatient) => {
    // Transform patient data to identity format
    const identity: PatientIdentity = {
      id: patient.id,
      legalName: patient.displayName || `${patient.givenName || ''} ${patient.familyName || ''}`.trim(),
      age: patient.age,
      sex: patient.sex,
      nhi: `ABC${Math.random().toString().slice(2, 6)}`, // Mock NHI for demo
      mrn: `MRN${patient.id.slice(-6)}`, // Mock MRN
      allergies: ["NKDA"], // Mock data
      alerts: [] // No alerts for demo
    };
    
    setSelectedIdentity(identity);
    setIdentityOpen(true);
  };
  
  const getMobileRole = (): Role => {
    const roleMap: Record<string, Role> = {
      "rn": "RN view",
      "charge": "Charge view",
      "md": "MD view"
    };
    return roleMap[roleView] || "Charge view";
  };

  // Role-based lane filtering with safe fallback
  const roleToLanes: Record<string, string[]> = {
    developer: [...LANES], // Developer sees everything
    charge: ["waiting", "triage", "roomed", "diagnostics", "review", "ready", "discharged"],
    rn: ["waiting", "triage", "roomed"],
    md: ["roomed", "diagnostics", "review"],
    bedmgr: ["ready", "discharged"],
    reception: ["waiting", "triage"]
  };

  const allLaneKeys = [...LANES];
  const visibleLanes = roleToLanes[roleView || "charge"] || allLaneKeys;
  const filteredLanes = LANES.filter(lane => visibleLanes.includes(lane));

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-medical-blue"></div>
          <p className="mt-4 text-lg text-gray-600">Loading ED Flow Dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Connection Error</h1>
          <p className="text-gray-600">Failed to load dashboard data. Please refresh the page.</p>
        </div>
      </div>
    );
  }

  // Reception view gets its own layout
  if (roleView === "reception") {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <main className="flex-1">
          <ReceptionView />
        </main>
        {/* Drawers */}
        <RegisterDrawer />
        <TriageDrawer />
        <RoomManagementDrawer />
      </div>
    );
  }

  // Check if we should use mobile view for any role
  const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches;
  const shouldUseMobileView = isMobile && ["rn", "charge", "md"].includes(roleView);
  
  // If mobile view, render the appropriate mobile interface
  if (shouldUseMobileView) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeaderMobile
          role={getMobileRole()}
          onChangeRole={handleMobileRoleChange}
          onScenarios={demoMode ? handleMobileScenarios : undefined}
        />
        {roleView === "rn" && (
          <RNViewAdapter
            lanes={rnLanes}
            onStartTriage={handleStartTriage}
            onOpenObs={handleOpenObs}
            onOpenCard={handleOpenCard}
            onOpenIdentity={handleOpenIdentity}
          />
        )}
        
        {roleView === "charge" && (
          <ChargeViewMobile
            lanes={chargeLanes}
            onStartTriage={handleStartTriage}
            onAssignRoom={handleAssignRoom}
            onOpenCard={handleOpenCard}
            onAddObs={handleOpenObs}
            onOpenIdentity={handleOpenIdentity}
          />
        )}
        
        {roleView === "md" && (
          <MDViewMobile
            lanes={mdLanes}
            onSeeNow={handleSeeNow}
            onOpenResults={handleOpenResults}
            onOrderSet={handleOrderSet}
            onDispo={handleDispo}
            onOpenCard={handleOpenCard}
            onOpenIdentity={handleOpenIdentity}
          />
        )}
        
        {/* Drawers */}
        <RegisterDrawer />
        <TriageDrawer />
        <RoomManagementDrawer />
        
        <ObservationSetModalTouch
          open={obsModalOpen}
          onOpenChange={setObsModalOpen}
          patientName={selectedPatient?.displayName || ""}
          defaults={obsDefaults}
          isFirstObs={isFirstObs}
          onSave={handleSaveObs}
          recorder="RN Mobile"
          isTriage={selectedPatient ? rnLanes.find(l => l.patients.some(p => p.id === selectedPatient.id))?.id === "triage" : false}
        />
        
        {/* Patient Identity Sheet */}
        {selectedIdentity && (
          <PatientIdentitySheet
            open={identityOpen}
            onOpenChange={setIdentityOpen}
            patient={selectedIdentity}
            role={roleView === "rn" ? "RN" : roleView === "charge" ? "Charge" : "MD"}
            onAudit={(evt) => console.log("Identity audit:", evt)}
          />
        )}
      </div>
    );
  }
  
  return (
    <div className="bg-gray-50 min-h-screen">
      <Header />
      
      <main className="p-3 sm:p-6">
        {/* Hide desktop stats on mobile when in RN mode */}
        <div className={roleView === "rn" ? "hidden md:block" : ""}>
          <StatsBar />
        </div>
        
        {/* Treatment Spaces Summary - for Charge Nurse and Developer views */}
        {(roleView === "charge" || roleView === "developer") && <SpaceSummaryBar />}
        
        {/* Temporary monitoring demo - Developer only */}
        {roleView === "developer" && (
          <div className="mb-4 flex justify-end">
            <ObservationDemo />
          </div>
        )}
        
        {/* Left-side Register drawer (Reception) */}
        <RegisterDrawer />
        
        {/* Triage Drawer */}
        <TriageDrawer />
        
        {/* Room Management Drawer */}
        <RoomManagementDrawer />
        
        {/* Patient Flow Lanes */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-6">
          {/* Mobile: Single column stack, Desktop: Horizontal scroll */}
          <div className="sm:overflow-x-auto">
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6 pb-4 sm:min-w-[1960px]">
              {filteredLanes.map(lane => {
                // Get encounters by lane, then re-classify using phaseById for reactive movement
                const baseEncounters = getEncountersByLane(lane);
                const phaseKey = lane.toLowerCase() as keyof typeof phaseById;
                const phaseFilteredEncounters = encounters.filter(enc => {
                  const phase = phaseById[enc.id] ?? "Waiting";
                  // Map phases to lane names
                  const phaseToLane: Record<string, string> = {
                    "Waiting": "waiting",
                    "In Triage": "triage", 
                    "Roomed": "roomed",
                    "Diagnostics": "diagnostics",
                    "Review": "review"
                  };
                  return phaseToLane[phase] === lane;
                });
                
                return (
                  <PatientLane
                    key={lane}
                    lane={lane}
                    encounters={phaseFilteredEncounters}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}