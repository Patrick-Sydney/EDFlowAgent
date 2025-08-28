import { Button } from "@/components/ui/button";
import { Hospital, UserPlus } from "lucide-react";
import { useState, useEffect } from "react";
import { useDashboardStore } from "@/stores/dashboardStore";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import ScenarioMenu from "./ScenarioMenu";

function RoleViewPicker() {
  const { roleView, setRoleView } = useDashboardStore();

  const roleViewOptions = [
    { value: "charge", label: "Charge view" },
    { value: "rn", label: "RN view" },
    { value: "md", label: "MD view" },
    { value: "bedmgr", label: "BedMgr view" },
    { value: "reception", label: "Reception view" },
    { value: "developer", label: "Developer view" }
  ];

  return (
    <select
      className="text-xs sm:text-sm border border-gray-300 rounded px-2 sm:px-3 py-2 bg-white min-h-[44px] sm:min-h-auto"
      value={roleView || "charge"}
      onChange={(e) => setRoleView(e.target.value)}
      title="Role view (UI filter)"
    >
      {roleViewOptions.map(option => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

export function Header() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const isConnected = useDashboardStore((state) => state.isConnected);
  const demoMode = useDashboardStore((state) => state.demoMode);
  const roleView = useDashboardStore((state) => state.roleView);
  const setRoleView = useDashboardStore((state) => state.setRoleView);
  const openRegister = useDashboardStore((state) => state.openRegister);
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
      <div className="max-w-full px-3 sm:px-6 py-3 sm:py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
          {/* Logo and Title */}
          <div className="flex items-center space-x-3">
            <div className="bg-medical-blue p-2 rounded-lg">
              <Hospital className="text-white text-xl w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-gray-900">ED Flow Agent</h1>
              <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">Emergency Department Patient Flow Dashboard</p>
            </div>
          </div>

          {/* Controls Row - Mobile optimized */}
          <div className="flex items-center justify-between sm:justify-end space-x-3">
            <RoleViewPicker />
            
            {/* Real-time Status */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="flex items-center space-x-2 bg-green-50 px-2 sm:px-3 py-1 sm:py-2 rounded-lg">
                <div className={`w-2 sm:w-3 h-2 sm:h-3 rounded-full ${isConnected ? 'bg-medical-green animate-pulse' : 'bg-gray-400'}`}></div>
                <span className={`text-xs sm:text-sm font-medium ${isConnected ? 'text-medical-green' : 'text-gray-600'}`}>
                  {isConnected ? 'Live' : 'Off'}
                </span>
              </div>
              <div className="text-right">
                <div className="text-xs sm:text-sm font-semibold text-gray-900" data-testid="current-time">
                  {currentTime.toLocaleTimeString('en-US', { hour12: false })}
                </div>
                <div className="text-xs text-gray-600 hidden sm:block">Local Time</div>
              </div>
            </div>

            {/* Demo/Testing Controls */}
            {demoMode && (
              <ScenarioMenu 
                runScenario={(key) => {
                  if (key === "reset") handleResetDemo();
                  else handleScenario(key);
                }}
              />
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
