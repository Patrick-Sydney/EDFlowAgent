import React, { useState } from "react";
import { journeyStore } from "../../stores/journeyStore";

export default function RegistrationDrawer({ patientId, onSaved }:{ patientId: string|number; onSaved?: ()=>void; }) {
  const [nhi, setNhi] = useState("");
  const [mrn, setMrn] = useState("");
  const [dob, setDob] = useState("");
  const [sex, setSex] = useState<"M"|"F"|"X"|"U"|"">("");
  const [saving, setSaving] = useState(false);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <div className="text-xs text-muted-foreground mb-1">NHI</div>
          <input className="w-full rounded-xl border px-3 py-2" value={nhi} onChange={e=>setNhi(e.target.value.toUpperCase())} placeholder="e.g., ABC001" />
        </div>
        <div>
          <div className="text-xs text-muted-foreground mb-1">MRN</div>
          <input className="w-full rounded-xl border px-3 py-2" value={mrn} onChange={e=>setMrn(e.target.value)} placeholder="optional" />
        </div>
        <div>
          <div className="text-xs text-muted-foreground mb-1">DOB</div>
          <input className="w-full rounded-xl border px-3 py-2" type="date" value={dob} onChange={e=>setDob(e.target.value)} />
        </div>
        <div>
          <div className="text-xs text-muted-foreground mb-1">Sex</div>
          <div className="flex gap-1">
            {(["M","F","X","U"] as const).map(s => (
              <button key={s} className={`rounded-full border px-3 py-1 ${sex===s?"bg-background shadow":""}`} onClick={()=>setSex(s)}>{s}</button>
            ))}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-end gap-2">
        <button className="rounded-full border px-4 py-2 text-sm" onClick={()=>{ setNhi(""); setMrn(""); setDob(""); setSex(""); }}>Clear</button>
        <button
          disabled={saving}
          className="rounded-full px-4 py-2 text-sm text-white bg-blue-600 disabled:opacity-50"
          onClick={()=>{
            setSaving(true);
            // You can persist these to your patient store here if available.
            try {
              journeyStore.add(String(patientId), { kind:"arrival", label:"Patient registered", detail:[nhi && `NHI ${nhi}`, mrn && `MRN ${mrn}`, dob && `DOB ${dob}`, sex && `Sex ${sex}`].filter(Boolean).join(" • ") });
            } finally {
              setSaving(false);
              onSaved?.();
            }
          }}
        >
          Save registration
        </button>
      </div>
    </div>
  );
}