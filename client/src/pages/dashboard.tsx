import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { StatsBar } from "@/components/StatsBar";
import { PatientLane } from "@/components/PatientLane";
import { useDashboardStore } from "@/stores/dashboardStore";
import { sseManager } from "@/lib/sse";
import { type Encounter, LANES } from "@shared/schema";

export default function Dashboard() {
  const { encounters, setEncounters } = useDashboardStore();

  // Fetch initial encounters
  const { data, isLoading, error } = useQuery<Encounter[]>({
    queryKey: ['/api/encounters'],
    staleTime: 0, // Always fetch fresh data
  });

  // Initialize SSE connection and set initial data
  useEffect(() => {
    if (data) {
      setEncounters(data);
    }
    
    // Start SSE connection
    sseManager.connect();

    // Cleanup on unmount
    return () => {
      sseManager.disconnect();
    };
  }, [data, setEncounters]);

  const getEncountersByLane = useDashboardStore((state) => state.getEncountersByLane);

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
        
        {/* Patient Flow Lanes */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="overflow-x-auto">
            <div className="flex space-x-6 pb-4" style={{ minWidth: '1960px' }}>
              {LANES.map(lane => (
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
