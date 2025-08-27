import React, { useMemo, useState, useEffect } from "react";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Activity,
  Bell,
  ClipboardCheck,
  FileText,
  HeartPulse,
  MoreHorizontal,
  Pill,
  Stethoscope,
  Thermometer,
  TimerReset,
  XCircle,
  ChevronDown,
  UserCircle2,
  AlertTriangle,
  ListChecks,
  TestTubes,
  BrainCircuit,
} from "lucide-react";

// Import our existing Encounter type
import { Encounter } from "@/shared/schema";

/**
 * Phase‑2 Scaffold: Clickable + Expandable Patient Card
 * - Role aware (Charge RN vs MD)
 * - Shows Triage, Assessment, Vitals timeline, Notes, Diagnostics, Actions, Insights
 * - Light alerts + Task Board per patient
 * - EWS badge auto color from score
 */

// ---------- Types ----------
export type Role = "reception" | "charge" | "rn" | "md";

export type ATS = 1 | 2 | 3 | 4 | 5;

export interface Observation {
  id: string;
  type: "HR" | "BP" | "Temp" | "RR" | "SpO2" | "GCS" | "Pain";
  value: string; // store canonical string; parse as needed
  unit?: string;
  takenAt: string; // ISO time
  recordedBy: string;
}

export interface EWS {
  score: number;
  riskLevel: "low" | "medium" | "high";
  calculatedAt: string;
}

export interface TaskItem {
  id: string;
  description: string;
  dueAt?: string;
  status: "pending" | "done" | "overdue";
  source: "auto" | "user" | "orderSet";
}

export interface DiagnosticOrder {
  id: string;
  kind: "Lab" | "Imaging" | "ECG";
  name: string;
  status: "ordered" | "in-progress" | "resulted" | "canceled";
  orderedAt: string;
  resultedAt?: string;
  summary?: string; // brief result capsule
}

export interface NoteEntry {
  id: string;
  authorRole: Role;
  author: string;
  createdAt: string;
  body: string;
}

// ---------- Helpers ----------
const riskColor = (risk: EWS["riskLevel"]) => {
  switch (risk) {
    case "low":
      return "bg-green-600";
    case "medium":
      return "bg-yellow-500";
    case "high":
      return "bg-red-600";
  }
};

const statusBadge = (s: TaskItem["status"]) => {
  if (s === "pending") return <Badge variant="secondary">Pending</Badge>;
  if (s === "overdue") return <Badge className="bg-red-600">Overdue</Badge>;
  return <Badge className="bg-green-600">Done</Badge>;
};

const fmtTime = (iso?: string) => (iso ? new Date(iso).toLocaleTimeString() : "—");

// Basic EWS color inference if only score is available
const ewsToRisk = (score: number): EWS["riskLevel"] => {
  if (score >= 7) return "high";
  if (score >= 4) return "medium";
  return "low";
};

// Convert Encounter to observations
const encounterToObservations = (encounter: Encounter): Observation[] => {
  const observations: Observation[] = [];
  const timestamp = new Date(encounter.arrivalTime).toISOString();
  
  if (encounter.triageHr) observations.push({ id: `hr-${encounter.id}`, type: "HR", value: encounter.triageHr.toString(), unit: "bpm", takenAt: timestamp, recordedBy: "Triage" });
  if (encounter.triageRr) observations.push({ id: `rr-${encounter.id}`, type: "RR", value: encounter.triageRr.toString(), unit: "/min", takenAt: timestamp, recordedBy: "Triage" });
  if (encounter.triageBpSys && encounter.triageBpDia) observations.push({ id: `bp-${encounter.id}`, type: "BP", value: `${encounter.triageBpSys}/${encounter.triageBpDia}`, unit: "mmHg", takenAt: timestamp, recordedBy: "Triage" });
  if (encounter.triageTemp) observations.push({ id: `temp-${encounter.id}`, type: "Temp", value: encounter.triageTemp.toString(), unit: "°C", takenAt: timestamp, recordedBy: "Triage" });
  if (encounter.triageSpo2) observations.push({ id: `spo2-${encounter.id}`, type: "SpO2", value: encounter.triageSpo2.toString(), unit: "%", takenAt: timestamp, recordedBy: "Triage" });
  
  return observations;
};

// Calculate EWS from vital signs
const calculateEWS = (observations: Observation[]): EWS => {
  let score = 0;
  
  // Simple EWS calculation based on observations
  observations.forEach(obs => {
    const value = parseFloat(obs.value.split('/')[0]); // Handle BP format like "120/80"
    
    switch (obs.type) {
      case "HR":
        if (value <= 40 || value >= 131) score += 3;
        else if ((value >= 41 && value <= 50) || (value >= 111 && value <= 130)) score += 2;
        else if ((value >= 51 && value <= 90) || (value >= 101 && value <= 110)) score += 1;
        break;
      case "RR":
        if (value <= 8 || value >= 25) score += 3;
        else if ((value >= 9 && value <= 11) || (value >= 21 && value <= 24)) score += 2;
        else if (value >= 12 && value <= 20) score += 0;
        break;
      case "SpO2":
        if (value <= 91) score += 3;
        else if (value >= 92 && value <= 93) score += 2;
        else if (value >= 94 && value <= 95) score += 1;
        break;
    }
  });
  
  return {
    score,
    riskLevel: ewsToRisk(score),
    calculatedAt: new Date().toISOString()
  };
};

// Generate tasks based on encounter status
const generateTasks = (encounter: Encounter): TaskItem[] => {
  const tasks: TaskItem[] = [];
  const now = new Date();
  
  // Basic task generation based on lane and status
  if (encounter.lane === "triage") {
    tasks.push({
      id: `triage-complete-${encounter.id}`,
      description: "Complete triage assessment",
      dueAt: new Date(now.getTime() + 15 * 60 * 1000).toISOString(), // 15 min
      status: "pending",
      source: "auto"
    });
  }
  
  if (encounter.lane === "roomed") {
    tasks.push({
      id: `vitals-${encounter.id}`,
      description: "Repeat vital signs",
      dueAt: new Date(now.getTime() + 30 * 60 * 1000).toISOString(), // 30 min
      status: "pending",
      source: "auto"
    });
  }
  
  if (encounter.lane === "diagnostics") {
    tasks.push({
      id: `results-${encounter.id}`,
      description: "Check diagnostic results",
      dueAt: new Date(now.getTime() + 60 * 60 * 1000).toISOString(), // 1 hour
      status: encounter.resultsStatus === "complete" ? "done" : "pending",
      source: "auto"
    });
  }
  
  return tasks;
};

// ---------- Component ----------

type Lane = "waiting" | "triage" | "roomed";
const deriveLane = (loc: string): Lane => {
  const x = (loc || "").toLowerCase();
  if (x.includes("triage")) return "triage";
  if (x.includes("room")) return "roomed";
  return "waiting";
};

export interface PatientCardExpandableProps {
  role: Role;
  encounter: Encounter;
  onOpenChart?: (patientId: string) => void;
  onMarkTask?: (patientId: string, taskId: string, status: TaskItem["status"]) => void;
  onOrderSet?: (patientId: string, setName: "Sepsis" | "Stroke" | "Chest Pain") => void;
  onDisposition?: (patientId: string, disp: "Admit" | "Discharge" | "Refer") => void;
  onStartTriage?: (patientId: string) => void;
  onAssignRoom?: (patientId: string, roomId: string) => void;
  availableRooms?: { id: string; name: string; suitability?: string }[];
}

const QuickBadge: React.FC<{ label: string; className?: string; title?: string; icon?: React.ReactNode }>= ({ label, className = "", title, icon }) => (
  <div title={title} className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium bg-muted ${className}`}>
    {icon}
    <span>{label}</span>
  </div>
);

export default function PatientCardExpandable({ role, encounter, onOpenChart, onMarkTask, onOrderSet, onDisposition, onStartTriage, onAssignRoom, availableRooms }: PatientCardExpandableProps) {
  const [expanded, setExpanded] = useState(false);
  const [roomDialogOpen, setRoomDialogOpen] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string | undefined>(undefined);
  
  const lane = useMemo(() => deriveLane(encounter.room || encounter.lane), [encounter.room, encounter.lane]);
  const observations = useMemo(() => encounterToObservations(encounter), [encounter]);
  const ews = useMemo(() => calculateEWS(observations), [observations]);
  const tasks = useMemo(() => generateTasks(encounter), [encounter]);
  const lastObs = useMemo(() => observations.slice().sort((a,b)=>a.takenAt.localeCompare(b.takenAt)).at(-1), [observations]);
  const overdueCount = useMemo(() => tasks.filter(t=>t.status==='overdue').length, [tasks]);

  // Mock data for demo purposes
  const notes: NoteEntry[] = [
    {
      id: `note-1-${encounter.id}`,
      authorRole: "rn",
      author: "Jane Smith RN",
      createdAt: new Date(encounter.arrivalTime).toISOString(),
      body: encounter.triageNotes || "Initial assessment completed. Patient stable."
    }
  ];

  const diagnostics: DiagnosticOrder[] = encounter.lane === "diagnostics" || encounter.lane === "review" ? [
    {
      id: `lab-${encounter.id}`,
      kind: "Lab",
      name: "CBC, BMP, Lactate",
      status: encounter.resultsStatus === "complete" ? "resulted" : "in-progress",
      orderedAt: new Date(encounter.arrivalTime).toISOString(),
      summary: encounter.resultsStatus === "complete" ? "WBC 12.5, Lactate 2.1" : undefined
    }
  ] : [];

  // Accessibility: expand/collapse with Enter/Space
  const onKeyToggle: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setExpanded(prev => !prev);
    }
  };

  return (
    <Card className="w-full border-2 hover:border-primary/50 transition-colors rounded-2xl">
      {/* Header Row (Clickable) */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setExpanded(!expanded)}
        onKeyDown={onKeyToggle}
        className="flex items-center justify-between gap-3 p-4 cursor-pointer"
        aria-expanded={expanded}
        aria-controls={`patient-${encounter.id}-body`}
        data-testid={`card-patient-${encounter.id}`}
      >
        <div className="flex items-center gap-4 min-w-0">
          <UserCircle2 className="h-8 w-8" />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg truncate">{encounter.name} <span className="text-muted-foreground">• {encounter.age} {encounter.sex}</span></CardTitle>
              <Badge variant="outline">ATS {encounter.ats}</Badge>
              <div className={`text-white text-xs px-2 py-1 rounded ${riskColor(ews.riskLevel)}`}>
                EWS {ews.score}
              </div>
            </div>
            <div className="text-sm text-muted-foreground truncate">
              {encounter.complaint} • Arrived {new Date(encounter.arrivalTime).toLocaleTimeString()} • {encounter.room || encounter.lane}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {lastObs && (
                <QuickBadge icon={<Activity className="h-3 w-3"/>} label={`Last obs ${fmtTime(lastObs.takenAt)}`} />
              )}
              <QuickBadge icon={<ListChecks className="h-3 w-3"/>} label={`${tasks.filter(t=>t.status==='pending').length} tasks`} />
              {overdueCount>0 && (
                <QuickBadge icon={<Bell className="h-3 w-3"/>} className="bg-red-100" label={`${overdueCount} overdue`} />
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {(lane === "waiting" && (role === "rn" || role === "charge")) && (
            <Button size="sm" onClick={(e)=>{ e.stopPropagation(); onStartTriage?.(encounter.id); }} data-testid={`button-start-triage-${encounter.id}`}>Start Triage</Button>
          )}
          {(lane === "triage" && role === "charge") && (
            <Dialog open={roomDialogOpen} onOpenChange={(o)=>{ setRoomDialogOpen(o); }}>
              <DialogTrigger asChild>
                <Button size="sm" variant="secondary" onClick={(e)=> e.stopPropagation()} data-testid={`button-assign-room-${encounter.id}`}>Assign Room</Button>
              </DialogTrigger>
              <DialogContent onClick={(e)=> e.stopPropagation()}>
                <DialogHeader>
                  <DialogTitle>Assign Room</DialogTitle>
                </DialogHeader>
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
                    <Button onClick={() => { if(selectedRoomId){ onAssignRoom?.(encounter.id, selectedRoomId); setRoomDialogOpen(false);} }}>Assign</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Body */}
      {expanded && (
        <div id={`patient-${encounter.id}-body`} className="px-4 pb-4">
          <Separator className="mb-3"/>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="flex flex-wrap">
              <TabsTrigger value="overview" data-testid={`tab-overview-${encounter.id}`}>Overview</TabsTrigger>
              <TabsTrigger value="triage" data-testid={`tab-triage-${encounter.id}`}>Triage</TabsTrigger>
              <TabsTrigger value="assessment" data-testid={`tab-assessment-${encounter.id}`}>Assessment</TabsTrigger>
              <TabsTrigger value="vitals" data-testid={`tab-vitals-${encounter.id}`}>Vitals</TabsTrigger>
              <TabsTrigger value="notes" data-testid={`tab-notes-${encounter.id}`}>Notes</TabsTrigger>
              <TabsTrigger value="diagnostics" data-testid={`tab-diagnostics-${encounter.id}`}>Diagnostics</TabsTrigger>
              <TabsTrigger value="tasks" data-testid={`tab-tasks-${encounter.id}`}>Tasks</TabsTrigger>
              {role === "md" && <TabsTrigger value="orders" data-testid={`tab-orders-${encounter.id}`}>Quick Orders</TabsTrigger>}
              {role === "md" && <TabsTrigger value="dispo" data-testid={`tab-dispo-${encounter.id}`}>Disposition</TabsTrigger>}
            </TabsList>

            {/* OVERVIEW */}
            <TabsContent value="overview">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
                <Card className="lg:col-span-5">
                  <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><HeartPulse className="h-4 w-4"/>EWS & Trends</CardTitle></CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3">
                      <div className={`text-white rounded-lg px-3 py-2 ${riskColor(ews.riskLevel)}`} data-testid={`ews-score-${encounter.id}`}>EWS {ews.score}</div>
                      <div className="text-sm text-muted-foreground">as of {fmtTime(ews.calculatedAt)}</div>
                    </div>
                    <div className="mt-3 text-sm text-muted-foreground">(Sparkline placeholder for HR/BP/Temp/RR/SpO₂ over last 6h)</div>
                  </CardContent>
                </Card>
                <Card className="lg:col-span-7">
                  <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><ListChecks className="h-4 w-4"/>Active Tasks</CardTitle></CardHeader>
                  <CardContent>
                    <ScrollArea className="h-40 pr-2">
                      <ul className="space-y-2">
                        {tasks.map(t => (
                          <li key={t.id} className="flex items-center justify-between rounded-md border p-2" data-testid={`task-item-${t.id}`}>
                            <div className="flex items-center gap-2 min-w-0">
                              <ClipboardCheck className="h-4 w-4"/>
                              <div className="min-w-0">
                                <div className="text-sm truncate">{t.description}</div>
                                <div className="text-xs text-muted-foreground">Due {fmtTime(t.dueAt)} • {t.source}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {statusBadge(t.status)}
                              <Button size="sm" variant="outline" onClick={()=>onMarkTask?.(encounter.id, t.id, t.status === 'done' ? 'pending' : 'done')} data-testid={`button-task-${t.id}`}>{t.status==='done' ? 'Undo' : 'Done'}</Button>
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
                  <div><strong>ATS:</strong> {encounter.ats}</div>
                  <div><strong>Chief complaint:</strong> {encounter.complaint}</div>
                  <div><strong>Arrived:</strong> {new Date(encounter.arrivalTime).toLocaleString()}</div>
                  {encounter.triageNotes && <div><strong>Notes:</strong> {encounter.triageNotes}</div>}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ASSESSMENT */}
            <TabsContent value="assessment">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><FileText className="h-4 w-4"/>Assessment</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                  <div>
                    <Label>History</Label>
                    <div className="mt-1 rounded-md border p-2 min-h-[64px] whitespace-pre-wrap">—</div>
                  </div>
                  <div>
                    <Label>Exam</Label>
                    <div className="mt-1 rounded-md border p-2 min-h-[64px] whitespace-pre-wrap">—</div>
                  </div>
                  <div>
                    <Label>Impression</Label>
                    <div className="mt-1 rounded-md border p-2 min-h-[64px] whitespace-pre-wrap">—</div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* VITALS */}
            <TabsContent value="vitals">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Thermometer className="h-4 w-4"/>Observations Timeline</CardTitle></CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground mb-2">(Chart placeholder – plot HR, BP, Temp, RR, SpO₂ vs time)</div>
                  <div className="rounded-md border">
                    <div className="grid grid-cols-6 gap-2 px-3 py-2 text-xs font-semibold bg-muted/50">
                      <div>Time</div><div>Type</div><div>Value</div><div>Unit</div><div>Recorder</div><div>EWS Δ</div>
                    </div>
                    <ScrollArea className="max-h-60">
                      <ul>
                        {observations.slice().sort((a,b)=>b.takenAt.localeCompare(a.takenAt)).map(o => (
                          <li key={o.id} className="grid grid-cols-6 gap-2 px-3 py-2 text-sm border-t" data-testid={`observation-${o.id}`}>
                            <div>{fmtTime(o.takenAt)}</div>
                            <div>{o.type}</div>
                            <div>{o.value}</div>
                            <div>{o.unit ?? ""}</div>
                            <div>{o.recordedBy}</div>
                            <div>—</div>
                          </li>
                        ))}
                      </ul>
                    </ScrollArea>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* NOTES */}
            <TabsContent value="notes">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><FileText className="h-4 w-4"/>Notes</CardTitle></CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {notes.slice().sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).map(n => (
                      <li key={n.id} className="rounded-md border p-2" data-testid={`note-${n.id}`}>
                        <div className="text-xs text-muted-foreground">{n.author} • {n.authorRole} • {new Date(n.createdAt).toLocaleString()}</div>
                        <div className="text-sm whitespace-pre-wrap mt-1">{n.body}</div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter className="gap-2">
                  <Input placeholder="Add a note (prototype)" data-testid={`input-note-${encounter.id}`} />
                  <Button size="sm" data-testid={`button-save-note-${encounter.id}`}>Save</Button>
                </CardFooter>
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
                        {diagnostics.map(d => (
                          <li key={d.id} className="grid grid-cols-6 gap-2 px-3 py-2 text-sm border-t" data-testid={`diagnostic-${d.id}`}>
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
                    {tasks.map(t => (
                      <li key={t.id} className="flex items-center justify-between rounded-md border p-2" data-testid={`task-detail-${t.id}`}>
                        <div className="min-w-0">
                          <div className="text-sm truncate">{t.description}</div>
                          <div className="text-xs text-muted-foreground">Due {fmtTime(t.dueAt)} • {t.source}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          {statusBadge(t.status)}
                          <Button size="sm" variant="outline" onClick={()=>onMarkTask?.(encounter.id, t.id, t.status === 'done' ? 'pending' : 'done')} data-testid={`button-task-detail-${t.id}`}>{t.status==='done' ? 'Undo' : 'Done'}</Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>

            {/* MD‑ONLY: QUICK ORDERS */}
            {role === "md" && (
              <TabsContent value="orders">
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Pill className="h-4 w-4"/>Quick Order Sets</CardTitle></CardHeader>
                  <CardContent className="flex flex-wrap gap-2">
                    {["Sepsis","Stroke","Chest Pain"].map((setName)=> (
                      <Button key={setName} variant="secondary" onClick={()=>onOrderSet?.(encounter.id, setName as any)} data-testid={`button-order-${setName.toLowerCase().replace(' ', '-')}-${encounter.id}`}>{setName}</Button>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {/* MD‑ONLY: DISPOSITION */}
            {role === "md" && (
              <TabsContent value="dispo">
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><XCircle className="h-4 w-4"/>Disposition</CardTitle></CardHeader>
                  <CardContent className="flex flex-wrap gap-2">
                    {["Admit","Discharge","Refer"].map(d => (
                      <Button key={d} onClick={()=>onDisposition?.(encounter.id, d as any)} data-testid={`button-disposition-${d.toLowerCase()}-${encounter.id}`}>{d}</Button>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </div>
      )}
    </Card>
  );
}