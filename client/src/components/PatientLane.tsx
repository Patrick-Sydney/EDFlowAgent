import { type Lane, type Encounter } from "@shared/schema";
import { PatientCard } from "./PatientCard";
import PatientCardExpandable from "./PatientCardExpandable";
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
  const role = roleView || "charge";

  return (
    <div className="lane-container lane-col" style={{ minWidth: '280px' }} data-testid={`lane-${lane}`}>
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
            encounters.map(encounter => {
              const ageSex = encounter.age ? `${encounter.age}${encounter.sex ? ` ${encounter.sex}` : ''}` : encounter.sex;
              const timer = (() => {
                const arrivalTime = new Date(encounter.arrivalTime);
                const now = new Date();
                const diffMinutes = Math.floor((now.getTime() - arrivalTime.getTime()) / (1000 * 60));
                if (diffMinutes < 60) return `${diffMinutes}m`;
                const hours = Math.floor(diffMinutes / 60);
                const minutes = diffMinutes % 60;
                return `${hours}h ${minutes}m`;
              })();
              
              const currentLane = config.title;
              const status = currentLane === "Room" ? encounter.room ?? "Rooming" : currentLane;
              const locationLabel = encounter.room ? encounter.room : undefined;
              const primaryLabel = currentLane === "Waiting" ? "Start Triage" : "+ Obs";
              const onPrimary = currentLane === "Waiting" 
                ? () => openTriage(encounter)
                : () => console.log("Add obs for", encounter.name);
              
              return (
                <PatientCardExpandable 
                  key={encounter.id}
                  role={role === 'rn' ? 'RN' : role === 'charge' ? 'Charge' : role === 'md' ? 'MD' : 'RN'}
                  name={encounter.name}
                  ageSex={ageSex}
                  status={status}
                  timer={timer}
                  complaint={encounter.complaint}
                  ews={encounter.triageHr ? Math.floor(encounter.triageHr / 30) : undefined}
                  ats={encounter.ats as 1|2|3|4|5}
                  minVitals={{
                    rr: encounter.triageRr || undefined,
                    spo2: encounter.triageSpo2 || undefined,
                    hr: encounter.triageHr || undefined,
                    sbp: encounter.triageSBP || 120,
                    temp: encounter.triageTemp || 36.5,
                    takenAt: new Date().toISOString()
                  }}
                  dob={null}
                  nhi={encounter.nhi}
                  mrn={null}
                  alerts={[]}
                  allergies={[]}
                  primaryLabel={primaryLabel}
                  onPrimary={onPrimary}
                  onAddObs={() => console.log("Add obs for", encounter.name)}
                  onAssignRoom={() => openRoom(encounter)}
                  onOrderSet={() => console.log("Order set for", encounter.name)}
                  patientId={encounter.id}
                  onOpenFull={() => console.log("Open full card for", encounter.name)}
                  statusFlags={{
                    isolation: encounter.isolationRequired === "true",
                    allergy: false, // would need allergy data from schema
                    oxygen: false,  // would need O2 status from observations
                    sepsis: false,  // would need sepsis alerts from schema  
                    tasksDue: 0,    // would need task count from observations
                    resultsPending: 0 // would need results status from schema
                  }}
                  locationLabel={locationLabel}
                  alertFlags={{
                    isolation: encounter.isolationRequired === "true",
                    sepsisActive: false,
                    strokePathway: false,
                    stemiPathway: false,
                    allergySevere: null
                  }}
                  lane={lane}
                  o2Label={null}
                  resultsPending={0}
                  tasks={[]}
                  triageSummary={encounter.complaint}
                  assessment={null}
                  note={null}
                  onOpenResults={() => console.log("Open results for", encounter.name)}
                  onQuickOrders={() => console.log("Quick orders for", encounter.name)}
                  onEditNotes={() => console.log("Edit notes for", encounter.name)}
                />
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
