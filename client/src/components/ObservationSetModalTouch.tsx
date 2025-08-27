import React, { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Activity, Droplets, HeartPulse, Waves, Thermometer, ShieldAlert } from "lucide-react";

// ------------------------------------------------------------
// NZ Early Warning Score policy (approx bands – please verify)
// ------------------------------------------------------------
export type Band = { min?: number; max?: number; pts: 0|1|2|3; label?: string; color: string };
export const NZ_POLICY = {
  rr: [
    { max: 4, pts: 3, color: "bg-rose-600" },
    { min: 5, max: 8, pts: 3, color: "bg-rose-600" },
    { min: 9, max: 11, pts: 1, color: "bg-amber-400" },
    { min: 12, max: 20, pts: 0, color: "bg-emerald-500" },
    { min: 21, max: 24, pts: 2, color: "bg-amber-500" },
    { min: 25, pts: 3, color: "bg-rose-600" },
  ] as Band[],
  spo2_scale1: [
    { min: 96, pts: 0, color: "bg-emerald-500" },
    { min: 94, max: 95, pts: 1, color: "bg-amber-400" },
    { min: 92, max: 93, pts: 2, color: "bg-amber-500" },
    { max: 91, pts: 3, color: "bg-rose-600" },
  ] as Band[],
  sbp: [
    { max: 70, pts: 3, color: "bg-rose-600" },
    { min: 71, max: 80, pts: 3, color: "bg-rose-600" },
    { min: 81, max: 90, pts: 2, color: "bg-amber-500" },
    { min: 91, max: 100, pts: 1, color: "bg-amber-400" },
    { min: 101, max: 199, pts: 0, color: "bg-emerald-500" },
    { min: 200, pts: 3, color: "bg-rose-600" },
  ] as Band[],
  hr: [
    { max: 40, pts: 3, color: "bg-rose-600" },
    { min: 41, max: 50, pts: 2, color: "bg-amber-500" },
    { min: 51, max: 90, pts: 0, color: "bg-emerald-500" },
    { min: 91, max: 110, pts: 1, color: "bg-amber-400" },
    { min: 111, max: 130, pts: 2, color: "bg-amber-500" },
    { min: 131, pts: 3, color: "bg-rose-600" },
  ] as Band[],
  temp: [
    { max: 34, pts: 3, color: "bg-rose-600" },
    { min: 35, max: 36, pts: 1, color: "bg-amber-400" },
    { min: 36.1, max: 38, pts: 0, color: "bg-emerald-500" },
    { min: 38.1, max: 38.9, pts: 1, color: "bg-amber-400" },
    { min: 39, pts: 2, color: "bg-amber-500" },
  ] as Band[],
  acvpu: { A: 0, C: 3, V: 3, P: 3, U: 3 } as Record<string, 0|3>,
};

// ------------------------------------------------------------
// Utilities
// ------------------------------------------------------------
const parseNum = (s?: string | number) => {
  if (s === undefined || s === null) return undefined;
  const n = Number(String(s).replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(n) ? n : undefined;
};

const bandPoints = (value: number | undefined, bands: Band[] | undefined): 0|1|2|3 => {
  if (value === undefined || !bands) return 0;
  for (const b of bands) {
    const okMin = b.min === undefined || value >= b.min;
    const okMax = b.max === undefined || value <= b.max;
    if (okMin && okMax) return b.pts;
  }
  return 0;
};

// Vibrate lightly if supported (gloved finger feedback)
const vibe = (ms = 10) => { try { (navigator as any)?.vibrate?.(ms); } catch {} };

// Pull L/min from a saved O2 string, e.g. "Nasal prongs 2 L/min"
const flowFrom = (s?: string) => {
  if (!s) return undefined;
  const m = String(s).match(/(\d+(?:\.\d+)?)\s*(?:l\/?min|l\s*\/\s*min|lpm|l)/i);
  return m?.[1];
};

// ------------------------------------------------------------
// Numeric keypad (large targets for touch)
// ------------------------------------------------------------
const Key: React.FC<{ label: string; onPress: () => void; grow?: boolean }>= ({ label, onPress, grow }) => (
  <button onClick={() => { vibe(5); onPress(); }} className={`h-16 text-2xl font-semibold rounded-xl border bg-background active:scale-[0.98] ${grow? 'col-span-2':''}`}>{label}</button>
);

export const NumberPad: React.FC<{ onInput: (ch: string) => void; onBackspace: () => void; onDone: () => void; allowDecimal?: boolean }>= ({ onInput, onBackspace, onDone, allowDecimal }) => (
  <div className="grid grid-cols-3 gap-3 p-3 select-none">
    {["1","2","3","4","5","6","7","8","9"].map(k => <Key key={k} label={k} onPress={()=>onInput(k)}/>) }
    {allowDecimal ? <Key label="," onPress={()=>onInput('.')}/> : <div/>}
    <Key label="0" onPress={()=>onInput('0')}/>
    <Key label="⌫" onPress={onBackspace}/>
    <Key label="Done" onPress={onDone} grow/>
  </div>
);

// ------------------------------------------------------------
// BandedInputTouch – tap a band OR use keypad. Large touch targets.
// ------------------------------------------------------------
interface BandedInputTouchProps { icon?: React.ReactNode; label: string; unit?: string; value?: string; placeholder?: string; bands?: Band[]; onChange: (val?: string) => void; keypadDecimal?: boolean; min?: number; max?: number; }

const ptsBadge = (pts: 0|1|2|3) => (<Badge className={pts===0? 'bg-emerald-600' : pts===1? 'bg-amber-500' : pts===2? 'bg-orange-600' : 'bg-rose-600'}>+{pts}</Badge>);

export const BandedInputTouch: React.FC<BandedInputTouchProps> = ({ icon, label, unit, value, placeholder, bands, onChange, keypadDecimal, min, max }) => {
  const [showPad, setShowPad] = useState(false);
  const points = bandPoints(parseNum(value), bands);
  const safeVal = value ?? '';
  const onTapBand = (b: Band) => { const mid = b.min !== undefined && b.max !== undefined ? (b.min + b.max)/2 : (b.min ?? b.max ?? 0); const str = keypadDecimal ? mid.toFixed(1) : String(Math.round(mid)); onChange(str); };
  const inputCh = (ch: string) => { let s = safeVal + ch; s = s.replace(/(\..*)\./, '$1'); onChange(s); };
  const backspace = () => onChange(safeVal.slice(0, -1) || undefined);
  const commit = () => setShowPad(false);
  const clampedVal = useMemo(() => { const n = parseNum(value); if (n === undefined) return undefined; if (min !== undefined && n < min) return String(min); if (max !== undefined && n > max) return String(max); return value; }, [value, min, max]);
  useEffect(() => { if (clampedVal !== value) onChange(clampedVal); }, [clampedVal]);
  return (
    <div className="rounded-2xl border p-3 bg-background">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-base font-medium">{icon}<span>{label}</span>{unit && <span className="text-muted-foreground">({unit})</span>}</div>
        <div className="flex items-center gap-2">{ptsBadge(points)}<button className="rounded-xl border px-3 py-2 text-xl min-w-[96px] text-right" onClick={()=>{ setShowPad(true); vibe(10); }}>{value ?? <span className="text-muted-foreground">{placeholder ?? '—'}</span>}</button></div>
      </div>
      {bands && (<div className="mt-3 grid grid-cols-6 gap-2">{bands.map((b, i) => (<button key={i} onClick={()=>{ onTapBand(b); vibe(5); }} className={`h-12 rounded-xl ${b.color} bg-opacity-80 text-white text-sm font-medium active:scale-[0.98]`}>{b.label ?? ''}</button>))}</div>)}
      {showPad && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-end" onClick={()=>setShowPad(false)}>
          <div className="w-full bg-background rounded-t-3xl shadow-xl" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 pt-3"><div className="text-sm text-muted-foreground">Enter {label}{unit? ` (${unit})`: ''}</div><Button variant="ghost" size="icon" onClick={()=>setShowPad(false)}><X className="h-5 w-5"/></Button></div>
            <NumberPad onInput={inputCh} onBackspace={backspace} onDone={commit} allowDecimal={keypadDecimal} />
          </div>
        </div>
      )}
    </div>
  );
};

// ------------------------------------------------------------
// ACVPU chips (large)
// ------------------------------------------------------------
const Chip: React.FC<{ active?: boolean; onClick?: () => void; children: React.ReactNode }>= ({ active, onClick, children }) => (<button onClick={()=>{ onClick?.(); vibe(5); }} className={`h-12 rounded-2xl border px-4 text-lg font-semibold active:scale-[0.98] ${active? 'bg-primary text-primary-foreground' : 'bg-background'}`}>{children}</button>);
export const ACVPUChips: React.FC<{ value?: 'A'|'C'|'V'|'P'|'U'; onChange: (v: 'A'|'C'|'V'|'P'|'U') => void }>= ({ value, onChange }) => (<div className="flex gap-2">{(['A','C','V','P','U'] as const).map(k => <Chip key={k} active={value===k} onClick={()=>onChange(k)}>{k}</Chip>)}</div>);

// ------------------------------------------------------------
// Observation Set Modal – full‑screen, finger‑first
// ------------------------------------------------------------
export interface Observation { id?: string; type: 'RR'|'SpO2'|'HR'|'BP'|'Temp'|'ACVPU'|'O2'; value: string; unit?: string; takenAt: string; recordedBy: string; phase?: 'triage'|'obs' }
export interface ObservationSetModalTouchProps { open: boolean; onOpenChange: (o: boolean) => void; patientName: string; defaults?: Partial<Record<'RR'|'SpO2'|'HR'|'SBP'|'Temp'|'ACVPU'|'O2', string>>; onSave: (observations: Observation[]) => void; recorder: string; isTriage?: boolean; }

export default function ObservationSetModalTouch({ open, onOpenChange, patientName, defaults, onSave, recorder, isTriage }: ObservationSetModalTouchProps) {
  const [rr, setRR] = useState<string|undefined>(defaults?.RR);
  const [spo2, setSpO2] = useState<string|undefined>(defaults?.SpO2);
  const [hr, setHR] = useState<string|undefined>(defaults?.HR);
  const [sbp, setSBP] = useState<string|undefined>(defaults?.SBP);
  const [temp, setTemp] = useState<string|undefined>(defaults?.Temp);
  const [acvpu, setACVPU] = useState<'A'|'C'|'V'|'P'|'U'|undefined>((defaults?.ACVPU as any) ?? 'A');
  const [o2Device, setO2Device] = useState<string|undefined>(defaults?.O2 ?? 'Room air');
  const [o2Lpm, setO2Lpm] = useState<string|undefined>(flowFrom(defaults?.O2));
  const [scale2, setScale2] = useState<boolean>(false);

  // haptic + refresh defaults when the modal opens
  useEffect(()=>{ if(!open) return; vibe(10); setRR(defaults?.RR); setSpO2(defaults?.SpO2); setHR(defaults?.HR); setSBP(defaults?.SBP); setTemp(defaults?.Temp); setACVPU((defaults?.ACVPU as any) ?? 'A'); setO2Device(defaults?.O2 ?? 'Room air'); setO2Lpm(flowFrom(defaults?.O2)); }, [open]);

  // per‑vital points + oxygen therapy points (+2 when on supplemental O2)
  const rrPts = bandPoints(parseNum(rr), NZ_POLICY.rr);
  const spo2Pts = bandPoints(parseNum(spo2), scale2? NZ_POLICY.spo2_scale1.map(b=>({...b, min: b.min? b.min-2: undefined, max: b.max? b.max-2: undefined})) as any : NZ_POLICY.spo2_scale1);
  const sbpPts = bandPoints(parseNum(sbp), NZ_POLICY.sbp);
  const hrPts = bandPoints(parseNum(hr), NZ_POLICY.hr);
  const tempPts = bandPoints(parseNum(temp), NZ_POLICY.temp);
  const acvpuPts = (NZ_POLICY.acvpu[acvpu ?? 'A'] ?? 0) as 0|3;
  const o2Pts = o2Device && o2Device !== 'Room air' ? 2 : 0;
  const total = rrPts + spo2Pts + sbpPts + hrPts + tempPts + (acvpuPts as number) + o2Pts;

  const canSave = rr || spo2 || hr || sbp || temp || acvpu;

  const applyDefaults = () => {
    setRR(defaults?.RR); setSpO2(defaults?.SpO2); setHR(defaults?.HR); setSBP(defaults?.SBP); setTemp(defaults?.Temp); setACVPU((defaults?.ACVPU as any) ?? 'A'); setO2Device(defaults?.O2 ?? 'Room air'); setO2Lpm(flowFrom(defaults?.O2));
  };
  const clearAll = () => {
    setRR(undefined); setSpO2(undefined); setHR(undefined); setSBP(undefined); setTemp(undefined); setACVPU('A'); setO2Device('Room air'); setO2Lpm(undefined);
  };

  const commit = () => {
    const ts = new Date().toISOString();
    const list: Observation[] = [];
    if (rr)   list.push({ type:'RR',   value: rr,   unit:'/min', takenAt: ts, recordedBy: recorder, phase: isTriage? 'triage':'obs' });
    if (spo2) list.push({ type:'SpO2', value: spo2, unit:'%',   takenAt: ts, recordedBy: recorder, phase: isTriage? 'triage':'obs' });
    if (hr)   list.push({ type:'HR',   value: hr,   unit:'bpm', takenAt: ts, recordedBy: recorder, phase: isTriage? 'triage':'obs' });
    if (sbp)  list.push({ type:'BP',   value: `${sbp}/?`, unit:'mmHg', takenAt: ts, recordedBy: recorder, phase: isTriage? 'triage':'obs' });
    if (temp) list.push({ type:'Temp', value: temp, unit:'°C',  takenAt: ts, recordedBy: recorder, phase: isTriage? 'triage':'obs' });
    if (acvpu) list.push({ type:'ACVPU', value: acvpu, takenAt: ts, recordedBy: recorder, phase: isTriage? 'triage':'obs' });
    if (o2Device !== 'Room air') {
      const flow = o2Lpm ? ` ${o2Lpm} L/min` : '';
      list.push({ type:'O2', value: `${o2Device}${flow}`, takenAt: ts, recordedBy: recorder, phase: isTriage? 'triage':'obs' });
    }
    onSave(list);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 max-w-[100vw] w-[100vw] sm:max-w-[420px] sm:rounded-2xl rounded-none h-[100vh] sm:h-auto flex flex-col">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="text-xl">Record Observations</DialogTitle>
          <div className="text-sm text-muted-foreground">{patientName} • {isTriage ? 'Triage' : 'Ongoing Care'}</div>
        </DialogHeader>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            <BandedInputTouch icon={<Waves className="h-5 w-5"/>} label="Respiratory Rate" unit="bpm" value={rr} placeholder="0" bands={NZ_POLICY.rr} onChange={setRR} min={0} max={60} />
            <BandedInputTouch icon={<Droplets className="h-5 w-5"/>} label="SpO₂" unit="%" value={spo2} placeholder="0" bands={scale2? NZ_POLICY.spo2_scale1.map(b=>({...b, min: b.min? b.min-2: undefined, max: b.max? b.max-2: undefined})) as any : NZ_POLICY.spo2_scale1} onChange={setSpO2} min={70} max={100} />
            <BandedInputTouch icon={<HeartPulse className="h-5 w-5"/>} label="Heart Rate" unit="bpm" value={hr} placeholder="0" bands={NZ_POLICY.hr} onChange={setHR} min={0} max={300} />
            <BandedInputTouch icon={<ShieldAlert className="h-5 w-5"/>} label="Systolic BP" unit="mmHg" value={sbp} placeholder="0" bands={NZ_POLICY.sbp} onChange={setSBP} min={50} max={300} />
            <BandedInputTouch icon={<Thermometer className="h-5 w-5"/>} label="Temperature" unit="°C" value={temp} placeholder="0.0" bands={NZ_POLICY.temp} onChange={setTemp} keypadDecimal min={30} max={45} />

            <div className="rounded-2xl border p-3 bg-background">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-base font-medium">
                  <Activity className="h-5 w-5"/>
                  <span>ACVPU</span>
                </div>
                <Badge className={acvpuPts===0? 'bg-emerald-600' : 'bg-rose-600'}>+{acvpuPts}</Badge>
              </div>
              <ACVPUChips value={acvpu} onChange={setACVPU} />
            </div>

            <div className="rounded-2xl border p-3 bg-background">
              <div className="text-base font-medium mb-3">Oxygen Therapy</div>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {['Room air', 'Nasal cannula', 'Face mask', 'Non-rebreather'].map(dev => (
                  <button key={dev} onClick={()=>setO2Device(dev)} className={`h-12 rounded-xl border text-sm font-medium active:scale-[0.98] ${o2Device===dev? 'bg-primary text-primary-foreground' : 'bg-background'}`}>{dev}</button>
                ))}
              </div>
              {o2Device !== 'Room air' && (
                <BandedInputTouch label="Flow Rate" unit="L/min" value={o2Lpm} placeholder="0" onChange={setO2Lpm} min={0} max={15} />
              )}
            </div>

            {/* EWS Score */}
            <div className="rounded-2xl border p-4 bg-muted/50">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold">Early Warning Score</span>
                <div className={`text-2xl font-bold px-4 py-2 rounded-xl ${total >= 7 ? 'bg-rose-600 text-white' : total >= 5 ? 'bg-amber-500 text-white' : total >= 3 ? 'bg-amber-400 text-black' : 'bg-emerald-500 text-white'}`}>
                  {total}
                </div>
              </div>
              <div className="mt-3 grid grid-cols-6 gap-2 text-xs">
                <div className="text-center">RR: {rrPts}</div>
                <div className="text-center">SpO₂: {spo2Pts}</div>
                <div className="text-center">HR: {hrPts}</div>
                <div className="text-center">SBP: {sbpPts}</div>
                <div className="text-center">Temp: {tempPts}</div>
                <div className="text-center">ACVPU: {acvpuPts}</div>
              </div>
              {o2Pts > 0 && <div className="mt-2 text-xs text-center text-orange-600">+{o2Pts} (O₂ therapy)</div>}
            </div>
          </div>
        </ScrollArea>

        <div className="p-4 flex gap-3">
          <Button variant="outline" size="sm" onClick={applyDefaults}>Defaults</Button>
          <Button variant="outline" size="sm" onClick={clearAll}>Clear</Button>
          <Button onClick={commit} disabled={!canSave} className="flex-1">{isTriage ? 'Complete Triage' : 'Save Observations'}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}