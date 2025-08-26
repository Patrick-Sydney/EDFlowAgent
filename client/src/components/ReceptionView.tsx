import { useMemo, useState } from "react";
import { useDashboardStore } from "@/stores/dashboardStore";
import TButton from "@/components/ui/TButton";
import ReceptionEditDrawer from "@/components/ReceptionEditDrawer";
import { useToast } from "@/hooks/use-toast";

const LANE_ORDER = ["waiting", "triage", "roomed", "ready", "discharged"];
const LANE_TITLES = {
  waiting: "Waiting",
  triage: "Triage", 
  roomed: "Roomed",
  ready: "Ready",
  discharged: "Discharged",
};

export default function ReceptionView() {
  const { encounters, openRegister } = useDashboardStore();
  const { toast } = useToast();
  
  const byLane = useMemo(() => {
    const m: Record<string, any[]> = { waiting: [], triage: [], roomed: [], ready: [], discharged: [] };
    for (const e of encounters) { 
      if (m[e.lane]) m[e.lane].push(e); 
    }
    return m;
  }, [encounters]);

  const [editOpen, setEditOpen] = useState(false);
  const [editEnc, setEditEnc] = useState<any>(null);

  const openEdit = (enc: any) => { 
    setEditEnc(enc); 
    setEditOpen(true); 
  };
  
  const closeEdit = () => { 
    setEditOpen(false); 
    setEditEnc(null); 
  };

  const reprintWristband = async (id: string) => {
    toast({
      title: "Wristband Reprinted",
      description: `Wristband for patient ${id} sent to printer`
    });
  };

  const reprintLabels = async (id: string) => {
    toast({
      title: "Labels Reprinted", 
      description: `Labels for patient ${id} sent to printer`
    });
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Reception View</h2>
        <TButton 
          className="bg-blue-600 text-white min-h-[44px]" 
          onClick={openRegister}
          data-testid="button-register-patient"
        >
          Register Patient
        </TButton>
      </div>

      {/* Waiting lane - detailed cards */}
      <LaneWaiting
        items={byLane.waiting}
        onEdit={openEdit}
        onWrist={reprintWristband}
        onLabels={reprintLabels}
      />

      {/* Read-only summaries */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {LANE_ORDER.filter(k => k !== "waiting").map(k => (
          <ReadOnlyLane key={k} title={LANE_TITLES[k]} items={byLane[k]} />
        ))}
      </div>

      <ReceptionEditDrawer open={editOpen} encounter={editEnc} onClose={closeEdit} />
    </div>
  );
}

interface LaneWaitingProps {
  items: any[];
  onEdit: (enc: any) => void;
  onWrist: (id: string) => void;
  onLabels: (id: string) => void;
}

function LaneWaiting({ items, onEdit, onWrist, onLabels }: LaneWaitingProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold">Waiting ({items.length})</h3>
      </div>
      <div className="flex flex-col gap-3">
        {items.map(enc => (
          <div key={enc.id} className="rounded-xl border bg-white p-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="font-medium">{enc.name || "Patient"}</div>
                <span className="text-xs text-gray-500">
                  {enc.age}{(enc.sex || "").toUpperCase()}
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">
                  ATS {enc.ats || "—"}
                </span>
              </div>
              <div className="text-xs text-gray-500">
                Arrived: {enc.arrivalTime ? new Date(enc.arrivalTime).toLocaleTimeString('en-US', { 
                  hour12: false, 
                  hour: '2-digit', 
                  minute: '2-digit' 
                }) : "—"}
              </div>
            </div>

            <div className="mt-1 text-sm text-gray-700">
              Complaint: {enc.complaint || "—"}
            </div>

            <div className="mt-3 flex gap-2 flex-wrap">
              <TButton 
                className="border bg-white min-h-[44px]" 
                onClick={() => onEdit(enc)}
                data-testid={`button-edit-${enc.id}`}
              >
                Edit demographics
              </TButton>
              <TButton 
                className="border bg-white min-h-[44px]" 
                onClick={() => onWrist(enc.id)}
                data-testid={`button-wristband-${enc.id}`}
              >
                Reprint wristband
              </TButton>
              <TButton 
                className="border bg-white min-h-[44px]" 
                onClick={() => onLabels(enc.id)}
                data-testid={`button-labels-${enc.id}`}
              >
                Reprint labels
              </TButton>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div className="rounded-xl border bg-white p-6 text-gray-500 text-sm">
            No patients waiting. Register a new arrival to begin.
          </div>
        )}
      </div>
    </div>
  );
}

interface ReadOnlyLaneProps {
  title: string;
  items: any[];
}

function ReadOnlyLane({ title, items }: ReadOnlyLaneProps) {
  const [open, setOpen] = useState(false);
  
  return (
    <div className="rounded-xl border bg-white">
      <div className="flex items-center justify-between p-3">
        <div className="font-semibold">{title}</div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">{items.length}</span>
          <TButton 
            className="border bg-white min-h-[44px]" 
            onClick={() => setOpen(o => !o)}
            data-testid={`button-toggle-${title.toLowerCase()}`}
          >
            {open ? "Hide" : "View"}
          </TButton>
        </div>
      </div>
      {open && (
        <div className="px-3 pb-3">
          <ul className="divide-y">
            {items.map(e => (
              <li key={e.id} className="py-2 text-sm flex items-center justify-between">
                <span className="truncate">
                  {e.name || e.id}
                  {e.ats && <span className="ml-2 text-xs text-gray-500">ATS {e.ats}</span>}
                  {e.room && <span className="ml-2 text-xs text-gray-500">• {e.room}</span>}
                </span>
                {/* read-only; no buttons */}
              </li>
            ))}
            {items.length === 0 && (
              <li className="py-2 text-sm text-gray-500">None</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}