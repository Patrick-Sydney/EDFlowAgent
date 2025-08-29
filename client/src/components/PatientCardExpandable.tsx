import React, { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Clock, User, Eye, EyeOff, Copy, QrCode, Info, ShieldAlert, ActivitySquare } from "lucide-react";
import { VitalsTimelineDrawer } from "./VitalsTimelineDrawer";

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

function VitalsCapsule({ vitals, onOpenTimeline, onAddObs }: { vitals?: MinVitals; onOpenTimeline?: () => void; onAddObs?: () => void; }) {
  const Item = ({ label, val, unit }: { label: string; val?: number; unit?: string }) => (
    <div className="rounded-lg border p-2 text-center">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="text-sm font-medium">{val ?? '—'}{val!=null && unit ? ` ${unit}` : ''}</div>
    </div>
  );
  return (
    <div className="rounded-xl border p-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium flex items-center gap-1"><ActivitySquare className="h-4 w-4"/>Vitals</div>
        <div className="flex gap-2">
          {onOpenTimeline && <Button size="sm" variant="outline" className="rounded-full" onClick={onOpenTimeline}>Timeline</Button>}
          {onAddObs && <Button size="sm" className="rounded-full" onClick={onAddObs}>+ Obs</Button>}
        </div>
      </div>
      <div className="mt-2 grid grid-cols-5 gap-2">
        <Item label="RR" val={vitals?.rr} unit="/m"/>
        <Item label="SpO₂" val={vitals?.spo2} unit="%"/>
        <Item label="HR" val={vitals?.hr} unit="bpm"/>
        <Item label="SBP" val={vitals?.sbp} unit="mmHg"/>
        <Item label="Temp" val={vitals?.temp} unit="°C"/>
      </div>
      {vitals?.takenAt && <div className="mt-2 text-[11px] text-muted-foreground">Last set {new Date(vitals.takenAt).toLocaleTimeString()}</div>}
    </div>
  );
}

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
  patientId?: string;        // for timeline integration
  onPrimary?: () => void;
  primaryLabel?: string;
  onOrderSet?: () => void;       // MD quick order set
  onAssignRoom?: () => void;     // Charge
  onAddObs?: () => void;         // RN
  onOpenFull?: () => void;       // open full card/drawer if needed
};

export default function PatientCardExpandable(props: ExpandableCardProps) {
  const {
    ctaMode = "collapsed", name, status, timer, complaint, ews, ats, ageSex, dob, nhi, mrn, alerts = [], allergies = [], role,
    minVitals, patientId, onPrimary, primaryLabel = '+ Obs', onOrderSet, onAssignRoom, onAddObs, onOpenFull
  } = props;

  const [open, setOpen] = useState(false);
  const [openTL, setOpenTL] = useState(false);
  const displayName = useMemo(() => {
    const s = (name || "").trim();
    if (s.length <= 28) return s;
    const parts = s.split(/\s+/);
    return parts.length >= 2 ? `${parts[0]} ${parts[parts.length-1][0]}.` : s.slice(0,26) + '…';
  }, [name]);

  const handlePrimary = () => {
    if (onPrimary) return onPrimary();
    const label = (primaryLabel || "").toLowerCase();
    if (label.includes("obs") && onAddObs) return onAddObs();
    if (label.includes("assign") && onAssignRoom) return onAssignRoom();
  };

  return (
    <div className="rounded-2xl border bg-card p-3">
      {/* Header row */}
      <div className="w-full text-left cursor-pointer" onClick={()=> setOpen(o=>!o)} aria-expanded={open} aria-controls={`exp-${name}`}> 
        <div className="grid grid-cols-[1fr_auto] gap-2 items-center">
          <div className="min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <User className="h-4 w-4 text-muted-foreground shrink-0" />
              <div title={name} className="font-semibold text-lg truncate max-w-[52vw] sm:max-w-[40ch]">{displayName}</div>
              {/* Chips live here; calm outline to avoid noise */}
              {typeof ews === 'number' && <Badge variant="outline" className="shrink-0 text-xs">EWS {ews}</Badge>}
              {typeof ats === 'number' && <Badge variant="outline" className="shrink-0 text-xs">ATS {ats}</Badge>}
            </div>
            <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground min-w-0">
              {ageSex && <span className="shrink-0">{ageSex}</span>}
              <span className="rounded-full bg-muted px-2 py-0.5 shrink-0">{status}</span>
              {timer && (
                <span className="flex items-center gap-1 min-w-0"><Clock className="h-3 w-3" /><span className="truncate">{timer}</span></span>
              )}
            </div>
            {complaint && <div className="mt-1 text-sm text-muted-foreground line-clamp-1">{complaint}</div>}
          </div>
          <div className="ml-2 flex items-center gap-2" onClick={(e)=> e.stopPropagation()}>
            {ctaMode === "collapsed" ? (
              <Button className="h-11 rounded-full px-4 min-w-[96px] shrink-0" onClick={handlePrimary}>{primaryLabel}</Button>
            ) : null}
          </div>
        </div>
      </div>

      {/* Expandable content */}
      <div id={`exp-${name}`} className={`transition-all overflow-hidden ${open? 'mt-3 max-h-[1600px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="space-y-3">
          {/* Identity */}
          <IdentityInline legalName={name} ageSex={ageSex} dob={dob ?? undefined} nhi={nhi ?? undefined} mrn={mrn ?? undefined} alerts={alerts} allergies={allergies} onAudit={(e)=>{/* wire to audit */}} />

          {/* Vitals Capsule (restores quick vitals & access to timeline) */}
          <VitalsCapsule vitals={minVitals} onOpenTimeline={() => setOpenTL(true)} onAddObs={onAddObs} />

          {/* Role-specific quick actions */}
          <div className="rounded-xl border p-3">
            <div className="text-sm font-medium">Quick actions</div>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button size="sm" onClick={handlePrimary}>{primaryLabel}</Button>
              {role === 'RN' && (
                <>
                  <Button size="sm" variant="outline" className="rounded-full" onClick={onAddObs}>+ Obs</Button>
                </>
              )}
              {role === 'Charge' && (
                <>
                  <Button size="sm" variant="outline" className="rounded-full" onClick={onAssignRoom}>Assign room</Button>
                </>
              )}
              {role === 'MD' && (
                <>
                  <Button size="sm" variant="outline" className="rounded-full" onClick={onOrderSet}>Order set</Button>
                </>
              )}
              <Button size="sm" variant="outline" className="rounded-full" onClick={onOpenFull}>Open details</Button>
            </div>
          </div>

          {/* Insights placeholder (lightweight) */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border p-3">
              <div className="text-xs text-muted-foreground">EWS</div>
              <div className="text-sm">{typeof ews === 'number' ? `Current ${ews}` : '—'}</div>
            </div>
            <div className="rounded-xl border p-3">
              <div className="text-xs text-muted-foreground">Tasks due</div>
              <div className="text-sm">None</div>
            </div>
          </div>
        </div>
      </div>

      {/* Vitals Timeline Drawer */}
      <VitalsTimelineDrawer
        open={openTL}
        onOpenChange={setOpenTL}
        patientId={patientId || ""}
        patientName={name}
        onAddObs={onAddObs}
      />
    </div>
  );
}