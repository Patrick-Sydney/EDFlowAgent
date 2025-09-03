// components/patient/PerVitalSparklines.tsx
import React, { useMemo } from "react";
import { useVitalsStore } from "@/stores/vitalsStore";

type V = { t: string; rr?:number; hr?:number; sbp?:number; spo2?:number; temp?:number };
const Keys = [
  { k:"rr" as const,  label:"RR",  min:0,  max:40 },
  { k:"hr" as const,  label:"HR",  min:40, max:160 },
  { k:"sbp" as const, label:"SBP", min:70, max:200 },
  { k:"spo2" as const,label:"SpO₂",min:80, max:100 },
  { k:"temp" as const,label:"Temp",min:34, max:41 },
];

function Spark({ pts, min, max }: { pts:number[]; min:number; max:number }) {
  const w=110, h=24;
  if (pts.length<2) return <svg width={w} height={h}/>;
  const xs = pts.map((_,i)=> (i/(pts.length-1))*w);
  const ys = pts.map(v => h - ((v-min)/(max-min))*h);
  const d = xs.map((x,i)=> `${i?"L":"M"}${x.toFixed(1)},${(ys[i]||0).toFixed(1)}`).join(" ");
  return (
    <svg width={w} height={h} className="text-slate-500">
      <path d={d} fill="none" stroke="currentColor" strokeWidth={1.5}/>
    </svg>
  );
}

export default function PerVitalSparklines({ patientId, hours=8 }:{patientId:string; hours?:number}) {
  const data = (useVitalsStore(s=> s.byPatient)?.(patientId) ?? []) as V[];
  const since = Date.now() - hours*3600*1000;
  const recent = useMemo(()=> data.filter(v=> new Date(v.t).getTime() >= since), [data,since]);

  return (
    <div className="space-y-2">
      {Keys.map(({k, label, min, max}) => {
        const vals = recent.map(v=> v[k]).filter((x): x is number => x!=null);
        const last = vals.at(-1);
        return (
          <div key={k} className="flex items-center gap-3">
            <div className="w-10 text-xs text-right">{label}</div>
            <Spark pts={vals} min={min} max={max}/>
            <div className="w-8 text-xs text-muted-foreground">{last ?? "—"}</div>
          </div>
        );
      })}
    </div>
  );
}