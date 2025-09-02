import React, { useState } from "react";
import { journeyStore } from "../../stores/journeyStore";

export default function TriageDrawer({ patientId, onSaved }:{ patientId: string|number; onSaved?: ()=>void; }) {
  const [ats, setAts] = useState<1|2|3|4|5|undefined>(undefined);
  const [presenting, setPresenting] = useState("");
  const [saving, setSaving] = useState(false);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <div className="text-xs text-muted-foreground mb-1">ATS</div>
          <div className="flex gap-1">
            {[1,2,3,4,5].map(n => (
              <button key={n} className={`rounded-full border px-3 py-1 ${ats===n?"bg-background shadow":""}`} onClick={()=>setAts(n as any)}>ATS {n}</button>
            ))}
          </div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground mb-1">Presenting complaint</div>
          <input className="w-full rounded-xl border px-3 py-2" value={presenting} onChange={e=>setPresenting(e.target.value)} placeholder="e.g., chest pain, shortness of breath" />
        </div>
      </div>

      <div className="flex items-center justify-end gap-2">
        <button className="rounded-full border px-4 py-2 text-sm" onClick={()=>{ setAts(undefined); setPresenting(""); }}>Clear</button>
        <button
          disabled={saving || !ats}
          className="rounded-full px-4 py-2 text-sm text-white bg-blue-600 disabled:opacity-50"
          onClick={()=>{
            setSaving(true);
            try {
              journeyStore.add(String(patientId), { kind:"triage", label:`Triage completed (ATS ${ats})`, detail: presenting || undefined });
              // Broadcast for any chips/badges that mirror ATS
              window.dispatchEvent(new CustomEvent("patient:triageUpdated", { detail: { patientId, ats } }));
            } finally {
              setSaving(false);
              onSaved?.();
            }
          }}
        >
          Save triage
        </button>
      </div>
    </div>
  );
}