import React, { useEffect, useMemo, useRef, useState } from "react";
import { vitalsStore, useVitalsLast } from "../../stores/vitalsStore";
import "./obs-slider.css";

type Num = number | undefined;

// --- Adult EWS (NEWS-like) scoring ---
function sRR(rr: Num){ if(rr==null) return 0; if(rr<=8) return 3; if(rr<=11) return 1; if(rr<=20) return 0; if(rr<=24) return 2; return 3; }
function sSpO2(x: Num){ if(x==null) return 0; if(x>=96) return 0; if(x>=94) return 1; if(x>=92) return 2; return 3; }
function sHR(x: Num){ if(x==null) return 0; if(x<=40) return 3; if(x<=50) return 1; if(x<=90) return 0; if(x<=110) return 1; if(x<=130) return 2; return 3; }
function sSBP(x: Num){ if(x==null) return 0; if(x<=90) return 3; if(x<=100) return 2; if(x<=110) return 1; if(x<=219) return 0; return 3; }
function sTemp(x: Num){ if(x==null) return 0; if(x<=35) return 3; if(x<=36) return 1; if(x<=38) return 0; if(x<=39) return 1; return 2; }
function sLOC(loc: "A"|"V"|"P"|"U"|undefined){ return !loc || loc==="A" ? 0 : 3; }

function calcEWS(v:{rr?:number; spo2?:number; hr?:number; sbp?:number; temp?:number; loc?:"A"|"V"|"P"|"U";}){
  return sRR(v.rr)+sSpO2(v.spo2)+sHR(v.hr)+sSBP(v.sbp)+sTemp(v.temp)+sLOC(v.loc);
}

// --- Finger-first slider ---
function FingerSlider({
  label, unit, min, max, step = 1,
  value, onChange, last,
}:{
  label:string; unit?:string; min:number; max:number; step?:number;
  value:Num; onChange:(n:Num)=>void; last?:number;
}){
  const [active,setActive]=useState(false);
  const [touched,setTouched]=useState<boolean>(value!=null || last!=null); // controls thumb visibility
  const inputRef=useRef<HTMLInputElement|null>(null);
  const cardRef=useRef<HTMLDivElement|null>(null);

  const visual = value ?? last ?? (min+max)/2;

  // map a clientX to a snapped value within [min,max]
  const commitFromClientX = (clientX:number) => {
    const input = inputRef.current; if(!input) return;
    const r = input.getBoundingClientRect();
    const ratio = (clientX - r.left) / r.width;
    const clamped = Math.min(1, Math.max(0, ratio));
    const v = min + clamped * (max - min);
    const snapped = Math.round(v / step) * step;
    onChange(Number(snapped.toFixed(2)));
  };

  // Full-card drag (including first interaction). We avoid hijacking +/- and the native range.
  const onCardPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = e.target as HTMLElement;
    if (el.closest("button") || (el as HTMLInputElement).type === "range") return;
    e.preventDefault();
    setTouched(true);
    setActive(true);
    cardRef.current?.setPointerCapture(e.pointerId);
    commitFromClientX(e.clientX);
  };
  const onCardPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!active) return;
    commitFromClientX(e.clientX);
  };
  const onCardPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!active) return;
    try { cardRef.current?.releasePointerCapture(e.pointerId); } catch {}
    setActive(false);
  };

  const delta = last!=null && value!=null ? value-last : undefined;
  const deltaStr = delta ? (delta>0?`Δ +${Math.abs(delta)}`:`Δ −${Math.abs(delta)}`) : undefined;

  return (
    <div
      ref={cardRef}
      className={`rounded-xl border p-3 drag-surface ${active ? "dragging" : ""}`}
      onPointerDown={onCardPointerDown}
      onPointerMove={onCardPointerMove}
      onPointerUp={onCardPointerUp}
      onPointerCancel={onCardPointerUp}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm">{label}</div>
        <div className="text-base font-medium tabular-nums">
          {value != null ? value : last != null ? <span className="text-muted-foreground">Last {last}</span> : "—"}
          {unit && <span className="ml-1 text-xs text-muted-foreground">{unit}</span>}
          {deltaStr && <span className="ml-2 text-xs rounded-full border px-2 py-0.5">{deltaStr}</span>}
        </div>
      </div>
      <div className="relative">
        <input
          ref={inputRef}
          type="range"
          className="finger-range z-0"
          min={min}
          max={max}
          step={step}
          value={visual}
          onChange={(e) => { onChange(Number(e.target.value)); setTouched(true); }}
          data-active={active ? "true" : "false"}
          data-hasvalue={touched ? "true" : "false"}
        />
      </div>
      <div className="mt-2 flex items-center justify-between">
        <button className="hit-btn text-base"
          onClick={()=>{ const next=(value ?? last ?? (min+max)/2)-step; onChange(Number(Math.max(min,next).toFixed(2))); setTouched(true); }}>−</button>
        <button className="hit-btn text-base"
          onClick={()=>{ const next=(value ?? last ?? (min+max)/2)+step; onChange(Number(Math.min(max,next).toFixed(2))); setTouched(true); }}>+</button>
      </div>
    </div>
  );
}

export default function ObsQuickForm({ patientId, onSaved }:{
  patientId:string|number; onSaved?:()=>void;
}){
  const last = useVitalsLast(String(patientId)); // last?.{rr,spo2,hr,sbp,temp}
  const [rr,setRR]=useState<Num>(last?.rr);
  const [spo2,setSpO2]=useState<Num>(last?.spo2);
  const [hr,setHR]=useState<Num>(last?.hr);
  const [sbp,setSBP]=useState<Num>(last?.sbp);
  const [temp,setTemp]=useState<Num>(last?.temp);
  const [loc,setLOC]=useState<"A"|"V"|"P"|"U"|undefined>("A");
  const [saving,setSaving]=useState(false);

  const ews=useMemo(()=>calcEWS({rr,spo2,hr,sbp,temp,loc}),[rr,spo2,hr,sbp,temp,loc]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">Enter observations</div>
        <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm">
          EWS <strong className="tabular-nums">{isFinite(ews)?ews:0}</strong>
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <FingerSlider label="Respiratory rate" unit="bpm" min={4} max={60} step={1}
          value={rr} onChange={setRR} last={last?.rr}/>
        <FingerSlider label="SpO₂" unit="%" min={70} max={100} step={1}
          value={spo2} onChange={setSpO2} last={last?.spo2}/>
        <FingerSlider label="Heart rate" unit="bpm" min={20} max={220} step={1}
          value={hr} onChange={setHR} last={last?.hr}/>
        <FingerSlider label="Systolic BP" unit="mmHg" min={50} max={260} step={1}
          value={sbp} onChange={setSBP} last={last?.sbp}/>
        <FingerSlider label="Temperature" unit="°C" min={32} max={42.5} step={0.1}
          value={temp} onChange={setTemp} last={last?.temp}/>

        <div className="rounded-xl border p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm">Level of consciousness</div>
            <div className="text-xs text-muted-foreground">AVPU</div>
          </div>
          <div className="flex items-center gap-1">
            {(["A","V","P","U"] as const).map(k=>(
              <button key={k}
                className={`rounded-full border px-3 py-1 text-sm ${k===loc?"bg-background shadow":""}`}
                onClick={()=>setLOC(k)}>{k}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 pt-1">
        <button className="rounded-full border px-4 py-2 text-sm"
          onClick={()=>{ setRR(undefined); setSpO2(undefined); setHR(undefined); setSBP(undefined); setTemp(undefined); setLOC("A"); }}>
          Clear
        </button>
        <button
          className="rounded-full px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          disabled={saving}
          onClick={async ()=>{
            setSaving(true);
            try{
              const obs = { 
                t: new Date().toISOString(), 
                patientId,
                rr, spo2, hr, sbp, temp, ews, 
                source: "obs" as const 
              };
              vitalsStore.add(String(patientId), obs);  // updates chips/timeline immediately
              // Nudge any listeners (e.g., timeline) to refresh instantly
              window.dispatchEvent(new CustomEvent("vitals:updated", { detail: { patientId } }));
              onSaved?.();
            } finally { setSaving(false); }
          }}>
          Save obs
        </button>
      </div>
    </div>
  );
}