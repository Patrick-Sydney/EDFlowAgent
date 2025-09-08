import React, { useMemo, useState, useRef, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Clock, User, Eye, EyeOff, Copy, QrCode, Info, ShieldAlert, ActivitySquare, Bed } from "lucide-react";
import StatusStrip, { StatusFlags } from "./patient/StatusStrip";
import CollapsedCardHeader from "./patient/CollapsedCardHeader";
import VitalsTimelineDrawerLive from "./patient/VitalsTimelineDrawerLive";
import VitalsCapsuleLive from "./patient/VitalsCapsuleLive";
import EWSChipLive from "./patient/EWSChipLive";
import AlertsRibbon, { AlertFlags } from "./patient/AlertsRibbon";
import ActionBar from "./patient/ActionBar";
import ClinicalSnapshot from "./patient/ClinicalSnapshot";
import ResultsCapsule from "./patient/ResultsCapsule";
// import PathwayClocks from "./patient/PathwayClocks";
import TasksMini, { TaskItem } from "./patient/TasksMini";
import NotesTabsLite from "./patient/NotesTabsLite";
import IdentitySlim from "./patient/IdentitySlim";
import Chip from "./ui/Chip";
import SegmentedComponent from "./ui/Segmented";
import { nextObsDueISO } from "@/lib/ewsAndNextObs";
import { useDashboardStore } from "@/stores/dashboardStore";
import { useRoomFor, usePhaseFor } from "@/stores/patientIndexStore";
// import { useRoomAndPhase } from "@/hooks/useRoomAndPhase"; // replaced by useRoomFor, usePhaseFor
import { useJourneyStore } from "@/stores/journeyStore";
import { useMobileCardStore } from "@/stores/mobileCardStore";
// import HeaderStatusRibbon from "./patient/HeaderStatusRibbon";
// import PathwayTimers from "./patient/PathwayTimers";
// import PerVitalSparklines from "./patient/PerVitalSparklines";

// Simple Journey filter component
function JourneyFilters({ mode, setMode, win, setWin }: {
  mode: string;
  setMode: (m: string) => void;
  win: string;
  setWin: (w: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <SegmentedComponent options={["Clinical","Moves","All"]} value={mode} onChange={setMode} />
      <SegmentedComponent options={["4h","8h","24h","72h"]} value={win} onChange={setWin} />
    </div>
  );
}
import BoardExpandOverlay from "./board/BoardExpandOverlay";
import AuthoringDrawer from "./shell/AuthoringDrawer";
import ObsQuickForm from "./obs/ObsQuickForm";
import VitalsTimelineInline from "./obs/VitalsTimelineInline";
import PatientJourneyInline from "./journey/PatientJourneyInline";
import NotesInline from "./notes/NotesInline";
import NotesDrawer from "./notes/NotesDrawer";
import ReadyForReviewDrawer from "./review/ReadyForReviewDrawer";
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
  isolationRequired?: boolean;
};

export default function PatientCardExpandable(props: ExpandableCardProps) {
  const {
    ctaMode = "collapsed", name, status, timer, complaint, ews, ats, ageSex, dob, nhi, mrn, alerts = [], allergies = [], expandedRole,
    minVitals, patientId, onPrimary, primaryLabel = '+ Obs', onOrderSet, onAssignRoom, onAddObs, onOpenFull,
    statusFlags, locationLabel, alertFlags, lane, o2Label, resultsPending, tasks, triageSummary, assessment, note,
    onOpenResults, onQuickOrders, onEditNotes, age, sex, arrivalTs, isolationRequired
  } = props;

  const [localOpen, setLocalOpen] = useState(false);
  const [desktopOpen, setDesktopOpen] = useState(false);
  
  // Mobile card expansion: use global store to ensure only one card expanded at a time
  const { isExpanded: isMobileExpanded, toggleCard: toggleMobileCard } = useMobileCardStore();
  
  // Use static media query check instead of dynamic one to prevent render loops
  const [isDesktopView, setIsDesktopView] = useState(() => 
    typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches
  );
  
  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    const handleChange = (e: MediaQueryListEvent) => setIsDesktopView(e.matches);
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);
  
  // Memoize patient ID to prevent unnecessary re-evaluations
  const memoizedPatientId = useMemo(() => String(patientId), [patientId]);
  
  // Use mobile store for mobile devices, local state for desktop
  const open = isDesktopView ? localOpen : isMobileExpanded(memoizedPatientId);
  
  // Memoized toggle handler to prevent infinite loops
  const handleToggleOpen = useMemo(() => () => {
    if (isDesktopView) {
      setLocalOpen(o => !o);
    } else {
      const wasExpanded = isMobileExpanded(memoizedPatientId);
      toggleMobileCard(memoizedPatientId);
      
      // If card is being expanded (wasn't expanded before), scroll it into view
      if (!wasExpanded && cardAnchorRef.current) {
        setTimeout(() => {
          cardAnchorRef.current?.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start',
            inline: 'nearest' 
          });
        }, 50); // Small delay to ensure expansion animation starts first
      }
    }
  }, [isDesktopView, isMobileExpanded, toggleMobileCard, memoizedPatientId]);
  
  const [openTL, setOpenTL] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState<false | "obs" | "triage" | "notes" | "register" | "readyForReview">(false);
  // DISABLED: Task-related state causing infinite loops
  // const [openTaskDrawer, setOpenTaskDrawer] = useState(false);
  // const [openTaskSheet, setOpenTaskSheet] = useState<string | null>(null);
  
  // DISABLED: Task filter causing infinite loops - remove for now
  // const taskFilter = useMemo(() => {
  //   const pid = String(patientId);
  //   return { patientId: pid };
  // }, [patientId]);
  

  // Role awareness (RN-only actions) - memoized to prevent re-renders
  const roleView = useDashboardStore(useMemo(() => (s) => s.roleView, []));
  const userRole = roleView || "charge";
  const isHCA = userRole === "hca";
  // Remove getLatestEws call to use consistent EWSChipLive component instead
  useEffect(() => {
    const sync = (e: any) => {
      const next = e?.detail?.role || localStorage.getItem("edflow.role") || "charge";
      // Only update if the role actually changed to prevent infinite loops
      // Role is now managed by dashboard store, just store locally
    };
    window.addEventListener("role:change", sync as EventListener);
    window.addEventListener("view:role", sync as EventListener);
    return () => {
      window.removeEventListener("role:change", sync as EventListener);
      window.removeEventListener("view:role", sync as EventListener);
    };
  }, []);
  const [localLocationLabel, setLocalLocationLabel] = useState<string | null>(locationLabel ?? null);
  
  const currentRoom = useRoomFor(memoizedPatientId);
  const phase = usePhaseFor(memoizedPatientId);

  // Read live room from Journey store for expanded header - memoized to prevent loops
  const liveRoom = useJourneyStore(
    useMemo(() => (s) => {
      const ev = [...s.events].reverse().find(e =>
        e.patientId === String(patientId) &&
        (e.kind === "room_change" || e.kind === "room_assigned" || e.kind === "encounter.location")
      );
      return ev?.label ?? (typeof ev?.detail === "string" ? ev.detail : ev?.detail?.room);
    }, [patientId])
  );

  // Debug: Journey events count - only when needed
  const eventsCount = useJourneyStore(s => s.events.length);
  
  // Journey filter state - default to "All" so room changes are visible immediately
  const [journeyMode, setJourneyMode] = React.useState("All");
  const [journeyWin, setJourneyWin] = React.useState("8h");
  
  // Sync location label only when props change, not on every render
  useEffect(() => {
    // Only update if actually different to prevent infinite loops
    setLocalLocationLabel(current => {
      const newValue = locationLabel ?? null;
      return current === newValue ? current : newValue;
    });
  }, [locationLabel]);
  const cardAnchorRef = useRef<HTMLDivElement | null>(null);
  const displayName = useMemo(() => {
    const s = (name || "").trim();
    if (s.length <= 28) return s;
    const parts = s.split(/\s+/);
    return parts.length >= 2 ? `${parts[0]} ${parts[parts.length-1][0]}.` : s.slice(0,26) + '…';
  }, [name]);

  // Memoize patient summary with only essential stable dependencies
  const roomDisplay = useMemo(() => 
    currentRoom ?? localLocationLabel ?? locationLabel ?? undefined, 
    [currentRoom, localLocationLabel, locationLabel]
  );
  
  const getPatientSummary = useMemo(() => {
    return (pid: string) => ({
      id: String(patientId),
      displayName: displayName,
      age: age,
      sex: sex,
      room: roomDisplay,
      ats: ats,
      ews: typeof ews === 'number' ? ews : (ews as any)?.score,
      arrivalTs: arrivalTs
    });
  }, [patientId, displayName, age, sex, roomDisplay, ats, ews, arrivalTs]);

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

  // Memoized room assignment handler to prevent infinite loops
  const handleAssignRoom = useMemo(() => () => {
    const dashboardStore = useDashboardStore.getState();
    const encounter = dashboardStore.encounters.find(e => String(e.id) === String(patientId));
    if (encounter) {
      dashboardStore.openRoom(encounter);
    }
  }, [patientId]);

  // Memoized card click handler to prevent infinite loops
  const handleCardClick = useMemo(() => () => {
    if (isDesktopView) { 
      setDesktopOpen(true); 
    } else { 
      handleToggleOpen(); 
    }
  }, [isDesktopView, handleToggleOpen]);

  return (
    <div ref={cardAnchorRef} className="rounded-2xl border bg-card p-3">
      {/* Header row - new collapsed header component */}
      <div className="w-full text-left cursor-pointer" onClick={handleCardClick} aria-expanded={open} aria-controls={`exp-${name}`}> 
        <div className="grid grid-cols-[1fr_auto] gap-2 items-start">
          {/* Left: collapsed header content (no CTAs) */}
          <CollapsedCardHeader
            patientId={patientId}
            name={displayName}
            ageSex={ageSex}
            ats={ats}
            locationLabel={roomDisplay}
            chiefComplaint={complaint}
            timerLabel={timer}
            isolationRequired={isolationRequired || alertFlags?.isolation}
          />
          {/* Right: status strip for both mobile and desktop */}
          <div className="ml-2 flex items-center gap-2" onClick={(e)=> e.stopPropagation()}>
            <StatusStrip flags={statusFlags} />
          </div>
        </div>
      </div>

      {/* Desktop overlay expander: AT-A-GLANCE CLINICAL LAYOUT */}
      <BoardExpandOverlay
        anchorEl={cardAnchorRef.current}
        open={desktopOpen}
        onOpenChange={setDesktopOpen}
        title={displayName}
        key={`overlay-${patientId}`}
      >
        {/* ===== Identity + Risk + Actions Header ===== */}
        <header className="sticky top-0 bg-white z-[1] p-4 border-b">
          <div className="flex items-start justify-between gap-4">
            <div>
              {/* Identity bar */}
              <div className="text-lg font-semibold">{displayName}</div>
              <div className="mt-1 flex flex-wrap gap-2 text-xs">
                <Chip>Age {age ?? "—"}</Chip>
                <Chip>NHI {maskTail(nhi, 3)}</Chip>
                <Chip>
                  <span className="inline-flex items-center gap-1">
                    <Bed className="h-3.5 w-3.5" />
                    Location {liveRoom ?? currentRoom ?? status ?? "—"}
                  </span>
                </Chip>
              </div>
              {/* Risk ribbon */}
              <div className="mt-2 flex flex-wrap gap-2">
                <EWSChipLive patientId={patientId} />
                <Chip>ATS {ats ?? "—"}</Chip>
                {allergies && <Chip tone="warning">Allergies: {allergies}</Chip>}
              </div>
            </div>

            {/* Actions (role-aware) */}
            {!isHCA && (
              <div className="flex items-center gap-2">
                {/* Triage button for RN and Charge when patient is in Waiting lane */}
                {(userRole === "rn" || userRole === "charge") && status === "Waiting" && (
                  <button 
                    onClick={() => setDrawerOpen("triage")} 
                    className="px-3 py-1.5 rounded bg-green-600 text-white"
                    data-testid="button-start-triage"
                  >
                    Triage
                  </button>
                )}
                {/* Room assignment restricted to Charge RN only (not MD) */}
                {userRole === "charge" && (
                  <button 
                    className="px-3 py-1.5 rounded border"
                    onClick={handleAssignRoom}
                    data-testid="button-assign-room"
                  >
                    Assign room
                  </button>
                )}
                {(userRole === "rn" || userRole === "charge" || userRole === "md") && (
                  <button 
                    onClick={() => setDrawerOpen("obs")} 
                    className="px-3 py-1.5 rounded bg-blue-600 text-white"
                    data-testid="button-add-obs"
                  >
                    + Obs
                  </button>
                )}
                {userRole === "md" && (
                  <button className="px-3 py-1.5 rounded border"
                    data-testid="button-order-set">Order set</button>
                )}
              </div>
            )}
          </div>
        </header>

        {/* ===== Complaint + Pathway clocks ===== */}
        <section className="px-4 pt-3">
          <div className="text-sm font-medium text-slate-700">
            {complaint ?? "—"}
          </div>
          {/* <PathwayClocks patientId={String(patientId)} complaint={complaint} /> */}
          {/* <PathwayTimers patientId={String(patientId)} complaint={complaint} /> */}
        </section>

        {/* ===== 2-column layout ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 p-4">
          {/* LEFT: Vitals + timeline */}
          <section className="rounded-lg border p-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Vitals</h3>
              {/* Next obs chip */}
              {(() => {
                const iso = nextObsDueISO(String(patientId));
                if (!iso) return null;
                const due = new Date(iso);
                const overdue = Date.now() > due.getTime();
                return (
                  <Chip tone={overdue ? "critical" : "default"}>
                    Next obs: {due.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    {overdue && <span className="ml-1">Overdue</span>}
                  </Chip>
                );
              })()}
            </div>

            {/* Vitals capsule */}
            <VitalsCapsuleLive 
              patientId={patientId} 
              onOpenTimeline={() => setOpenTL(true)}
              showHeader={false}
            />

            <div className="mt-3">
              {/* TEMPORARILY DISABLED FOR DEBUGGING: */}
              {/* <VitalsTimelineInline patientId={patientId} height={280} /> */}
              <div className="p-4 text-center text-muted-foreground border rounded">VitalsTimelineInline temporarily disabled</div>
            </div>
          </section>

          {/* RIGHT: Results → Journey → Notes → Tasks */}
          <section className="space-y-3">
            {/* 1) RESULTS (top) */}
            <ResultsCapsule patientId={String(patientId)} />

            {/* 2) JOURNEY (with simplified filters) */}
            <div className="rounded-lg border p-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold">Patient journey</h3>
                <JourneyFilters 
                  mode={journeyMode} 
                  setMode={setJourneyMode}
                  win={journeyWin}
                  setWin={setJourneyWin}
                />
              </div>
              <PatientJourneyInline 
                patientId={patientId} 
                height={320}
                showHeader={false}
                showTypeChips={false}
                showWindowChips={false}
                chrome="flat"
                mode={journeyMode as "All" | "Clinical" | "Moves"}
                windowHours={journeyWin === "4h" ? 4 : journeyWin === "8h" ? 8 : journeyWin === "24h" ? 24 : 72}
              />
            </div>

            {/* 3) NOTES (single card with quick-phrases) */}
            <div className="rounded-lg border p-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold">Notes</h3>
                {!isHCA && (
                  <button 
                    onClick={() => setDrawerOpen("notes")} 
                    className="px-3 py-1.5 rounded bg-blue-600 text-white"
                    data-testid="button-write-note"
                  >
                    Write note
                  </button>
                )}
              </div>

              {/* Notes preview/empty state */}
              <div className="text-sm text-slate-500 mb-3">No notes yet.</div>

              {/* Quick-phrases for notes */}
              {!isHCA && (
                <div className="flex flex-wrap gap-2">
                  {["Patient settled","Analgesia effective","Family updated"].map(phrase => (
                    <Chip 
                      key={phrase} 
                      onClick={() => setDrawerOpen("notes")}
                      title={`Quick note: ${phrase}`}
                    >
                      {phrase}
                    </Chip>
                  ))}
                </div>
              )}
            </div>

            {/* 4) TASKS */}
            <div className="rounded-lg border p-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold">Tasks</h3>
                <button 
                  onClick={() => console.log("View in Task Sheet - disabled")} 
                  className="px-3 py-1.5 rounded border"
                  data-testid="button-view-task-sheet"
                >
                  View in Task Sheet
                </button>
              </div>
              <div className="text-sm text-red-500 italic">TaskList emergency disabled - infinite loops affecting all patients</div>
            </div>
          </section>
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
              {/* RN and Charge specific primary actions - only for Waiting lane */}
              {(userRole === "rn" || userRole === "charge") && status === "Waiting" && (
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
              {/* MD specific action - Ready for Review for Roomed lane */}
              {(() => {
                const isRoomed = phase === "Roomed" || lane === "roomed" || status?.includes("Room");
                // Temporary workaround: Show button for roomed patients regardless of role for testing
                const showButton = isRoomed; // Simplified for testing
                console.log("Ready for Review Debug (Test Mode):", { 
                  phase, 
                  lane, 
                  status, 
                  isRoomed, 
                  showButton, 
                  patientId 
                });
                return showButton;
              })() && (
                <button
                  className="rounded-full px-3 py-2 text-sm text-white bg-green-600"
                  onClick={() => setDrawerOpen("readyForReview")}
                  data-testid="button-ready-for-review"
                >
                  Ready for Review
                </button>
              )}
              {/* Task creation for RN/Charge - DISABLED */}
              {/* {(userRole === "rn" || userRole === "charge") && (
                <button
                  className="rounded-full border px-3 py-2 text-sm"
                  onClick={() => setOpenTaskDrawer(true)}
                  data-testid="button-new-task"
                >
                  + Task
                </button>
              )} */}
              {/* Room assignment - not available for MD role */}
              {userRole !== "md" && (
                <button className="rounded-full border px-3 py-2 text-sm" onClick={() => {
                  // Use the proper room management system instead of dummy AssignRoomPanel
                  const dashboardStore = useDashboardStore.getState();
                  const encounter = dashboardStore.encounters.find(e => String(e.id) === String(patientId));
                  if (encounter) {
                    dashboardStore.openRoom(encounter);
                  }
                }} data-testid="button-assign-room">Assign room</button>
              )}
              <button className="rounded-full px-3 py-2 text-sm text-white bg-blue-600" onClick={() => setDrawerOpen("obs")} data-testid="button-add-obs">+ Obs</button>
            </div>
          )}
          {userRole === "hca" && (
            <div className="text-sm text-slate-500 italic">Read-only view for HCA</div>
          )}

          {/* Clinical Snapshot - hidden on mobile to avoid duplication */}
          <div className="hidden md:block">
            <ClinicalSnapshot 
              patientId={patientId}
              complaint={complaint}
              ats={ats}
              o2Label={o2Label}
            />
          </div>

          {/* Vitals Capsule Live */}
          <VitalsCapsuleLive 
            patientId={patientId} 
            onOpenTimeline={() => setOpenTL(true)}
            showHeader={false}
          />

          {/* Tasks Mini (if any) */}
          {tasks && tasks.length > 0 && <TasksMini tasks={tasks} onOpen={() => console.log("Open task board")} />}

          {/* Results Capsule */}
          <ResultsCapsule patientId={String(patientId)} />

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
              : drawerOpen === "triage" ? `Triage — ${displayName}`
              : drawerOpen === "register" ? `Register patient — ${displayName}`
              : drawerOpen === "readyForReview" ? `Ready for Review — ${displayName}`
              : drawerOpen === "notes" ? `Write note — ${displayName}` : `${displayName}`}
        open={!!drawerOpen}
        onClose={()=> setDrawerOpen(false)}
        widthPx={920}
      >
        {drawerOpen === "obs" && (
          <ObsQuickForm patientId={patientId} onSaved={()=> setDrawerOpen(false)} />
        )}
        {drawerOpen === "notes" && (
          <NotesDrawer 
            patientId={patientId} 
            onSaved={() => setDrawerOpen(false)} 
          />
        )}
        {drawerOpen === "triage" && <TriageDrawer patientId={patientId} onSaved={()=> setDrawerOpen(false)} />}
        {drawerOpen === "register" && <RegistrationDrawer patientId={patientId} onSaved={()=> setDrawerOpen(false)} />}
        {drawerOpen === "readyForReview" && <ReadyForReviewDrawer patientId={patientId} onSaved={()=> setDrawerOpen(false)} />}
      </AuthoringDrawer>

      {/* Task Creation Drawer - DISABLED */}
      {/* <CreateTaskDrawer
        isOpen={openTaskDrawer}
        onClose={() => setOpenTaskDrawer(false)}
        defaultPatientId={String(patientId)}
        defaultOrigin={userRole === "charge" ? "Charge" : "RN"}
      /> */}

      {/* Task Card Sheet - DISABLED */}
      {/* {openTaskSheet && (
        <TaskCardSheet
          taskId={openTaskSheet}
          onClose={() => setOpenTaskSheet(null)}
          getPatientSummary={getPatientSummary}
          currentUserId={userRole === "hca" ? "hca-1" : undefined}
          readOnly={userRole === "hca"}
        />
      )} */}
    </div>
  );
}