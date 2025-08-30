import React, { useState } from "react";
import { Eye, EyeOff, Copy, QrCode, ShieldAlert, Info } from "lucide-react";

export function maskTail(value?: string | null, visible = 3) {
  if (!value) return "—";
  const vis = value.slice(-visible);
  const mask = "•".repeat(Math.max(0, value.length - visible));
  return `${mask}${vis}`;
}

export default function IdentitySlim({
  nhi, mrn, alerts = [], allergies = [], onAudit,
}: {
  nhi?: string | null;
  mrn?: string | null;
  alerts?: string[];
  allergies?: string[];
  onAudit?: (evt: { action: "reveal" | "copy" | "qr_open"; field: string }) => void;
}) {
  const [showNHI, setShowNHI] = useState(false);
  const [showMRN, setShowMRN] = useState(false);

  const copy = async (text: string, field: string) => {
    try { await navigator.clipboard.writeText(text); onAudit?.({ action: "copy", field }); } catch {}
  };

  return (
    <div className="rounded-xl border p-3 bg-background">
      {/* Identifiers only (no duplicated name/age/sex). Keep it short. */}
      <div className="grid grid-cols-2 gap-3">
        {/* NHI */}
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="text-[11px] text-muted-foreground">NHI</div>
            <div className="font-mono text-sm">{showNHI ? (nhi ?? "—") : maskTail(nhi ?? undefined)}</div>
          </div>
          <div className="flex items-center gap-1">
            {nhi && (
              <button className="rounded-full border p-1.5" onClick={()=>{ setShowNHI(v=>!v); onAudit?.({ action:"reveal", field:"NHI" }); }}>
                {showNHI ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
              </button>
            )}
            {nhi && (
              <button className="rounded-full border p-1.5" onClick={()=> copy(nhi, "NHI")}>
                <Copy className="h-4 w-4"/>
              </button>
            )}
            {nhi && (
              <button className="rounded-full border p-1.5" onClick={()=> onAudit?.({ action:"qr_open", field:"NHI" })}>
                <QrCode className="h-4 w-4"/>
              </button>
            )}
          </div>
        </div>
        {/* MRN */}
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="text-[11px] text-muted-foreground">MRN</div>
            <div className="font-mono text-sm">{showMRN ? (mrn ?? "—") : maskTail(mrn ?? undefined)}</div>
          </div>
          <div className="flex items-center gap-1">
            {mrn && (
              <button className="rounded-full border p-1.5" onClick={()=>{ setShowMRN(v=>!v); onAudit?.({ action:"reveal", field:"MRN" }); }}>
                {showMRN ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
              </button>
            )}
            {mrn && (
              <button className="rounded-full border p-1.5" onClick={()=> copy(mrn, "MRN")}>
                <Copy className="h-4 w-4"/>
              </button>
            )}
          </div>
        </div>
      </div>

      {(allergies.length || alerts.length) ? (
        <div className="mt-3 space-y-2">
          {!!allergies.length && (
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-rose-600"/><span className="text-sm">Allergies:</span>
              <div className="flex flex-wrap gap-1">{allergies.map(a => <span key={a} className="rounded-full border px-2 py-0.5 text-xs">{a}</span>)}</div>
            </div>
          )}
          {!!alerts.length && (
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-amber-600"/><span className="text-sm">Alerts:</span>
              <div className="flex flex-wrap gap-1">{alerts.map(a => <span key={a} className="rounded-full border px-2 py-0.5 text-xs">{a}</span>)}</div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}