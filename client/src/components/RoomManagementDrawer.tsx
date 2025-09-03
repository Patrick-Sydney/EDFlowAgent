import { useEffect, useMemo, useState } from "react";
import { useDashboardStore } from "@/stores/dashboardStore";
import { useJourneyStore } from "@/stores/journeyStore";
import { X, Bed, Monitor, Droplets, Shield, Clock, AlertTriangle, CheckCircle } from "lucide-react";
import TButton from "./ui/TButton";
import { Segmented, Chips } from "./ui/Segmented";
import { haptic, once } from "@/utils/touch";

const STATUS = {
  available: { txt: "Available", cls: "bg-emerald-100 text-emerald-700" },
  cleaning: { txt: "Cleaning", cls: "bg-amber-100 text-amber-700" },
  occupied: { txt: "Occupied", cls: "bg-rose-100 text-rose-700" },
  blocked: { txt: "Blocked", cls: "bg-gray-200 text-gray-700" },
  outofservice: { txt: "Out of service", cls: "bg-gray-200 text-gray-700" }
};

const ZONE_OPTIONS = [
  { value: "A", label: "Zone A" },
  { value: "B", label: "Zone B" },
  { value: "FT", label: "Fast Track" }
];

const TYPE_OPTIONS = [
  { value: "resus", label: "Resus" },
  { value: "cubicle", label: "Cubicle" },
  { value: "chair", label: "Chair" },
  { value: "isolation", label: "Isolation" }
];

export default function RoomManagementDrawer() {
  const { 
    roomOpen, 
    roomEncounter: enc, 
    spaces, 
    loadSpaces, 
    closeRoom, 
    assignSpace, 
    reassignSpace,
    markSpaceClean,
    markSpaceReady,
    spaceFilterPreset,
    clearSpaceFilterPreset
  } = useDashboardStore();
  
  const [filters, setFilters] = useState<{
    zone: string | null;
    type: string | null;
    attrMon: boolean | null;
    attrIso: boolean | null;
    status: string | null;
  }>({ zone: null, type: null, attrMon: null, attrIso: null, status: null });
  
  const [selected, setSelected] = useState<any>(null);
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState(false);

  // On open: reset local UI, load spaces, and apply any preset once
  useEffect(() => { 
    if (roomOpen) { 
      setSelected(null); 
      setReason(""); 
      loadSpaces();
      if (spaceFilterPreset) {
        setFilters(f => ({ ...f, ...spaceFilterPreset }));
      }
    }
  }, [roomOpen, loadSpaces, spaceFilterPreset]);

  // If drawer is already open and preset changes (user taps the bar), apply it live
  useEffect(() => {
    if (roomOpen && spaceFilterPreset) {
      setFilters(f => ({ ...f, ...spaceFilterPreset }));
    }
  }, [spaceFilterPreset, roomOpen]);

  const needsIso = enc?.isolationRequired === "true";
  const acuity = Number(enc?.ats || 3);
  const needsMon = acuity <= 2;

  const filtered = useMemo(() => {
    return spaces.filter(s => {
      if (filters.status && s.status !== filters.status) return false;
      if (filters.zone && s.zone !== filters.zone) return false;
      if (filters.type && s.type !== filters.type) return false;
      if (filters.attrMon === true && !s.monitored) return false;
      if (filters.attrIso === true && !(s.negativePressure || s.type === "isolation")) return false;
      return true;
    });
  }, [spaces, filters]);

  if (!roomOpen || !enc) return null;

  const check = (s: any) => {
    if (!s) return { isoOk: true, monOk: true, safe: true };
    const isoOk = !needsIso || s.negativePressure || s.type === "isolation";
    const monOk = !needsMon || s.monitored || s.type === "resus";
    return { isoOk, monOk, safe: isoOk && monOk };
  };
  const checks = check(selected);

  const isReassign = !!enc.room;
  const confirm = async () => {
    if (!selected) return;
    setPending(true);
    try {
      const r = isReassign
        ? await reassignSpace(enc.id, selected.id, reason || "Reassign")
        : await assignSpace(enc.id, selected.id, reason || null);
      if (!r?.ok) { 
        alert(r?.error || "Failed"); 
        return; 
      }
      
      // Single source of truth: append a Journey event
      useJourneyStore.getState().append({
        id: crypto.randomUUID(),
        patientId: String(enc.id),
        t: new Date().toISOString(),
        kind: "room_change",       // <- this is what the index listens for
        label: selected.id,        // <- room name goes here
        actor: { name: "Charge RN", role: "RN" },
        detail: isReassign ? "Reassigned" : "Assigned",
      });

      // Console debug
      console.debug("[assign-room] append", { patientId: String(enc.id), roomLabel: selected.id, when: new Date().toISOString() });
      
      // The SSE broadcast will automatically update the encounter
      
      // Close drawer on next tick to avoid nested updates
      queueMicrotask(() => closeRoom());
    } finally { 
      setPending(false); 
    }
  };

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30" onClick={closeRoom} />
      
      {/* Wide, responsive drawer */}
      <div className="absolute top-0 right-0 h-full w-full sm:w-[90%] md:w-[80%] lg:w-[900px] bg-white shadow-xl flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 border-b sticky top-0 bg-white z-10">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-base sm:text-lg">
              {isReassign ? "Reassign Room" : "Assign Room"} — {enc.name}
            </h3>
            <TButton 
              className="border bg-white min-w-[44px]" 
              onClick={closeRoom} 
              data-testid="button-close-room"
            >
              <X className="w-4 h-4" />
            </TButton>
          </div>
          <div className="mt-1 text-xs text-gray-600">
            {enc.age}y {enc.sex} • NHI: {enc.nhi}
          </div>
          <div className="text-xs text-gray-500">{enc.complaint}</div>
          {enc.room && (
            <div className="text-xs text-blue-600 mt-1">
              Currently in: {enc.room}
            </div>
          )}
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
          {/* Patient Requirements */}
          <section>
            <h4 className="font-semibold mb-2">Patient Requirements</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className={`w-4 h-4 ${needsIso ? 'text-red-500' : 'text-gray-400'}`} />
                <span className={`text-sm ${needsIso ? 'text-red-700 font-medium' : 'text-gray-500'}`}>
                  Isolation {needsIso ? 'Required' : 'Not Required'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Monitor className={`w-4 h-4 ${needsMon ? 'text-blue-500' : 'text-gray-400'}`} />
                <span className={`text-sm ${needsMon ? 'text-blue-700 font-medium' : 'text-gray-500'}`}>
                  Monitoring {needsMon ? 'Required' : 'Standard'}
                </span>
              </div>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              ATS {acuity} - {acuity <= 2 ? 'High acuity' : 'Standard acuity'}
            </div>
          </section>

          {/* Filters */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold">Filter Spaces</h4>
              <button
                type="button"
                className="px-3 py-1.5 rounded-full border text-xs text-gray-600 hover:bg-gray-50 transition-colors"
                onClick={() => {
                  setFilters({ zone: null, type: null, attrMon: null, attrIso: null, status: null });
                  clearSpaceFilterPreset();
                }}
              >
                Clear filters
              </button>
            </div>
            
            {/* Status chips (tap from Summary Bar sets this too) */}
            <div className="text-sm mb-3">
              <div className="mb-1">Status</div>
              <Chips
                values={filters.status ? [filters.status] : []}
                onToggle={(val, on) => {
                  setFilters(f => ({ ...f, status: on ? val : null }));
                }}
                options={[
                  { value: "available", label: "Available" },
                  { value: "cleaning", label: "Cleaning" },
                  { value: "occupied", label: "Occupied" },
                  { value: "blocked", label: "Blocked" }
                ]}
              />
            </div>
            
            <div className="grid lg:grid-cols-2 gap-3">
              <div className="text-sm">
                <div className="mb-1">Zone</div>
                <Segmented
                  value={filters.zone || ""}
                  onChange={(v) => setFilters(f => ({ ...f, zone: v || null }))}
                  options={[{ value: "", label: "All" }, ...ZONE_OPTIONS]}
                />
              </div>
              <div className="text-sm">
                <div className="mb-1">Type</div>
                <Segmented
                  value={filters.type || ""}
                  onChange={(v) => setFilters(f => ({ ...f, type: v || null }))}
                  options={[{ value: "", label: "All" }, ...TYPE_OPTIONS]}
                />
              </div>
            </div>
            <div className="text-sm mt-3">
              <div className="mb-1">Attributes</div>
              <Chips
                values={[
                  ...(filters.attrMon ? ["monitored"] : []),
                  ...(filters.attrIso ? ["isolation"] : [])
                ]}
                onToggle={(val, on) => {
                  if (val === "monitored") setFilters(f => ({ ...f, attrMon: on ? true : null }));
                  if (val === "isolation") setFilters(f => ({ ...f, attrIso: on ? true : null }));
                }}
                options={[
                  { value: "monitored", label: "Monitored" },
                  { value: "isolation", label: "Isolation capable" }
                ]}
              />
            </div>
          </section>

          {/* Space Grid */}
          <section>
            <h4 className="font-semibold mb-2">
              Filtered Spaces ({filtered.length}) - Available: {filtered.filter(s => s.status === "available").length}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filtered.map(space => {
                const isSelected = selected?.id === space.id;
                const isAvailable = space.status === "available";
                const spaceCheck = check(space);
                const canSelect = isAvailable && !pending;

                return (
                  <div
                    key={space.id}
                    className={`border rounded-lg p-3 cursor-pointer transition min-h-[120px] ${
                      isSelected ? 'border-blue-500 bg-blue-50' 
                      : canSelect ? 'border-gray-300 hover:border-gray-400'
                      : 'border-gray-200 opacity-60 cursor-not-allowed'
                    }`}
                    onClick={() => {
                      if (canSelect) {
                        setSelected(space);
                        haptic();
                      }
                    }}
                  >
                    {/* Space header */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium text-sm">{space.id}</div>
                      <div className={`px-2 py-1 rounded text-xs ${STATUS[space.status as keyof typeof STATUS]?.cls || STATUS.available.cls}`}>
                        {STATUS[space.status as keyof typeof STATUS]?.txt || space.status}
                      </div>
                    </div>

                    {/* Zone and Type */}
                    <div className="text-xs text-gray-600 mb-2">
                      Zone {space.zone} • {space.type}
                    </div>

                    {/* Capabilities */}
                    <div className="flex flex-wrap gap-1 mb-2">
                      {space.monitored && (
                        <div className="flex items-center gap-1 text-xs text-blue-600">
                          <Monitor className="w-3 h-3" />
                          <span>Mon</span>
                        </div>
                      )}
                      {space.oxygen && (
                        <div className="flex items-center gap-1 text-xs text-green-600">
                          <Droplets className="w-3 h-3" />
                          <span>O₂</span>
                        </div>
                      )}
                      {space.negativePressure && (
                        <div className="flex items-center gap-1 text-xs text-purple-600">
                          <Shield className="w-3 h-3" />
                          <span>ISO</span>
                        </div>
                      )}
                    </div>

                    {/* Cleaning status */}
                    {space.status === "cleaning" && space.cleanEta && (
                      <div className="flex items-center gap-1 text-xs text-amber-600">
                        <Clock className="w-3 h-3" />
                        <span>~{space.cleanEta}min</span>
                      </div>
                    )}

                    {/* Suitability indicators */}
                    {isAvailable && isSelected && (
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <div className="flex items-center gap-2 text-xs">
                          {spaceCheck.safe ? (
                            <CheckCircle className="w-3 h-3 text-green-500" />
                          ) : (
                            <AlertTriangle className="w-3 h-3 text-amber-500" />
                          )}
                          <span className={spaceCheck.safe ? 'text-green-700' : 'text-amber-700'}>
                            {spaceCheck.safe ? 'Suitable' : 'Check requirements'}
                          </span>
                        </div>
                        {!spaceCheck.isoOk && (
                          <div className="text-xs text-red-600 mt-1">
                            ⚠ No isolation capability
                          </div>
                        )}
                        {!spaceCheck.monOk && (
                          <div className="text-xs text-amber-600 mt-1">
                            ⚠ No monitoring
                          </div>
                        )}
                      </div>
                    )}

                    {/* Occupied indicator */}
                    {space.status === "occupied" && space.assignedEncounterId && (
                      <div className="text-xs text-gray-500 mt-1">
                        Patient assigned
                      </div>
                    )}

                    {/* Block reason */}
                    {space.status === "blocked" && space.notes && (
                      <div className="text-xs text-red-600 mt-1">
                        {space.notes}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Reason input for reassignments */}
          {isReassign && (
            <section>
              <h4 className="font-semibold mb-2">Reason for Reassignment</h4>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Enter reason for room change..."
                className="w-full border rounded px-3 py-3 text-base min-h-[80px] resize-y"
                data-testid="textarea-reassign-reason"
              />
            </section>
          )}
        </div>

        {/* Sticky action bar */}
        <div className="p-3 border-t sticky bottom-0 bg-white flex gap-2">
          <TButton 
            className="bg-blue-600 text-white flex-1 min-h-[50px]"
            onClick={once(() => { confirm(); haptic(); })}
            disabled={!selected || pending || (isReassign && !reason.trim())}
            data-testid="button-confirm-room"
          >
            {pending ? "Assigning..." : isReassign ? "Reassign Room" : "Assign Room"}
          </TButton>
          <TButton 
            className="border bg-white min-h-[50px] min-w-[100px]"
            onClick={closeRoom}
            disabled={pending}
          >
            Cancel
          </TButton>
        </div>
      </div>
    </div>
  );
}