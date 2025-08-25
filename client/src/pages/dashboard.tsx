import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { StatsBar } from "@/components/StatsBar";
import { PatientLane } from "@/components/PatientLane";
import { useDashboardStore } from "@/stores/dashboardStore";
import { sseManager } from "@/lib/sse";
import { type Encounter, LANES } from "@shared/schema";
import RegisterDrawer from "@/components/RegisterDrawer";
import TriageDrawer from "@/components/TriageDrawer";

export default function Dashboard() {
  const { encounters, setEncounters, setDemoMode, roleView, setRoleView } = useDashboardStore();

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
    
    // Start SSE connection
    sseManager.connect();

    // Keyboard shortcut: Ctrl/Cmd+F for Full View
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f") {
        e.preventDefault();
        try {
          setRoleView("full");
        } catch (error) {
          console.error("Failed to set full view:", error);
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

  // Role-based lane filtering with safe fallback
  const roleToLanes: Record<string, string[]> = {
    full: [...LANES],
    rn: ["waiting", "triage", "roomed"],
    md: ["roomed", "diagnostics", "review"],
    charge: ["waiting", "triage", "roomed", "diagnostics", "review", "ready", "discharged"],
    bedmgr: ["ready", "discharged"],
    reception: ["waiting", "triage"]
  };

  const allLaneKeys = [...LANES];
  const visibleLanes = roleToLanes[roleView || "full"] || allLaneKeys;
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

  return (
    <div className="bg-gray-50 min-h-screen">
      <Header />
      
      <main className="p-6">
        <StatsBar />
        
        {/* Left-side Register drawer (Reception) */}
        <RegisterDrawer />
        
        {/* Triage Drawer */}
        <TriageDrawer />
        
        {/* Patient Flow Lanes */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-6">
          {/* Mobile: Single column stack, Desktop: Horizontal scroll */}
          <div className="sm:overflow-x-auto">
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6 pb-4" style={{ minWidth: '1960px' }}>
              {filteredLanes.map(lane => (
                <PatientLane
                  key={lane}
                  lane={lane}
                  encounters={getEncountersByLane(lane)}
                />
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
