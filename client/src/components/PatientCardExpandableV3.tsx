import React, { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Activity,
  AlertTriangle,
  ClipboardCheck,
  FileText,
  HeartPulse,
  Pill,
  Stethoscope,
  Thermometer,
  ChevronDown,
  UserCircle2,
  ListChecks,
  TestTubes,
  BrainCircuit,
  Bell,
  XCircle,
} from "lucide-react";

import VitalsTimeline, { Observation as Obs, CareEvent } from "@/components/VitalsTimeline";
import ObservationSetModalTouch, { type Observation as TouchObservation } from "@/components/ObservationSetModalTouch";
import { buildObsDefaults } from "@/lib/obsDefaults";

// ---------- Types ----------
export type Role = "reception" | "charge" | "rn" | "md";
export type ATS = 1 | 2 | 3 | 4 | 5;

export interface Observation extends Obs {}

export interface EWS {
  score: number;
  riskLevel: "low" | "medium" | "high";
  calculatedAt: string;
}

export interface TaskItem {
  id: string;
  description: string;
  dueAt?: string; // demo uses dueAt as a proxy for completion if status==='done'
  status: "pending" | "done" | "overdue";
  source: "auto" | "user" | "orderSet";
  type?: "obs" | string;
}

export interface DiagnosticOrder {
  id: string;
  kind: "Lab" | "Imaging" | "ECG";
  name: string;
  status: "ordered" | "in-progress" | "resulted" | "canceled";
  orderedAt: string;
  resultedAt?: string;
  summary?: string;
}

export interface NoteEntry {
  id: string;
  authorRole: Role;
  author: string;
  createdAt: string;
  body: string;
}

export interface PatientFull {
  id: string;
  name: string;
  age: number;
  sex: "M" | "F" | "X";
  arrival: string;
  ats?: ATS;
  ews: EWS;
  chiefComplaint: string;
  location: string;
  covid?: "neg" | "pos" | "unk";
  observations: Observation[];
  tasks: TaskItem[];
  diagnostics: DiagnosticOrder[];
  notes: NoteEntry[];
  assessment?: { hx?: string; exam?: string; impression?: string };
  insights?: string[];
  readyForDisposition?: boolean;
}

// ---------- Helpers ----------
const riskColor = (risk: EWS["riskLevel"]) => ({ low: "bg-green-600", medium: "bg-yellow-500", high: "bg-red-600" }[risk]);
const fmtTime = (iso?: string) => (iso ? new Date(iso).toLocaleTimeString() : "—");

export type Lane = "waiting" | "triage" | "roomed" | "observation";
export type Stage = "arrival" | "triage" | "roomed" | "observation" | "dispo";
const deriveLane = (loc: string): Lane => {
  const x = (loc || "").toLowerCase();
  if (x.includes("triage")) return "triage";
  if (x.startsWith("obs") || x.includes("observation")) return "observation";
  if (x.includes("room") || x.startsWith("resus") || x.startsWith("lb")) return "roomed";
  return "waiting";
};
const stageFor = (p: PatientFull): Stage => {
  if (!p.ats) return "arrival";
  const lane = deriveLane(p.location || "");
  if (lane === "triage") return "triage";
  if (p.readyForDisposition) return "dispo";
  if (lane === "observation") return "observation";
  if (lane === "roomed") return "roomed";
  return "arrival";
};

const QuickBadge: React.FC<{ label: string; className?: string; title?: string; icon?: React.ReactNode }>= ({ label, className = "", title, icon }) => (
  <div title={title} className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium bg-muted ${className}`}>
    {icon}
    <span>{label}</span>
  </div>
);

// Build sepsis bundle care events from patient data (demo heuristics)
function buildSepsisEvents(p: PatientFull): CareEvent[] {
  const events: CareEvent[] = [];
  const fallback = new Date(new Date(p.arrival).getTime() + 5*60000).toISOString();
  const push = (t?: string, label?: string, kind?: CareEvent['kind']) => {
    if (!label) return;
    events.push({ t: t ?? fallback, label, kind });
  };
  // Diagnostics
  p.diagnostics.forEach(d => {
    const name = d.name.toLowerCase();
    if (name.includes('lactate')) {
      push(d.orderedAt, 'Lactate', 'lactate');
      if (d.resultedAt) push(d.resultedAt, 'Lactate result', 'lactate');
    }
    if (name.includes('blood culture')) push(d.orderedAt, 'Cultures', 'cultures');
  });
  // Tasks
  p.tasks.forEach(t => {
    const s = t.description.toLowerCase();
    if (/(antibiotic|antibiotics|abx)/.test(s)) push(t.dueAt, 'ABX', 'abx');
    if (/(fluid|bolus)/.test(s)) push(t.dueAt, 'Fluids', 'fluids');
  });
  // Sort by time
  return events.sort((a,b)=> a.t.localeCompare(b.t));
}

export interface PatientCardProps {
  role: Role;
  patient: PatientFull;
  availableRooms?: { id: string; name: string; suitability?: string }[];
  onOpenChart?: (patientId: string) => void;
  onMarkTask?: (patientId: string, taskId: string, status: TaskItem["status"]) => void;
  onOrderSet?: (patientId: string, setName: "Sepsis" | "Stroke" | "Chest Pain") => void;
  onDisposition?: (patientId: string, disp: "Admit" | "Discharge" | "Refer") => void;
  onStartTriage?: (patientId: string) => void;
  onAssignRoom?: (patientId: string, roomId: string) => void;
  /** Persist observations to your store. */
  onAddObservations?: (patientId: string, obs: TouchObservation[]) => void;
}

export default function PatientCardExpandableV3({ role, patient, onOpenChart, onMarkTask, onOrderSet, onDisposition, onStartTriage, onAssignRoom, availableRooms, onAddObservations }: PatientCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [roomDialogOpen, setRoomDialogOpen] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string | undefined>();
  const [obsOpen, setObsOpen] = useState(false);

  const lane = useMemo(() => deriveLane(patient.location), [patient.location]);
  const stage = useMemo(() => stageFor(patient), [patient]);

  const lastObs = useMemo(() => patient.observations.slice().sort((a,b)=>a.takenAt.localeCompare(b.takenAt)).at(-1), [patient.observations]);
  const overdueCount = useMemo(() => patient.tasks.filter(t=>t.status==='overdue').length, [patient.tasks]);
  
  const defaults = useMemo(
    () => buildObsDefaults(patient.observations as any),
    [patient.observations]
  );

  const showEwsBadge = stage !== 'arrival' && ['HR','BP','Temp','RR','SpO2'].every(k => patient.observations.some(o=>o.type===k));
  const showLastObs = stage !== 'arrival';
  const showTaskBadge = stage !== 'arrival' && patient.tasks.some(t=>t.status!=='done');

  // Alert ladder ring
  const cardRing = useMemo(() => {
    if (overdueCount>0 && patient.ews.riskLevel==='high') return 'ring-2 ring-red-500/40';
    if (overdueCount>0) return 'ring-1 ring-amber-400/40';
    if (patient.ews.riskLevel==='high') return 'ring-1 ring-red-400/30';
    return '';
  }, [overdueCount, patient.ews]);

  const primaryActions = (
    <>
      {stage==='arrival' && (role==='rn' || role==='charge') && (
        <Button size="sm" onClick={(e)=>{ e.stopPropagation(); onStartTriage?.(patient.id); setObsOpen(true); }}>Start Triage</Button>
      )}
      {stage==='triage' && role==='charge' && (
        <Dialog open={roomDialogOpen} onOpenChange={setRoomDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="secondary" onClick={(e)=> e.stopPropagation()}>Assign Room</Button>
          </DialogTrigger>
          <DialogContent onClick={(e)=> e.stopPropagation()}>
            <DialogHeader><DialogTitle>Assign Room</DialogTitle></DialogHeader>
            <div className="space-y-2">
              <Label>Room</Label>
              <Select value={selectedRoomId} onValueChange={setSelectedRoomId}>
                <SelectTrigger><SelectValue placeholder="Select a room" /></SelectTrigger>
                <SelectContent>
                  {(availableRooms ?? []).map(r => (
                    <SelectItem key={r.id} value={r.id}>{r.name}{r.suitability ? ` • ${r.suitability}` : ''}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={()=> setRoomDialogOpen(false)}>Cancel</Button>
                <Button onClick={() => { if(selectedRoomId){ onAssignRoom?.(patient.id, selectedRoomId); setRoomDialogOpen(false);} }}>Assign</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
      {stage!=='arrival' && (role==='rn' || role==='charge') && (
        <Button size="sm" variant="secondary" onClick={(e)=>{ e.stopPropagation(); setObsOpen(true); }}>Record Obs</Button>
      )}
      {stage==='roomed' && role==='md' && (
        <Button size="sm" onClick={(e)=>{ e.stopPropagation(); setExpanded(true); }}>Quick Order Sets</Button>
      )}
      {stage==='dispo' && role==='md' && (
        <Button size="sm" onClick={(e)=>{ e.stopPropagation(); setExpanded(true); }}>Disposition</Button>
      )}
    </>
  );

  return (
    <Card className={`w-full border-2 hover:border-primary/50 transition-colors rounded-2xl ${cardRing}`}>
      {/* Header Row (Clickable) */}
      <div role="button" tabIndex={0} onClick={() => setExpanded(!expanded)} onKeyDown={(e)=>{ if(e.key==='Enter' || e.key===' ') { e.preventDefault(); setExpanded(v=>!v); } }} className="flex items-center justify-between gap-3 p-4 cursor-pointer" aria-expanded={expanded} aria-controls={`patient-${patient.id}-body`}>
        <div className="flex items-center gap-4 min-w-0">
          <UserCircle2 className="h-8 w-8" />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg truncate">{patient.name} <span className="text-muted-foreground">• {patient.age} {patient.sex}</span></CardTitle>
              {patient.ats ? <Badge variant="outline">ATS {patient.ats}</Badge> : null}
              {showEwsBadge && (<div className={`text-white text-xs px-2 py-1 rounded ${riskColor(patient.ews.riskLevel)}`}>EWS {patient.ews.score}</div>)}
              {patient.covid && <QuickBadge label={`COVID ${patient.covid.toUpperCase()}`} className="bg-red-50" />}
            </div>
            <div className="text-sm text-muted-foreground truncate">{patient.chiefComplaint}{stage!=='arrival' && <> • Arrived {new Date(patient.arrival).toLocaleTimeString()}</>} • {patient.location}</div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {showLastObs && lastObs && (<QuickBadge icon={<Activity className="h-3 w-3"/>} label={`Last obs ${fmtTime(lastObs.takenAt)}`} />)}
              {showTaskBadge && (<QuickBadge icon={<ListChecks className="h-3 w-3"/>} label={`${patient.tasks.filter(t=>t.status==='pending').length} tasks`} />)}
              {overdueCount>0 && (<QuickBadge icon={<Bell className="h-3 w-3"/>} className="bg-red-100" label={`${overdueCount} overdue`} />)}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {primaryActions}
          <Button variant="outline" size="sm" onClick={(e)=>{e.stopPropagation(); onOpenChart?.(patient.id);}}>Open Chart</Button>
          <Button variant="ghost" size="icon" aria-label="Expand"><ChevronDown className={`h-5 w-5 transition-transform ${expanded? 'rotate-180': ''}`} /></Button>
        </div>
      </div>

      {/* Body */}
      {expanded && (
        <div id={`patient-${patient.id}-body`} className="px-4 pb-4">
          <Separator className="mb-3"/>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="flex flex-wrap">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              {stage==='triage' && <TabsTrigger value="triage">Triage</TabsTrigger>}
              {(stage==='roomed' || stage==='observation' || stage==='dispo') && <TabsTrigger value="assessment">Assessment</TabsTrigger>}
              {stage!=='arrival' && <TabsTrigger value="vitals">Vitals</TabsTrigger>}
              {patient.notes.length>0 && <TabsTrigger value="notes">Notes</TabsTrigger>}
              {(patient.diagnostics.length>0 || role==='md') && <TabsTrigger value="diagnostics">Diagnostics</TabsTrigger>}
              {(patient.tasks.length>0 || stage!=='arrival') && <TabsTrigger value="tasks">Tasks</TabsTrigger>}
              {role === "md" && (stage==='roomed' || stage==='observation') && <TabsTrigger value="orders">Quick Orders</TabsTrigger>}
              {role === "md" && patient.readyForDisposition && <TabsTrigger value="dispo">Disposition</TabsTrigger>}
            </TabsList>

            {/* OVERVIEW */}
            <TabsContent value="overview">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
                <Card className="lg:col-span-5">
                  <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><HeartPulse className="h-4 w-4"/>EWS & Trends</CardTitle></CardHeader>
                  <CardContent>
                    {showEwsBadge ? (
                      <div className="flex items-center gap-3">
                        <div className={`text-white rounded-lg px-3 py-2 ${riskColor(patient.ews.riskLevel)}`}>EWS {patient.ews.score}</div>
                        <div className="text-sm text-muted-foreground">as of {fmtTime(patient.ews.calculatedAt)}</div>
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">EWS will appear after core vitals are captured.</div>
                    )}
                    <div className="mt-3 text-sm text-muted-foreground">(Sparkline placeholder for HR/BP/Temp/RR/SpO₂ last 6h)</div>
                  </CardContent>
                </Card>
                <Card className="lg:col-span-7">
                  <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><ListChecks className="h-4 w-4"/>Active Tasks</CardTitle></CardHeader>
                  <CardContent>
                    <ScrollArea className="h-40 pr-2">
                      <ul className="space-y-2">
                        {patient.tasks.map(t => (
                          <li key={t.id} className="flex items-center justify-between rounded-md border p-2">
                            <div className="min-w-0">
                              <div className="text-sm truncate">{t.description}</div>
                              <div className="text-xs text-muted-foreground">Due {fmtTime(t.dueAt)} • {t.source}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={t.status==='done' ? 'default' : t.status==='overdue' ? 'destructive' : 'secondary'}>{t.status}</Badge>
                              {(/repeat\s*obs/i.test(t.description) || t.type==='obs') && (
                                <Button size="sm" onClick={()=> setObsOpen(true)}>Record now</Button>
                              )}
                              <Button size="sm" variant="outline" onClick={()=>onMarkTask?.(patient.id, t.id, t.status === 'done' ? 'pending' : 'done')}>{t.status==='done' ? 'Undo' : 'Done'}</Button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* TRIAGE */}
            <TabsContent value="triage">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Stethoscope className="h-4 w-4"/>Triage Summary</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div><strong>ATS:</strong> {patient.ats ?? '—'}</div>
                  <div><strong>Chief complaint:</strong> {patient.chiefComplaint}</div>
                  <div><strong>Arrived:</strong> {new Date(patient.arrival).toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">(Vitals capture uses the touch modal.)</div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ASSESSMENT */}
            <TabsContent value="assessment">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><FileText className="h-4 w-4"/>Assessment</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                  <div><Label>History</Label><div className="mt-1 rounded-md border p-2 min-h-[64px] whitespace-pre-wrap">{patient.assessment?.hx ?? "—"}</div></div>
                  <div><Label>Exam</Label><div className="mt-1 rounded-md border p-2 min-h-[64px] whitespace-pre-wrap">{patient.assessment?.exam ?? "—"}</div></div>
                  <div><Label>Impression</Label><div className="mt-1 rounded-md border p-2 min-h-[64px] whitespace-pre-wrap">{patient.assessment?.impression ?? "—"}</div></div>
                </CardContent>
              </Card>
              {patient.insights && patient.insights.length>0 && (
                <div className="mt-3">
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><BrainCircuit className="h-4 w-4"/>Insights</CardTitle></CardHeader>
                    <CardContent>
                      <ul className="list-disc pl-5 text-sm space-y-1">{patient.insights.map((s, i)=> <li key={i}>{s}</li>)}</ul>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            {/* VITALS */}
            <TabsContent value="vitals">
              <VitalsTimeline observations={patient.observations} arrival={patient.arrival} events={buildSepsisEvents(patient)} />
            </TabsContent>

            {/* NOTES */}
            <TabsContent value="notes">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><FileText className="h-4 w-4"/>Notes</CardTitle></CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {patient.notes.slice().sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).map(n => (
                      <li key={n.id} className="rounded-md border p-2">
                        <div className="text-xs text-muted-foreground">{n.author} • {n.authorRole} • {new Date(n.createdAt).toLocaleString()}</div>
                        <div className="text-sm whitespace-pre-wrap mt-1">{n.body}</div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>

            {/* DIAGNOSTICS */}
            <TabsContent value="diagnostics">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><TestTubes className="h-4 w-4"/>Diagnostics</CardTitle></CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <div className="grid grid-cols-6 gap-2 px-3 py-2 text-xs font-semibold bg-muted/50">
                      <div>Kind</div><div>Name</div><div>Status</div><div>Ordered</div><div>Resulted</div><div>Result</div>
                    </div>
                    <ScrollArea className="max-h-56">
                      <ul>
                        {patient.diagnostics.map(d => (
                          <li key={d.id} className="grid grid-cols-6 gap-2 px-3 py-2 text-sm border-t">
                            <div>{d.kind}</div>
                            <div>{d.name}</div>
                            <div>{d.status}</div>
                            <div>{fmtTime(d.orderedAt)}</div>
                            <div>{fmtTime(d.resultedAt)}</div>
                            <div className="truncate" title={d.summary}>{d.summary ?? "—"}</div>
                          </li>
                        ))}
                      </ul>
                    </ScrollArea>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TASKS */}
            <TabsContent value="tasks">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><ClipboardCheck className="h-4 w-4"/>Task Board</CardTitle></CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {patient.tasks.map(t => (
                      <li key={t.id} className="flex items-center justify-between rounded-md border p-2">
                        <div className="min-w-0">
                          <div className="text-sm truncate">{t.description}</div>
                          <div className="text-xs text-muted-foreground">Due {fmtTime(t.dueAt)} • {t.source}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={t.status==='done' ? 'default' : t.status==='overdue' ? 'destructive' : 'secondary'}>{t.status}</Badge>
                          {(/repeat\s*obs/i.test(t.description) || t.type==='obs') && (
                            <Button size="sm" onClick={()=> setObsOpen(true)}>Record now</Button>
                          )}
                          <Button size="sm" variant="outline" onClick={()=>onMarkTask?.(patient.id, t.id, t.status === 'done' ? 'pending' : 'done')}>{t.status==='done' ? 'Undo' : 'Done'}</Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>

            {/* MD‑ONLY: QUICK ORDERS */}
            {(role === "md" && (stage==='roomed' || stage==='observation')) && (
              <TabsContent value="orders">
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Pill className="h-4 w-4"/>Quick Order Sets</CardTitle></CardHeader>
                  <CardContent className="flex flex-wrap gap-2">
                    {["Sepsis","Stroke","Chest Pain"].map((setName)=> (
                      <Button key={setName} variant="secondary" onClick={()=>onOrderSet?.(patient.id, setName as any)}>{setName}</Button>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {/* MD‑ONLY: DISPOSITION */}
            {(role === "md" && patient.readyForDisposition) && (
              <TabsContent value="dispo">
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><XCircle className="h-4 w-4"/>Disposition</CardTitle></CardHeader>
                  <CardContent className="flex flex-wrap gap-2">
                    {["Admit","Discharge","Refer"].map(d => (
                      <Button key={d} onClick={()=>onDisposition?.(patient.id, d as any)}>{d}</Button>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>

          {/* Touch-first Observation Modal */}
          <ObservationSetModalTouch
            open={obsOpen}
            onOpenChange={setObsOpen}
            patientName={`${patient.name} • ${patient.age} ${patient.sex}`}
            recorder={role.toUpperCase()}
            isTriage={stage==='triage'}
            onSave={(list)=>{
              onAddObservations?.(patient.id, list);
            }}
          />
        </div>
      )}
    </Card>
  );
}