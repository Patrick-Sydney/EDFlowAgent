import { Button } from "@/components/ui/button";
import { Hospital, UserPlus } from "lucide-react";
import { useState, useEffect } from "react";
import { useDashboardStore } from "@/stores/dashboardStore";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import ScenarioMenu from "./ScenarioMenu";
import RoleMenu from "./shell/RoleMenu";
import ScenariosMenu from "./shell/ScenariosMenu";

function AppLogo() {
  return (
    <div className="bg-medical-blue p-2 rounded-lg">
      <Hospital className="text-white text-xl w-6 h-6" />
    </div>
  );
}

function RoleViewPicker({ compact = false }: { compact?: boolean }) {
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
      className={`border border-gray-300 rounded px-2 sm:px-3 py-2 bg-white min-h-[44px] sm:min-h-auto ${
        compact ? "text-xs" : "text-xs sm:text-sm"
      }`}
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


function LiveClock() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const isConnected = useDashboardStore((state) => state.isConnected);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center space-x-2 sm:space-x-4">
      <div className="flex items-center space-x-2 bg-green-50 px-2 sm:px-3 py-1 sm:py-2 rounded-lg">
        <div className={`w-2 sm:w-3 h-2 sm:h-3 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`}></div>
        <span className={`text-xs sm:text-sm font-medium ${isConnected ? 'text-emerald-600' : 'text-gray-600'}`}>
          {isConnected ? 'Live' : 'Off'}
        </span>
      </div>
      <div className="text-right">
        <div className="text-xs sm:text-sm font-semibold text-gray-900 tabular-nums" data-testid="current-time">
          {currentTime.toLocaleTimeString('en-US', { hour12: false })}
        </div>
        <div className="text-xs text-gray-600 hidden sm:block">Local Time</div>
      </div>
    </div>
  );
}

export function Header() {
  const demoMode = useDashboardStore((state) => state.demoMode);
  const roleView = useDashboardStore((state) => state.roleView);
  const setRoleView = useDashboardStore((state) => state.setRoleView);
  const openRegister = useDashboardStore((state) => state.openRegister);
  const resetDemo = useDashboardStore((state) => state.resetDemo);
  const { toast } = useToast();

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
    <header className="sticky top-0 z-[900] w-full bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      {/* Compact header across mobile/tablet/desktop */}
      <div className="mx-auto max-w-[1600px] px-3 md:px-4 lg:px-6 py-2 flex items-center justify-between gap-2">
        {/* Left cluster: logo + split controls */}
        <div className="flex items-center gap-2">
          <AppLogo />
          <RoleMenu RoleSelector={<RoleViewPicker compact />} />
          {demoMode && (
            <ScenariosMenu onRun={(key) => {
              if (key === "baseline") handleResetDemo();
              else handleScenario(key);
            }} />
          )}
        </div>
        {/* Right cluster */}
        <div className="flex items-center gap-2">
          <LiveClock />
        </div>
      </div>
    </header>
  );
}
