import { Button } from "@/components/ui/button";
import { Hospital, Brain, AlertTriangle, Bed, RotateCcw } from "lucide-react";
import { useState, useEffect } from "react";
import { useDashboardStore } from "@/stores/dashboardStore";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

function UserRolePicker() {
  const { user, setUser, roleView, setRoleView } = useDashboardStore();
  
  const userOptions = [
    { name: "Nurse J. Smith", role: "rn" },
    { name: "Dr. Wilson", role: "md" },
    { name: "Charge Nurse", role: "charge" },
    { name: "Bed Manager", role: "bedmgr" },
    { name: "Reception/Admin", role: "reception" }
  ];

  const roleViewOptions = [
    { value: "full", label: "Full dashboard" },
    { value: "rn", label: "RN view" },
    { value: "md", label: "MD view" },
    { value: "charge", label: "Charge view" },
    { value: "bedmgr", label: "BedMgr view" },
    { value: "reception", label: "Reception view" }
  ];

  return (
    <div className="flex items-center space-x-3">
      <select
        className="text-sm border border-gray-300 rounded px-3 py-1 bg-white"
        value={`${user.role}|${user.name}`}
        onChange={(e) => {
          const [role, ...rest] = e.target.value.split("|");
          const name = rest.join("|");
          setUser({ name, role });
        }}
      >
        {userOptions.map(option => (
          <option key={option.role} value={`${option.role}|${option.name}`}>
            {option.name} ({option.role})
          </option>
        ))}
      </select>
      
      <select
        className="text-sm border border-gray-300 rounded px-3 py-1 bg-white"
        value={roleView || "full"}
        onChange={(e) => setRoleView(e.target.value)}
        title="Role view (UI filter)"
      >
        {roleViewOptions.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function Header() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const isConnected = useDashboardStore((state) => state.isConnected);
  const demoMode = useDashboardStore((state) => state.demoMode);
  const roleView = useDashboardStore((state) => state.roleView);
  const setRoleView = useDashboardStore((state) => state.setRoleView);
  const resetDemo = useDashboardStore((state) => state.resetDemo);
  const { toast } = useToast();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleScenario = async (scenario: string) => {
    try {
      await apiRequest('POST', `/api/scenario/${scenario}`);
      toast({
        title: "Scenario Activated",
        description: `${scenario.charAt(0).toUpperCase() + scenario.slice(1)} scenario has been triggered.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to activate ${scenario} scenario.`,
        variant: "destructive",
      });
    }
  };

  const handleResetDemo = async () => {
    try {
      await resetDemo();
      toast({
        title: "Demo Reset Complete",
        description: "Demo board has been cleared and reseeded with fresh test data.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reset demo.",
        variant: "destructive",
      });
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-full px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center space-x-3">
            <div className="bg-medical-blue p-2 rounded-lg">
              <Hospital className="text-white text-xl w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">ED Flow Agent</h1>
              <p className="text-sm text-gray-600">Emergency Department Patient Flow Dashboard</p>
            </div>
          </div>

          {/* User and Role Selection */}
          <div className="flex items-center space-x-4">
            <UserRolePicker />
          </div>

          {/* Control Actions */}
          <div className="flex items-center space-x-3">
            {roleView !== "full" && (
              <button
                onClick={() => setRoleView("full")}
                className="px-3 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-sm text-gray-700 transition-colors"
                title="Show all lanes"
                data-testid="button-return-full-view"
              >
                Return to Full View
              </button>
            )}
          </div>

          {/* Real-time Status */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-green-50 px-3 py-2 rounded-lg">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-medical-green animate-pulse' : 'bg-gray-400'}`}></div>
              <span className={`text-sm font-medium ${isConnected ? 'text-medical-green' : 'text-gray-600'}`}>
                {isConnected ? 'Live' : 'Disconnected'}
              </span>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold text-gray-900" data-testid="current-time">
                {currentTime.toLocaleTimeString('en-US', { hour12: false })}
              </div>
              <div className="text-xs text-gray-600">Local Time</div>
            </div>
          </div>

          {/* Scenario Controls */}
          <div className="flex items-center space-x-3">
            {demoMode && (
              <>
                <Button 
                  onClick={handleResetDemo}
                  variant="outline"
                  size="sm"
                  className="border-gray-300 hover:bg-gray-50"
                  data-testid="button-reset-demo"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset Demo
                </Button>
                <div className="h-6 border-l border-gray-300 mx-2" />
              </>
            )}
            <span className="text-sm font-medium text-gray-700">Demo Scenarios:</span>
            <Button 
              onClick={() => handleScenario('surge')}
              className="bg-medical-red hover:bg-red-700 text-white"
              size="sm"
              data-testid="button-surge-scenario"
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Surge
            </Button>
            <Button 
              onClick={() => handleScenario('stroke')}
              className="bg-medical-amber hover:bg-yellow-600 text-white"
              size="sm"
              data-testid="button-stroke-scenario"
            >
              <Brain className="w-4 h-4 mr-2" />
              Stroke
            </Button>
            <Button 
              onClick={() => handleScenario('boarding')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
              size="sm"
              data-testid="button-boarding-scenario"
            >
              <Bed className="w-4 h-4 mr-2" />
              Boarding
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
