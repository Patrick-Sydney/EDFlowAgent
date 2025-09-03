import React, { useMemo, useState, useRef, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Clock, User, Eye, EyeOff, Copy, QrCode, Info, ShieldAlert, ActivitySquare } from "lucide-react";
import StatusStrip, { StatusFlags } from "./patient/StatusStrip";
import CollapsedCardHeader from "./patient/CollapsedCardHeader";
import VitalsTimelineDrawerLive from "./patient/VitalsTimelineDrawerLive";
import VitalsCapsuleLive from "./patient/VitalsCapsuleLive";
import EWSChipLive from "./patient/EWSChipLive";
import AlertsRibbon, { AlertFlags } from "./patient/AlertsRibbon";
import ActionBar from "./patient/ActionBar";
import ClinicalSnapshot from "./patient/ClinicalSnapshot";
import ResultsCapsule from "./patient/ResultsCapsule";
import TasksMini, { TaskItem } from "./patient/TasksMini";
import NotesTabsLite from "./patient/NotesTabsLite";
import IdentitySlim from "./patient/IdentitySlim";
import BoardExpandOverlay from "./board/BoardExpandOverlay";
import AuthoringDrawer from "./shell/AuthoringDrawer";
import ObsQuickForm from "./obs/ObsQuickForm";
import AssignRoomPanel from "./rooms/AssignRoomPanel";
import VitalsTimelineInline from "./obs/VitalsTimelineInline";
import PatientJourneyInline from "./journey/PatientJourneyInline";
import NotesInline from "./notes/NotesInline";
import NotesDrawer from "./notes/NotesDrawer";
import RegistrationDrawer from "./registration/RegistrationDrawer";
import TriageDrawer from "./triage/TriageDrawer";
import TaskList from "./tasks/TaskList";
import CreateTaskDrawer from "./tasks/CreateTaskDrawer";
import TaskCardSheet from "./tasks/TaskCardSheet";

// ------------------------------------------------------------------
// Small inline Identity block (calm, masked identifiers)
// ------------------------------------------------------------------
export function maskTail(value?: string | null, visible = 3) {
  if (!value) return "—";
  const vis = value.slice(-visible);
  const mask = "•".repeat(Math.max(0, value.length - visible));
  return `${mask}${vis}`;
}

export function IdentityInline({
  legalName,
  preferredName,
  ageSex,
  dob,
  nhi,
  mrn,
  alerts = [],
  allergies = [],
  onAudit,
}: {
  legalName: string;
  preferredName?: string | null;
  ageSex?: string;
  dob?: string | null;          // ISO
  nhi?: string | null;
  mrn?: string | null;
  alerts?: string[];
  allergies?: string[];
  onAudit?: (evt: { action: "reveal" | "copy" | "qr_open"; field: string }) => void;
}) {
  const [showNHI, setShowNHI] = useState(false);
  const [showMRN, setShowMRN] = useState(false);

  const dobStr = useMemo(() => (dob ? new Date(dob).toLocaleDateString() : "—"), [dob]);

  const copy = async (text: string, field: string) => {
    try { await navigator.clipboard.writeText(text); onAudit?.({ action: "copy", field }); } catch {}
  };

  return (
    <div className="rounded-xl border p-3 bg-background">
      <div className="text-sm font-medium">Identity</div>
      <div className="mt-1 text-xs text-muted-foreground">{legalName}{preferredName ? ` — Pref: ${preferredName}` : ''}</div>
      <div className="mt-2 grid grid-cols-2 gap-3">
        <div>
          <div className="text-xs text-muted-foreground">Age / Sex</div>
          <div className="text-sm font-medium">{ageSex ?? '—'}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">DOB</div>
          <div className="text-sm font-medium">{dobStr}</div>
        </div>
      </div>
      <Separator className="my-3"/>
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="text-xs text-muted-foreground">NHI</div>
            <div className="font-mono text-sm">{showNHI ? (nhi ?? '—') : maskTail(nhi ?? undefined)}</div>
          </div>
          <div className="flex items-center gap-1">
            {nhi && (
              <Button size="icon" variant="outline" className="h-8 w-8 rounded-full" onClick={()=>{ setShowNHI(v=>!v); onAudit?.({ action: "reveal", field: "NHI" }); }}>
                {showNHI ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
              </Button>
            )}
            {nhi && (
              <Button size="icon" variant="outline" className="h-8 w-8 rounded-full" onClick={()=> copy(nhi, 'NHI')}>
                <Copy className="h-4 w-4"/>
              </Button>
            )}
            {nhi && (
              <Button size="icon" variant="outline" className="h-8 w-8 rounded-full" onClick={()=> onAudit?.({ action: 'qr_open', field: 'NHI' })}>
                <QrCode className="h-4 w-4"/>
              </Button>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="text-xs text-muted-foreground">MRN</div>
            <div className="font-mono text-sm">{showMRN ? (mrn ?? '—') : maskTail(mrn ?? undefined)}</div>
          </div>
          <div className="flex items-center gap-1">
            {mrn && (
              <Button size="icon" variant="outline" className="h-8 w-8 rounded-full" onClick={()=>{ setShowMRN(v=>!v); onAudit?.({ action: "reveal", field: "MRN" }); }}>
                {showMRN ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
              </Button>
            )}
            {mrn && (
              <Button size="icon" variant="outline" className="h-8 w-8 rounded-full" onClick={()=> copy(mrn, 'MRN')}>
                <Copy className="h-4 w-4"/>
              </Button>
            )}
          </div>
        </div>
      </div>
      {(allergies.length || alerts.length) ? (
        <div className="mt-3 space-y-2">
          {!!allergies.length && (
            <div className="flex items-center gap-2"><ShieldAlert className="h-4 w-4 text-rose-600"/><span className="text-sm">Allergies:</span>
              <div className="flex flex-wrap gap-1">{allergies.map(a => <Badge key={a} variant="secondary">{a}</Badge>)}</div>
            </div>
          )}
          {!!alerts.length && (
            <div className="flex items-center gap-2"><Info className="h-4 w-4 text-amber-600"/><span className="text-sm">Alerts:</span>
              <div className="flex flex-wrap gap-1">{alerts.map(a => <Badge key={a} variant="outline">{a}</Badge>)}</div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

// ------------------------------------------------------------------
// Vitals capsule (last known values + open timeline)
// ------------------------------------------------------------------
export type MinVitals = { rr?: number; spo2?: number; hr?: number; sbp?: number; temp?: number; takenAt?: string };

// ------------------------------------------------------------------
// Expandable patient card (phone‑first)
// - Header looks like PatientCardCompact
// - Tap the card toggles an inline expansion with Identity + Vitals + Actions + Insights
// - Restores EWS and ATS chips on the header
// ------------------------------------------------------------------
export type ExpandableCardProps = {
  ctaMode?: "none" | "collapsed" | "swipe"; // NEW
  name: string;
  status: string;
  timer?: string;
  complaint?: string;
  ews?: number;              // restored EWS chip
  ats?: 1|2|3|4|5;           // new ATS chip
  ageSex?: string;
  dob?: string | null;
  nhi?: string | null;
  mrn?: string | null;
  alerts?: string[];
  allergies?: string[];
  role: 'RN' | 'Charge' | 'MD';
  minVitals?: MinVitals;     // last known vitals for capsule
  patientId: string;         // for timeline integration and live vitals
  onPrimary?: () => void;
  primaryLabel?: string;
  onOrderSet?: () => void;       // MD quick order set
  onAssignRoom?: () => void;     // Charge
  onAddObs?: (patient: any) => void;         // RN
  onOpenFull?: () => void;       // open full card/drawer if needed
  statusFlags?: StatusFlags;     // NEW: desktop status icons
  locationLabel?: string | null;     // NEW: e.g., "RESUS 2", "OBS 5", "Cubicle 7"
  // NEW: for expanded layout
  alertFlags?: AlertFlags;
  lane?: string;
  expandedRole?: "RN" | "Charge" | "MD";
  o2Label?: string | null;
  resultsPending?: number;
  tasks?: TaskItem[];
  triageSummary?: string | null;
  assessment?: string | null;
  note?: string | null;
  onOpenResults?: () => void;
  onQuickOrders?: () => void;
  onEditNotes?: () => void;
  age?: number;
  sex?: string;
  arrivalTs?: string;
};

export default function PatientCardExpandable(props: ExpandableCardProps) {
  const {
    ctaMode = "collapsed", name, status, timer, complaint, ews, ats, ageSex, dob, nhi, mrn, alerts = [], allergies = [], expandedRole,
    minVitals, patientId, onPrimary, primaryLabel = '+ Obs', onOrderSet, onAssignRoom, onAddObs, onOpenFull,
    statusFlags, locationLabel, alertFlags, lane, o2Label, resultsPending, tasks, triageSummary, assessment, note,
    onOpenResults, onQuickOrders, onEditNotes, age, sex, arrivalTs
  } = props;

  const [open, setOpen] = useState(false);
  const [desktopOpen, setDesktopOpen] = useState(false);
  const [openTL, setOpenTL] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState<false | "obs" | "triage" | "assign" | "notes" | "register">(false);
  const [openTaskDrawer, setOpenTaskDrawer] = useState(false);
  const [openTaskSheet, setOpenTaskSheet] = useState<string | null>(null);
  
  // Memoize task filter to prevent infinite re-renders
  const taskFilter = useMemo(() => {
    // Convert to string to ensure stable comparison
    const pid = String(patientId);
    return { patientId: pid };
  }, [patientId]);

  // Role awareness (RN-only actions)
  const [userRole, setUserRole] = useState<string>(() => localStorage.getItem("edflow.role") || "charge");
  useEffect(() => {
    const sync = (e: any) => {
      const next = e?.detail?.role || localStorage.getItem("edflow.role") || "charge";
      // Only update if the role actually changed to prevent infinite loops
      setUserRole(current => current === next ? current : next);
    };
    window.addEventListener("role:change", sync as EventListener);
    window.addEventListener("view:role", sync as EventListener);
    return () => {
      window.removeEventListener("role:change", sync as EventListener);
      window.removeEventListener("view:role", sync as EventListener);
    };
  }, []);
  const [localLocationLabel, setLocalLocationLabel] = useState<string | null>(locationLabel ?? null);
  
  // Sync location label only when props change, not on every render
  useEffect(() => {
    setLocalLocationLabel(locationLabel ?? null);
  }, [locationLabel]);
  const cardAnchorRef = useRef<HTMLDivElement | null>(null);
  const isDesktop = typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches;
  const displayName = useMemo(() => {
    const s = (name || "").trim();
    if (s.length <= 28) return s;
    const parts = s.split(/\s+/);
    return parts.length >= 2 ? `${parts[0]} ${parts[parts.length-1][0]}.` : s.slice(0,26) + '…';
  }, [name]);

  const handlePrimary = () => {
    if (onPrimary) return onPrimary();
    const label = (primaryLabel || "").toLowerCase();
    if (label.includes("obs") && onAddObs) {
      // Create patient object from props to pass to onAddObs
      const patient = {
        id: patientId,
        displayName: name,
        givenName: name.split(' ')[0] || '',
        familyName: name.split(' ').slice(1).join(' ') || '',
        chiefComplaint: complaint,
        ews: ews,
        roomName: status // using status as room info for now
      };
      return onAddObs(patient);
    }
    if (label.includes("assign") && onAssignRoom) return onAssignRoom();
  };

  return (
    <div ref={cardAnchorRef} className="rounded-2xl border bg-card p-3">
      {/* Header row - new collapsed header component */}
      <div className="w-full text-left cursor-pointer" onClick={()=> {
        if (isDesktop) { setDesktopOpen(true); } else { setOpen(o=>!o); }
      }} aria-expanded={open} aria-controls={`exp-${name}`}> 
        <div className="grid grid-cols-[1fr_auto] gap-2 items-start">
          {/* Left: collapsed header content (no CTAs) */}
          <CollapsedCardHeader
            patientId={patientId}
            name={displayName}
            ageSex={ageSex}
            ats={ats}
            locationLabel={localLocationLabel ?? locationLabel ?? undefined}
            chiefComplaint={complaint}
            timerLabel={timer}
          />
          {/* Right: mobile CTA (visible on small screens), desktop status strip */}
          <div className="ml-2 flex items-center gap-2 md:hidden" onClick={(e)=> e.stopPropagation()}>
            {ctaMode === "collapsed" && primaryLabel && (
              <Button className="h-11 rounded-full px-4 min-w-[96px] shrink-0" onClick={handlePrimary}>{primaryLabel}</Button>
            )}
          </div>
          <div className="ml-2 hidden md:flex items-center gap-2" onClick={(e)=> e.stopPropagation()}>
            <StatusStrip flags={statusFlags} />
          </div>
        </div>
      </div>

      {/* Desktop overlay expander: two-lane width panel */}
      <BoardExpandOverlay
        anchorEl={cardAnchorRef.current}
        open={desktopOpen}
        onOpenChange={setDesktopOpen}
        title={displayName}
      >
        <div className="space-y-3">
          {/* Alerts Ribbon (if any) */}
          {alertFlags && <AlertsRibbon flags={alertFlags} />}

          {/* Action Bar (role-based) */}
          {userRole !== "hca" && (
            <div className="flex items-center gap-2 flex-wrap">
              {/* RN-specific primary actions */}
              {userRole === "rn" && (
                <>
                  <button
                    className="rounded-full border px-3 py-2 text-sm"
                    onClick={() => setDrawerOpen("register")}
                    data-testid="button-register-patient"
                  >
                    Register patient
                  </button>
                  <button
                    className="rounded-full border px-3 py-2 text-sm"
                    onClick={() => setDrawerOpen("triage")}
                    data-testid="button-start-triage"
                  >
                    Start triage
                  </button>
                </>
              )}
              {/* Task creation for RN/Charge */}
              {(userRole === "rn" || userRole === "charge") && (
                <button
                  className="rounded-full border px-3 py-2 text-sm"
                  onClick={() => setOpenTaskDrawer(true)}
                  data-testid="button-new-task"
                >
                  + Task
                </button>
              )}
              {/* Always-available actions */}
              <button className="rounded-full border px-3 py-2 text-sm" onClick={() => setDrawerOpen("assign")} data-testid="button-assign-room">Assign room</button>
              <button className="rounded-full px-3 py-2 text-sm text-white bg-blue-600" onClick={() => setDrawerOpen("obs")} data-testid="button-add-obs">+ Obs</button>
            </div>
          )}
          {userRole === "hca" && (
            <div className="text-sm text-slate-500 italic">Read-only view for HCA</div>
          )}

          {/* Clinical Snapshot */}
          <ClinicalSnapshot 
            patientId={patientId}
            complaint={complaint}
            ats={ats}
            o2Label={o2Label}
          />

          {/* Two-column layout for desktop overlay */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-3">
              {/* Vitals Capsule Live */}
              <VitalsCapsuleLive 
                patientId={patientId} 
                onOpenTimeline={() => setOpenTL(true)} 
                onAddObs={onAddObs ? () => {
                  const patient = {
                    id: patientId,
                    displayName: name,
                    givenName: name.split(' ')[0] || '',
                    familyName: name.split(' ').slice(1).join(' ') || '',
                    chiefComplaint: complaint,
                    ews: ews,
                    roomName: status
                  };
                  onAddObs(patient);
                } : undefined} 
              />

              {/* Inline combined vitals timeline */}
              <VitalsTimelineInline
                patientId={patientId}
                height={280}
              />

              {/* Tasks Mini (if any) */}
              {tasks && tasks.length > 0 && <TasksMini tasks={tasks} onOpen={() => console.log("Open task board")} />}
            </div>
            <div className="space-y-3">
              {/* Patient Journey */}
              <PatientJourneyInline 
                patientId={patientId}
                height={320}
              />

              {/* Notes Inline */}
              <NotesInline 
                patientId={patientId}
                onWriteNote={() => setDrawerOpen("notes")}
              />

              {/* Tasks Panel */}
              <div className="rounded-xl border p-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold">Tasks</h3>
                  {(userRole === "rn" || userRole === "charge") && (
                    <button
                      onClick={() => setOpenTaskDrawer(true)}
                      className="text-xs px-2 py-1 rounded bg-blue-100 hover:bg-blue-200 text-blue-700"
                      data-testid="button-add-task"
                    >
                      + Add
                    </button>
                  )}
                </div>
                <TaskList
                  roleView={userRole === "hca" ? "HCA" : userRole === "rn" ? "RN" : userRole === "charge" ? "Charge" : "RN"}
                  currentUserId={userRole === "hca" ? "hca-1" : undefined}
                  filter={taskFilter}
                  onSelectTaskId={setOpenTaskSheet}
                />
              </div>

              {/* Results Capsule (if pending) */}
              {(resultsPending && resultsPending > 0) && (
                <ResultsCapsule 
                  resultsPending={resultsPending}
                  onOpenResults={onOpenResults}
                  onQuickOrders={onQuickOrders}
                />
              )}

              {/* Identity Slim (moved to end) */}
              <IdentitySlim 
                nhi={nhi ?? undefined} 
                mrn={mrn ?? undefined} 
                alerts={alerts} 
                allergies={allergies} 
                onAudit={(e)=>{/* wire to audit */}} 
              />
            </div>
          </div>
        </div>
      </BoardExpandOverlay>

      {/* Expandable content - clinical-first layout (mobile/tablet inline) */}
      <div id={`exp-${name}`} className={`transition-all overflow-hidden ${open? 'mt-3 max-h-[1600px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="space-y-3">
          {/* Alerts Ribbon (if any) */}
          {alertFlags && <AlertsRibbon flags={alertFlags} />}

          {/* Action Bar (role-based) */}
          {userRole !== "hca" && (
            <div className="flex items-center gap-2 flex-wrap">
              {/* RN-specific primary actions */}
              {userRole === "rn" && (
                <>
                  <button
                    className="rounded-full border px-3 py-2 text-sm"
                    onClick={() => setDrawerOpen("register")}
                    data-testid="button-register-patient"
                  >
                    Register patient
                  </button>
                  <button
                    className="rounded-full border px-3 py-2 text-sm"
                    onClick={() => setDrawerOpen("triage")}
                    data-testid="button-start-triage"
                  >
                    Start triage
                  </button>
                </>
              )}
              {/* Task creation for RN/Charge */}
              {(userRole === "rn" || userRole === "charge") && (
                <button
                  className="rounded-full border px-3 py-2 text-sm"
                  onClick={() => setOpenTaskDrawer(true)}
                  data-testid="button-new-task"
                >
                  + Task
                </button>
              )}
              {/* Always-available actions */}
              <button className="rounded-full border px-3 py-2 text-sm" onClick={() => setDrawerOpen("assign")} data-testid="button-assign-room">Assign room</button>
              <button className="rounded-full px-3 py-2 text-sm text-white bg-blue-600" onClick={() => setDrawerOpen("obs")} data-testid="button-add-obs">+ Obs</button>
            </div>
          )}
          {userRole === "hca" && (
            <div className="text-sm text-slate-500 italic">Read-only view for HCA</div>
          )}

          {/* Clinical Snapshot */}
          <ClinicalSnapshot 
            patientId={patientId}
            complaint={complaint}
            ats={ats}
            o2Label={o2Label}
          />

          {/* Vitals Capsule Live */}
          <VitalsCapsuleLive 
            patientId={patientId} 
            onOpenTimeline={() => setOpenTL(true)} 
            onAddObs={() => setDrawerOpen("obs")} 
          />

          {/* Tasks Mini (if any) */}
          {tasks && tasks.length > 0 && <TasksMini tasks={tasks} onOpen={() => console.log("Open task board")} />}

          {/* Results Capsule (if pending) */}
          {(resultsPending && resultsPending > 0) && (
            <ResultsCapsule 
              resultsPending={resultsPending}
              onOpenResults={onOpenResults}
              onQuickOrders={onQuickOrders}
            />
          )}

          {/* Notes Tabs Lite */}
          <NotesTabsLite 
            triageSummary={triageSummary}
            assessment={assessment}
            note={note}
            onEdit={onEditNotes}
          />

          {/* Identity Slim (moved to end) */}
          <IdentitySlim 
            nhi={nhi ?? undefined} 
            mrn={mrn ?? undefined} 
            alerts={alerts} 
            allergies={allergies} 
            onAudit={(e)=>{/* wire to audit */}} 
          />
        </div>
      </div>

      {/* Vitals Timeline Drawer */}
      <VitalsTimelineDrawerLive
        open={openTL}
        onOpenChange={setOpenTL}
        patientId={patientId || ""}
        patientName={name}
        onAddObs={onAddObs ? () => {
          const patient = {
            id: patientId,
            displayName: name,
            givenName: name.split(' ')[0] || '',
            familyName: name.split(' ').slice(1).join(' ') || '',
            chiefComplaint: complaint,
            ews: ews,
            roomName: status
          };
          onAddObs(patient);
        } : undefined}
      />

      {/* Authoring Drawer — sits ABOVE the overlay (z-[1100]) */}
      <AuthoringDrawer
        title={drawerOpen === "obs" ? `Add observations — ${displayName}`
              : drawerOpen === "assign" ? `Assign room — ${displayName}`
              : drawerOpen === "triage" ? `Triage — ${displayName}`
              : drawerOpen === "register" ? `Register patient — ${displayName}`
              : drawerOpen === "notes" ? `Write note — ${displayName}` : `${displayName}`}
        open={!!drawerOpen}
        onClose={()=> setDrawerOpen(false)}
        widthPx={920}
      >
        {drawerOpen === "obs" && (
          <ObsQuickForm patientId={patientId} onSaved={()=> setDrawerOpen(false)} />
        )}
        {drawerOpen === "assign" && (
          <AssignRoomPanel
            patient={{
              id: patientId,
              name: displayName,
              ats: ats ?? null,
              isolationRequired: !!alertFlags?.isolation,
              currentLocationLabel: localLocationLabel ?? locationLabel ?? null,
            }}
            onAssigned={(space) => {
              // Update local view immediately for clinical clarity
              setLocalLocationLabel(space.label);
              setDrawerOpen(false);
              // TODO: call your real store/API here to persist:
              // roomsStore.assign(patientId, space.id)
            }}
          />
        )}
        {drawerOpen === "notes" && (
          <NotesDrawer 
            patientId={patientId} 
            onSaved={() => setDrawerOpen(false)} 
          />
        )}
        {drawerOpen === "triage" && <TriageDrawer patientId={patientId} onSaved={()=> setDrawerOpen(false)} />}
        {drawerOpen === "register" && <RegistrationDrawer patientId={patientId} onSaved={()=> setDrawerOpen(false)} />}
      </AuthoringDrawer>

      {/* Task Creation Drawer */}
      <CreateTaskDrawer
        isOpen={openTaskDrawer}
        onClose={() => setOpenTaskDrawer(false)}
        defaultPatientId={String(patientId)}
        defaultOrigin={userRole === "charge" ? "Charge" : "RN"}
      />

      {/* Task Card Sheet */}
      {openTaskSheet && (
        <TaskCardSheet
          taskId={openTaskSheet}
          onClose={() => setOpenTaskSheet(null)}
          getPatientSummary={(pid) => ({
            id: String(patientId),
            displayName: displayName,
            age: age,
            sex: sex,
            room: localLocationLabel ?? locationLabel ?? undefined,
            ats: ats,
            ews: typeof ews === 'object' ? ews?.score : ews,
            arrivalTs: arrivalTs
          })}
          currentUserId={userRole === "hca" ? "hca-1" : undefined}
          readOnly={userRole === "hca"}
        />
      )}
    </div>
  );
}