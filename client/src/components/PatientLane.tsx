import { type Lane, type Encounter } from "@shared/schema";
import { PatientCard } from "./PatientCard";
import PatientCardExpandable, { type Role } from "./PatientCardExpandable";
import { useDashboardStore } from "@/stores/dashboardStore";
import { Clock, Stethoscope, DoorOpen, Search, UserCheck, ClipboardCheck, LogOut } from "lucide-react";

interface PatientLaneProps {
  lane: Lane;
  encounters: Encounter[];
}

const laneConfig = {
  waiting: {
    title: "Waiting",
    icon: Clock,
    bgColor: "bg-gray-50",
    badgeColor: "bg-gray-200 text-gray-700"
  },
  triage: {
    title: "Triage", 
    icon: Stethoscope,
    bgColor: "bg-amber-50",
    badgeColor: "bg-amber-200 text-amber-800"
  },
  roomed: {
    title: "Roomed",
    icon: DoorOpen,
    bgColor: "bg-green-50",
    badgeColor: "bg-green-200 text-green-800"
  },
  diagnostics: {
    title: "Diagnostics",
    icon: Search,
    bgColor: "bg-purple-50", 
    badgeColor: "bg-purple-200 text-purple-800"
  },
  review: {
    title: "Review/Decision",
    icon: UserCheck,
    bgColor: "bg-blue-50",
    badgeColor: "bg-blue-200 text-blue-800"
  },
  ready: {
    title: "Ready for Dispo",
    icon: ClipboardCheck,
    bgColor: "bg-green-50",
    badgeColor: "bg-green-200 text-green-800"
  },
  discharged: {
    title: "Discharged/Admitted",
    icon: LogOut,
    bgColor: "bg-gray-50",
    badgeColor: "bg-gray-200 text-gray-700"
  }
};

export function PatientLane({ lane, encounters }: PatientLaneProps) {
  const config = laneConfig[lane];
  const Icon = config.icon;
  const roleView = useDashboardStore((state) => state.roleView);
  const openTriage = useDashboardStore((state) => state.openTriage);
  const openRoom = useDashboardStore((state) => state.openRoom);
  
  // Map roleView to Role type
  const role: Role = (roleView === "reception" || roleView === "charge" || roleView === "rn" || roleView === "md") 
    ? roleView as Role 
    : "charge";

  return (
    <div className="lane-container" style={{ minWidth: '280px' }} data-testid={`lane-${lane}`}>
      <div className={`${config.bgColor} rounded-lg p-4 h-full min-h-[600px]`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
            <Icon className="w-5 h-5 text-gray-600" />
            <span>{config.title}</span>
          </h3>
          <span 
            className={`${config.badgeColor} px-2 py-1 rounded-full text-xs font-medium`}
            data-testid={`count-${lane}`}
          >
            {encounters.length}
          </span>
        </div>
        
        <div className="space-y-3">
          {encounters.length === 0 ? (
            <div className="text-center text-gray-500 text-sm py-8" data-testid={`empty-${lane}`}>
              No patients in {config.title.toLowerCase()}
            </div>
          ) : (
            encounters.map(encounter => (
              <PatientCardExpandable 
                key={encounter.id} 
                encounter={encounter} 
                role={role}
                onOpenChart={(patientId) => console.log("Open chart for", patientId)}
                onMarkTask={(patientId, taskId, status) => console.log("Mark task", taskId, "as", status, "for", patientId)}
                onOrderSet={(patientId, setName) => console.log("Order", setName, "set for", patientId)}
                onDisposition={(patientId, disp) => console.log("Set disposition", disp, "for", patientId)}
                onStartTriage={(patientId) => {
                  const patient = encounters.find(e => e.id === patientId);
                  if (patient) openTriage(patient);
                }}
                onAssignRoom={(patientId, roomId) => {
                  const patient = encounters.find(e => e.id === patientId);
                  if (patient) openRoom(patient);
                }}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
