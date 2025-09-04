import React, { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useDashboardStore } from "../../stores/dashboardStore";
import { X } from "lucide-react";
import EWSChipLive from "../patient/EWSChipLive";
import {
  assignRoom, reassignRoom, releaseRoom,
  markSpaceReady, markSpaceForCleaning
} from "../../domain/roomActions";

type Filter = "all" | "available" | "occupied" | "cleaning" | "blocked" | "oos";

export default function RoomManagementDrawer() {
  const [filter, setFilter] = useState<Filter>("available");
  const spaces = useDashboardStore((s) => s.spaces || []);
  const encounters = useDashboardStore((s) => s.encounters || []);
  const open = useDashboardStore((s) => s.roomOpen);
  const closeRoom = useDashboardStore((s) => s.closeRoom);

  const list = useMemo(() => {
    return spaces.filter(space => {
      if (filter === "all") return true;
      const status = space.status || "available";
      const mappedStatus = status === "out of service" ? "oos" : status;
      return mappedStatus === filter;
    });
  }, [spaces, filter]);

  const availablePatients = encounters.filter(e => 
    ["waiting", "triage"].includes(e.lane) && !e.room
  );

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[1200] flex justify-end pointer-events-none">
      <div className="absolute inset-0 bg-black/30 pointer-events-auto" onClick={closeRoom}/>
      <aside className="relative w-[520px] max-w-[95vw] h-full bg-white border-l shadow-2xl pointer-events-auto flex flex-col overflow-hidden">
        {/* Header */}
        <header className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between">
          <div className="font-semibold">Room Management</div>
          <button
            onClick={closeRoom}
            className="p-1 rounded hover:bg-gray-100"
            data-testid="button-close-drawer"
          >
            <X className="w-4 h-4" />
          </button>
        </header>

        {/* Filter tabs */}
        <div className="px-4 py-2 border-b bg-gray-50">
          <div className="flex gap-2 text-xs flex-wrap">
            {(["all", "available", "occupied", "cleaning", "blocked", "oos"] as Filter[]).map(f =>
              <button 
                key={f} 
                onClick={() => setFilter(f)}
                className={`px-2 py-1 rounded border ${filter === f ? "bg-white border-blue-300" : "bg-gray-100"}`}
                data-testid={`filter-${f}`}
              >
                {f[0].toUpperCase() + f.slice(1)}
              </button>
            )}
          </div>
        </div>

        {/* Room list */}
        <div className="flex-1 p-3 space-y-2 overflow-y-auto overscroll-contain">
          {list.map(space => {
            const assignedPatient = encounters.find(e => e.room === space.id);
            return (
              <div key={space.id} className="rounded border p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm">
                      {space.id} 
                      <span className="text-xs text-slate-500 ml-2">· {space.zone} · {space.type}</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      Status: {space.status || "available"}
                      {assignedPatient && (
                        <span className="ml-2">· {assignedPatient.name}, {assignedPatient.age}{assignedPatient.sex}</span>
                      )}
                      {assignedPatient && (
                        <span className="ml-2">
                          <span className="inline-block scale-75 origin-left">
                            <EWSChipLive patientId={assignedPatient.id} fallback={assignedPatient.ats} />
                          </span>
                        </span>
                      )}
                    </div>
                    {space.notes && (
                      <div className="text-xs text-blue-600 mt-1">{space.notes}</div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {space.status === "available" && (
                      <AssignButton 
                        space={space} 
                        onDone={closeRoom} 
                        patients={availablePatients}
                        onSave={(patientId) => assignRoom(patientId, space.id)}
                      />
                    )}
                    {space.status === "occupied" && assignedPatient && (
                      <>
                        <ReassignButton 
                          space={space} 
                          patient={assignedPatient} 
                          onDone={closeRoom} 
                          availableSpaces={spaces.filter(s => s.status === "available")}
                          onSave={(patientId, newSpaceId) => reassignRoom(patientId, newSpaceId)}
                        />
                        <button 
                          className="text-xs rounded border px-2 py-1 hover:bg-gray-50" 
                          onClick={async () => { 
                            try {
                              await releaseRoom(assignedPatient.id); 
                              closeRoom(); 
                            } catch (e) {
                              console.error("Failed to release room:", e);
                            }
                          }}
                          data-testid="button-release"
                        >
                          Release
                        </button>
                        <button 
                          className="text-xs rounded border px-2 py-1 hover:bg-gray-50" 
                          onClick={async () => { 
                            try {
                              await markSpaceForCleaning(space.id); 
                              closeRoom(); 
                            } catch (e) {
                              console.error("Failed to start cleaning:", e);
                            }
                          }}
                          data-testid="button-start-cleaning"
                        >
                          Start Cleaning
                        </button>
                      </>
                    )}
                    {space.status === "cleaning" && (
                      <button 
                        className="text-xs rounded border px-2 py-1 hover:bg-gray-50" 
                        onClick={async () => { 
                          try {
                            await markSpaceReady(space.id); 
                            closeRoom(); 
                          } catch (e) {
                            console.error("Failed to mark ready:", e);
                          }
                        }}
                        data-testid="button-mark-ready"
                      >
                        Mark Ready
                      </button>
                    )}
                    {space.status === "blocked" && (
                      <button 
                        className="text-xs rounded border px-2 py-1 hover:bg-gray-50" 
                        onClick={() => { 
                          console.warn("Unblock functionality not yet implemented"); 
                          closeRoom(); 
                        }}
                        data-testid="button-unblock"
                      >
                        Unblock
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {!list.length && (
            <div className="text-sm text-slate-500 text-center py-8">
              No rooms match this filter.
            </div>
          )}
        </div>
      </aside>
    </div>,
    document.body
  );
}

// Helper components for room actions
function AssignButton({ space, onDone, patients, onSave }: {
  space: any; 
  onDone: () => void; 
  patients: any[];
  onSave: (patientId: string) => Promise<void> | void;
}) {
  const [open, setOpen] = useState(false);
  const [patientId, setPatientId] = useState<string>("");

  const handleAssign = async () => {
    if (patientId) {
      try {
        await onSave(patientId);
        onDone();
      } catch (e) {
        console.error("Failed to assign:", e);
      }
    }
  };

  return (
    <>
      <button 
        className="text-xs rounded border px-2 py-1 hover:bg-gray-50" 
        onClick={() => setOpen(!open)}
        data-testid="button-assign"
      >
        Assign
      </button>
      {open && (
        <div className="mt-2 flex items-center gap-2">
          <select 
            className="text-xs border rounded px-2 py-1 min-w-[120px]" 
            value={patientId} 
            onChange={e => setPatientId(e.target.value)}
            data-testid="select-patient"
          >
            <option value="">Select patient…</option>
            {patients.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <button
            className="text-xs rounded bg-slate-900 text-white px-2 py-1 hover:bg-slate-800"
            onClick={handleAssign}
            disabled={!patientId}
            data-testid="button-save-assign"
          >
            Save
          </button>
        </div>
      )}
    </>
  );
}

function ReassignButton({ space, patient, onDone, availableSpaces, onSave }: {
  space: any; 
  patient: any; 
  onDone: () => void; 
  availableSpaces: any[];
  onSave: (patientId: string, newSpaceId: string) => Promise<void> | void;
}) {
  const [open, setOpen] = useState(false);
  const [newSpaceId, setNewSpaceId] = useState<string>("");

  const handleReassign = async () => {
    if (newSpaceId) {
      try {
        await onSave(patient.id, newSpaceId);
        onDone();
      } catch (e) {
        console.error("Failed to reassign:", e);
      }
    }
  };

  return (
    <>
      <button 
        className="text-xs rounded border px-2 py-1 hover:bg-gray-50" 
        onClick={() => setOpen(!open)}
        data-testid="button-reassign"
      >
        Reassign
      </button>
      {open && (
        <div className="mt-2 flex items-center gap-2">
          <select 
            className="text-xs border rounded px-2 py-1 min-w-[120px]" 
            value={newSpaceId} 
            onChange={e => setNewSpaceId(e.target.value)}
            data-testid="select-new-space"
          >
            <option value="">Select room…</option>
            {availableSpaces.map(s => (
              <option key={s.id} value={s.id}>{s.id}</option>
            ))}
          </select>
          <button
            className="text-xs rounded bg-slate-900 text-white px-2 py-1 hover:bg-slate-800"
            onClick={handleReassign}
            disabled={!newSpaceId}
            data-testid="button-save-reassign"
          >
            Save
          </button>
        </div>
      )}
    </>
  );
}

// ReleaseButton is now integrated directly into the main component above