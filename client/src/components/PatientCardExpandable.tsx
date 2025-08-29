import React, { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Clock, User, Eye, EyeOff, Copy, QrCode, Info, ShieldAlert } from "lucide-react";
import { Encounter } from "@/shared/schema";

// Define Role type for compatibility
export type Role = "reception" | "charge" | "rn" | "md";

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
// Expandable patient card (phone‑first)
// - Header looks like PatientCardCompact
// - Tap the card toggles an inline expansion with Identity + Actions + Insights
// ------------------------------------------------------------------
export type ExpandableCardProps = {
  encounter: Encounter;
  role: Role;
  onOpenChart?: (patientId: string) => void;
  onMarkTask?: (patientId: string, taskId: string, status: string) => void;
  onOrderSet?: (patientId: string, setName: string) => void;
  onDisposition?: (patientId: string, disp: string) => void;
  onStartTriage?: (patientId: string) => void;
  onAssignRoom?: (patientId: string, roomId: string) => void;
};

export default function PatientCardExpandable(props: ExpandableCardProps) {
  const {
    encounter, role, onOpenChart, onMarkTask, onOrderSet, onDisposition, onStartTriage, onAssignRoom
  } = props;
  
  // Extract data from encounter
  const name = encounter.name || "";
  const ageSex = `${encounter.age} ${encounter.sex}`;
  const status = encounter.lane || "waiting";
  const complaint = encounter.complaint || "";
  const nhi = encounter.nhi;
  const mrn = encounter.mrn;
  const dob = encounter.dob;
  const alerts: string[] = [];
  const allergies: string[] = [];
  
  // Calculate simple timer (time since arrival)
  const timer = useMemo(() => {
    const arrivalTime = new Date(encounter.arrivalTime);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - arrivalTime.getTime()) / (1000 * 60));
    if (diffMinutes < 60) return `${diffMinutes}m`;
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    return `${hours}h ${minutes}m`;
  }, [encounter.arrivalTime]);
  
  // Simple EWS calculation (mock for now)
  const ews = useMemo(() => {
    // Basic scoring based on available vitals
    let score = 0;
    if (encounter.triageHr) {
      const hr = encounter.triageHr;
      if (hr <= 40 || hr >= 131) score += 3;
      else if ((hr >= 41 && hr <= 50) || (hr >= 111 && hr <= 130)) score += 2;
    }
    return score > 0 ? score : undefined;
  }, [encounter.triageHr]);

  const [open, setOpen] = useState(false);
  const displayName = useMemo(() => {
    const s = name.trim();
    if (s.length <= 28) return s;
    const parts = s.split(/\s+/);
    return parts.length >= 2 ? `${parts[0]} ${parts[parts.length-1][0]}.` : s.slice(0,26) + '…';
  }, [name]);

  return (
    <div className="rounded-2xl border bg-card p-3">
      {/* Header row */}
      <button className="w-full text-left" onClick={()=> setOpen(o=>!o)} aria-expanded={open} aria-controls={`exp-${name}`}> 
        <div className="grid grid-cols-[1fr_auto] gap-2 items-center">
          <div className="min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <User className="h-4 w-4 text-muted-foreground shrink-0" />
              <div title={name} className="font-semibold text-lg truncate max-w-[58vw] sm:max-w-[40ch]">{displayName}</div>
              {typeof ews === 'number' && <Badge variant="outline" className="shrink-0 text-xs">EWS {ews}</Badge>}
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
            <Button className="h-11 rounded-full px-4 min-w-[96px] shrink-0" onClick={() => onOpenChart?.(encounter.id)}>
              {role === 'RN' ? '+ Obs' : role === 'Charge' ? 'Assign' : 'Review'}
            </Button>
          </div>
        </div>
      </button>

      {/* Expandable content */}
      <div id={`exp-${name}`} className={`transition-all overflow-hidden ${open? 'mt-3 max-h-[1200px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="space-y-3">
          {/* Identity */}
          <IdentityInline 
            legalName={name} 
            ageSex={ageSex} 
            dob={dob ?? undefined} 
            nhi={nhi ?? undefined} 
            mrn={mrn ?? undefined} 
            alerts={alerts} 
            allergies={allergies} 
            onAudit={(e)=> console.log("Identity audit:", e)} 
          />

          {/* Role-specific quick actions */}
          <div className="rounded-xl border p-3">
            <div className="text-sm font-medium">Quick actions</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {role === 'rn' && (
                <>
                  <Button size="sm" variant="outline" className="rounded-full" onClick={() => onOpenChart?.(encounter.id)}>+ Obs</Button>
                </>
              )}
              {role === 'charge' && (
                <>
                  <Button size="sm" variant="outline" className="rounded-full" onClick={() => onAssignRoom?.(encounter.id, "")}>Assign room</Button>
                </>
              )}
              {role === 'md' && (
                <>
                  <Button size="sm" variant="outline" className="rounded-full" onClick={() => onOrderSet?.(encounter.id, "Chest Pain")}>Order set</Button>
                </>
              )}
              <Button size="sm" variant="outline" className="rounded-full" onClick={() => onOpenChart?.(encounter.id)}>Open details</Button>
            </div>
          </div>

          {/* Insights placeholder (lightweight) */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border p-3">
              <div className="text-xs text-muted-foreground">EWS trend</div>
              <div className="text-sm">{typeof ews === 'number' ? `Last ${ews}` : '—'}</div>
            </div>
            <div className="rounded-xl border p-3">
              <div className="text-xs text-muted-foreground">Tasks due</div>
              <div className="text-sm">None</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}