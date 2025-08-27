import React, { useMemo, useState } from "react";
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
import { type Encounter } from "@shared/schema";

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
  if (s === "overdue") return <Badge className="bg-red-600 text-white">Overdue</Badge>;
  return <Badge className="bg-green-600 text-white">Done</Badge>;
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
  if (encounter.triageSpo2) observations.push({ id: `spo2-${encounter.id}`, type: "SpO2", value: encounter.triageSpo2.toString(), unit: "%", takenAt: timestamp, recordedBy: "Triage" });
  if (encounter.triageTemp) observations.push({ id: `temp-${encounter.id}`, type: "Temp", value: (encounter.triageTemp / 10).toString(), unit: "°C", takenAt: timestamp, recordedBy: "Triage" });
  if (encounter.triagePain) observations.push({ id: `pain-${encounter.id}`, type: "Pain", value: encounter.triagePain.toString(), unit: "/10", takenAt: timestamp, recordedBy: "Triage" });
  
  return observations;
};

// Calculate basic EWS from vitals
const calculateEWS = (encounter: Encounter): EWS => {
  let score = 0;
  
  // Simplified EWS calculation based on available vitals
  if (encounter.triageHr) {
    const hr = encounter.triageHr;
    if (hr <= 40 || hr >= 131) score += 3;
    else if (hr <= 50 || hr >= 111) score += 2;
    else if (hr >= 101) score += 1;
  }
  
  if (encounter.triageRr) {
    const rr = encounter.triageRr;
    if (rr <= 8 || rr >= 25) score += 3;
    else if (rr >= 21) score += 2;
    else if (rr <= 11) score += 1;
  }
  
  if (encounter.triageSpo2) {
    const spo2 = encounter.triageSpo2;
    if (spo2 <= 91) score += 3;
    else if (spo2 <= 93) score += 2;
    else if (spo2 <= 95) score += 1;
  }
  
  if (encounter.triageTemp) {
    const temp = encounter.triageTemp / 10;
    if (temp <= 35 || temp >= 39) score += 2;
  }
  
  return {
    score,
    riskLevel: ewsToRisk(score),
    calculatedAt: new Date().toISOString()
  };
};

// Generate mock tasks based on encounter data
const generateTasks = (encounter: Encounter): TaskItem[] => {
  const tasks: TaskItem[] = [];
  
  if (encounter.lane === "triage" && !encounter.triageCompleted) {
    tasks.push({
      id: `triage-${encounter.id}`,
      description: "Complete triage assessment",
      status: "pending",
      source: "auto",
      dueAt: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 min from now
    });
  }
  
  if (encounter.lane === "roomed" && !encounter.provider) {
    tasks.push({
      id: `provider-${encounter.id}`,
      description: "Assign provider",
      status: "pending",
      source: "auto"
    });
  }
  
  if (encounter.lane === "diagnostics") {
    tasks.push({
      id: `results-${encounter.id}`,
      description: "Review diagnostic results",
      status: encounter.resultsStatus === "complete" ? "done" : "pending",
      source: "auto"
    });
  }
  
  if (encounter.ats && encounter.ats <= 2) {
    tasks.push({
      id: `urgent-${encounter.id}`,
      description: "High priority patient - expedite care",
      status: "pending",
      source: "auto",
      dueAt: new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 min from now
    });
  }
  
  return tasks;
};

const QuickBadge: React.FC<{ label: string; className?: string; title?: string; icon?: React.ReactNode }>= ({ label, className = "", title, icon }) => (
  <div title={title} className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium bg-muted ${className}`}>
    {icon}
    <span>{label}</span>
  </div>
);

export interface PatientCardExpandableProps {
  role: Role;
  encounter: Encounter;
  onOpenChart?: (patientId: string) => void;
  onMarkTask?: (patientId: string, taskId: string, status: TaskItem["status"]) => void;
  onOrderSet?: (patientId: string, setName: "Sepsis" | "Stroke" | "Chest Pain") => void;
  onDisposition?: (patientId: string, disp: "Admit" | "Discharge" | "Refer") => void;
}

export default function PatientCardExpandable({ role, encounter, onOpenChart, onMarkTask, onOrderSet, onDisposition }: PatientCardExpandableProps) {
  const [expanded, setExpanded] = useState(false);

  // Convert encounter data to component format
  const observations = useMemo(() => encounterToObservations(encounter), [encounter]);
  const ews = useMemo(() => calculateEWS(encounter), [encounter]);
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
      >
        <div className="flex items-center gap-4 min-w-0">
          <UserCircle2 className="h-8 w-8" />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg truncate">{encounter.name} <span className="text-muted-foreground">• {encounter.age}{" "}{encounter.sex}</span></CardTitle>
              {encounter.ats && <Badge variant="outline">ATS {encounter.ats}</Badge>}
              <div className={`text-white text-xs px-2 py-1 rounded ${riskColor(ews.riskLevel)}`}>
                EWS {ews.score}
              </div>
              {encounter.isolationRequired === "true" && <QuickBadge icon={<AlertTriangle className="h-3 w-3"/>} label="ISOLATION" className="bg-red-50" />}
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
          <Button variant="outline" size="sm" onClick={(e)=>{e.stopPropagation(); onOpenChart?.(encounter.id);}}>Open Chart</Button>
          <Button variant="ghost" size="icon" aria-label="Expand">
            <ChevronDown className={`h-5 w-5 transition-transform ${expanded? 'rotate-180': ''}`} />
          </Button>
        </div>
      </div>

      {/* Body */}
      {expanded && (
        <div id={`patient-${encounter.id}-body`} className="px-4 pb-4">
          <Separator className="mb-3"/>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="flex flex-wrap">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="triage">Triage</TabsTrigger>
              <TabsTrigger value="assessment">Assessment</TabsTrigger>
              <TabsTrigger value="vitals">Vitals</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
              <TabsTrigger value="diagnostics">Diagnostics</TabsTrigger>
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
              {role === "md" && <TabsTrigger value="orders">Quick Orders</TabsTrigger>}
              {role === "md" && <TabsTrigger value="dispo">Disposition</TabsTrigger>}
            </TabsList>

            {/* OVERVIEW */}
            <TabsContent value="overview">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
                <Card className="lg:col-span-5">
                  <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><HeartPulse className="h-4 w-4"/>EWS & Trends</CardTitle></CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3">
                      <div className={`text-white rounded-lg px-3 py-2 ${riskColor(ews.riskLevel)}`}>EWS {ews.score}</div>
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
                          <li key={t.id} className="flex items-center justify-between rounded-md border p-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <ClipboardCheck className="h-4 w-4"/>
                              <div className="min-w-0">
                                <div className="text-sm truncate">{t.description}</div>
                                <div className="text-xs text-muted-foreground">Due {fmtTime(t.dueAt)} • {t.source}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {statusBadge(t.status)}
                              <Button size="sm" variant="outline" onClick={()=>onMarkTask?.(encounter.id, t.id, t.status === 'done' ? 'pending' : 'done')}>{t.status==='done' ? 'Undo' : 'Done'}</Button>
                            </div>
                          </li>
                        ))}
                        {tasks.length === 0 && (
                          <li className="text-sm text-muted-foreground text-center py-4">No active tasks</li>
                        )}
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
                  <div><strong>ATS:</strong> {encounter.ats || "Not assigned"}</div>
                  <div><strong>Chief complaint:</strong> {encounter.complaint}</div>
                  <div><strong>Arrived:</strong> {new Date(encounter.arrivalTime).toLocaleString()}</div>
                  <div><strong>Mode of arrival:</strong> {encounter.triageModeOfArrival || "Not specified"}</div>
                  <div><strong>Triage completed:</strong> {encounter.triageCompleted === "true" ? "Yes" : "No"}</div>
                  {encounter.triageNotes && (
                    <div><strong>Notes:</strong> {encounter.triageNotes}</div>
                  )}
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
                    <div className="mt-1 rounded-md border p-2 min-h-[64px] whitespace-pre-wrap">{encounter.triageComplaintText || "—"}</div>
                  </div>
                  <div>
                    <Label>Exam</Label>
                    <div className="mt-1 rounded-md border p-2 min-h-[64px] whitespace-pre-wrap">{"—"}</div>
                  </div>
                  <div>
                    <Label>Impression</Label>
                    <div className="mt-1 rounded-md border p-2 min-h-[64px] whitespace-pre-wrap">{encounter.triageProvisionalDispo || "—"}</div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* VITALS */}
            <TabsContent value="vitals">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Activity className="h-4 w-4"/>Vital Signs</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {observations.map(obs => (
                      <div key={obs.id} className="p-3 rounded-md border">
                        <div className="text-sm font-medium">{obs.type}</div>
                        <div className="text-lg">{obs.value} {obs.unit}</div>
                        <div className="text-xs text-muted-foreground">{fmtTime(obs.takenAt)}</div>
                      </div>
                    ))}
                    {observations.length === 0 && (
                      <div className="col-span-full text-sm text-muted-foreground text-center py-4">No vitals recorded</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* NOTES */}
            <TabsContent value="notes">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><FileText className="h-4 w-4"/>Clinical Notes</CardTitle></CardHeader>
                <CardContent>
                  <ScrollArea className="h-60 pr-2">
                    <div className="space-y-3">
                      {notes.map(note => (
                        <div key={note.id} className="p-3 rounded-md border">
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant="outline">{note.author}</Badge>
                            <span className="text-xs text-muted-foreground">{fmtTime(note.createdAt)}</span>
                          </div>
                          <div className="text-sm whitespace-pre-wrap">{note.body}</div>
                        </div>
                      ))}
                      {notes.length === 0 && (
                        <div className="text-sm text-muted-foreground text-center py-4">No notes recorded</div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            {/* DIAGNOSTICS */}
            <TabsContent value="diagnostics">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><TestTubes className="h-4 w-4"/>Diagnostics</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {diagnostics.map(dx => (
                      <div key={dx.id} className="flex items-center justify-between p-3 rounded-md border">
                        <div>
                          <div className="font-medium">{dx.name}</div>
                          <div className="text-sm text-muted-foreground">{dx.kind} • {fmtTime(dx.orderedAt)}</div>
                          {dx.summary && <div className="text-sm mt-1">{dx.summary}</div>}
                        </div>
                        <Badge variant={dx.status === "resulted" ? "default" : "secondary"}>{dx.status}</Badge>
                      </div>
                    ))}
                    {diagnostics.length === 0 && (
                      <div className="text-sm text-muted-foreground text-center py-4">No diagnostics ordered</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TASKS */}
            <TabsContent value="tasks">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><ListChecks className="h-4 w-4"/>Task Management</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {tasks.map(task => (
                      <div key={task.id} className="flex items-center justify-between p-3 rounded-md border">
                        <div className="min-w-0">
                          <div className="font-medium truncate">{task.description}</div>
                          <div className="text-sm text-muted-foreground">Due {fmtTime(task.dueAt)} • {task.source}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          {statusBadge(task.status)}
                          <Button size="sm" variant="outline" onClick={()=>onMarkTask?.(encounter.id, task.id, task.status === 'done' ? 'pending' : 'done')}>
                            {task.status==='done' ? 'Undo' : 'Done'}
                          </Button>
                        </div>
                      </div>
                    ))}
                    {tasks.length === 0 && (
                      <div className="text-sm text-muted-foreground text-center py-4">No active tasks</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* QUICK ORDERS (MD only) */}
            {role === "md" && (
              <TabsContent value="orders">
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Pill className="h-4 w-4"/>Quick Order Sets</CardTitle></CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <Button variant="outline" onClick={() => onOrderSet?.(encounter.id, "Sepsis")}>
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        Sepsis Workup
                      </Button>
                      <Button variant="outline" onClick={() => onOrderSet?.(encounter.id, "Stroke")}>
                        <BrainCircuit className="h-4 w-4 mr-2" />
                        Stroke Protocol
                      </Button>
                      <Button variant="outline" onClick={() => onOrderSet?.(encounter.id, "Chest Pain")}>
                        <HeartPulse className="h-4 w-4 mr-2" />
                        Chest Pain Workup
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {/* DISPOSITION (MD only) */}
            {role === "md" && (
              <TabsContent value="dispo">
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><ClipboardCheck className="h-4 w-4"/>Disposition</CardTitle></CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <Button variant="outline" onClick={() => onDisposition?.(encounter.id, "Admit")}>
                        Admit Patient
                      </Button>
                      <Button variant="outline" onClick={() => onDisposition?.(encounter.id, "Discharge")}>
                        Discharge Home
                      </Button>
                      <Button variant="outline" onClick={() => onDisposition?.(encounter.id, "Refer")}>
                        Transfer/Refer
                      </Button>
                    </div>
                    <div className="mt-3 text-sm text-muted-foreground">
                      Current disposition: {encounter.disposition || "Not set"}
                    </div>
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