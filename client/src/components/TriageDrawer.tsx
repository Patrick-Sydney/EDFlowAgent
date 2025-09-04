import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useDashboardStore } from "@/stores/dashboardStore";
import { useToast } from "@/hooks/use-toast";
import { X, AlertTriangle, Heart } from "lucide-react";
import TButton from "./ui/TButton";
import VitalButton from "./VitalButton";
import { SegmentedOld as Segmented, Chips } from "./ui/Segmented";
import { haptic, once } from "@/utils/touch";

export default function TriageDrawer() {
  const { triageOpen, triageEncounter, closeTriage, saveTriage, openRoom } = useDashboardStore();
  const { toast } = useToast();
  const enc = triageEncounter;

  const [form, setForm] = useState({
    // Core vitals and assessment
    hr: "", rr: "", bpSys: "", bpDia: "", spo2: "", temp: "",
    pain: "", notes: "", ats: "",
    // Extended v2 fields
    modeOfArrival: "walk-in",
    complaintText: "", complaintCode: "",
    allergy: "unknown",
    pregnancy: "unknown", 
    infection: "none",
    mobility: "independent",
    risk: { sepsis: false, stroke: false, suicide: false },
    provisionalDispo: "unsure",
    expectedResources: [] as string[],
    care: { analgesia: false, iv: false }
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!enc) return;
    
    // Populate form with existing triage data
    const expectedResources = enc.triageExpectedResources ? 
      (typeof enc.triageExpectedResources === 'string' ? 
        JSON.parse(enc.triageExpectedResources || '[]') : 
        enc.triageExpectedResources) : [];

    setForm({
      // Core vitals
      hr: enc.triageHr ? enc.triageHr.toString() : "",
      rr: enc.triageRr ? enc.triageRr.toString() : "",
      bpSys: enc.triageBpSys ? enc.triageBpSys.toString() : "",
      bpDia: enc.triageBpDia ? enc.triageBpDia.toString() : "",
      spo2: enc.triageSpo2 ? enc.triageSpo2.toString() : "",
      temp: enc.triageTemp ? (enc.triageTemp / 10).toString() : "",
      pain: enc.triagePain ? enc.triagePain.toString() : "",
      notes: enc.triageNotes ?? "",
      ats: enc.ats ? enc.ats.toString() : "",
      // Extended v2 fields
      modeOfArrival: (enc as any).triageModeOfArrival ?? "walk-in",
      complaintText: (enc as any).triageComplaintText ?? "",
      complaintCode: (enc as any).triageComplaintCode ?? "",
      allergy: (enc as any).triageAllergy ?? "unknown",
      pregnancy: (enc as any).triagePregnancy ?? "unknown",
      infection: (enc as any).triageInfection ?? "none",
      mobility: (enc as any).triageMobility ?? "independent",
      risk: {
        sepsis: (enc as any).triageRiskSepsis === "true",
        stroke: (enc as any).triageRiskStroke === "true",
        suicide: (enc as any).triageRiskSuicide === "true"
      },
      provisionalDispo: (enc as any).triageProvisionalDispo ?? "unsure",
      expectedResources,
      care: {
        analgesia: (enc as any).triageCareAnalgesia === "true",
        iv: (enc as any).triageCareIv === "true"
      }
    });
  }, [enc]);

  const onChange = (key: string, value: any) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const on = (key: string, value: any) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const toggleArrayValue = (field: string, value: string, checked: boolean) => {
    const currentArray = form[field as keyof typeof form] as string[] || [];
    const newArray = [...currentArray];
    
    if (checked && !newArray.includes(value)) {
      newArray.push(value);
    } else if (!checked && newArray.includes(value)) {
      newArray.splice(newArray.indexOf(value), 1);
    }
    
    setForm(prev => ({ ...prev, [field]: newArray }));
  };

  // Clinical risk assessment
  const risk = useMemo(() => {
    const hr = Number(form.hr);
    const rr = Number(form.rr);
    const temp = Number(form.temp);
    const spo2 = Number(form.spo2);
    
    const sepsis = (temp >= 38 || temp <= 35) && (hr > 90) && (rr > 20);
    const hypox = spo2 && spo2 < 92;
    const stroke = /weak|speech|face|FAST|arm|droop|slurred/i.test(enc?.complaint || "");
    
    return { sepsis, hypox, stroke };
  }, [form, enc]);

  if (!triageOpen || !enc) return null;

  const handleSave = async (e?: React.FormEvent) => {
    if (e?.preventDefault) e.preventDefault();
    
    setIsSubmitting(true);
    try {
      const payload = {
        id: enc.id,
        vitals: {
          hr: numOrNull(form.hr),
          rr: numOrNull(form.rr),
          bpSys: numOrNull(form.bpSys),
          bpDia: numOrNull(form.bpDia),
          spo2: numOrNull(form.spo2),
          temp: numOrNull(form.temp)
        },
        pain: numOrNull(form.pain),
        notes: form.notes,
        ats: form.ats ? Number(form.ats) : undefined,
        // Extended v2 fields
        modeOfArrival: form.modeOfArrival,
        complaintText: form.complaintText,
        complaintCode: form.complaintCode,
        allergy: form.allergy,
        pregnancy: form.pregnancy,
        infection: form.infection,
        mobility: form.mobility,
        risk: form.risk,
        provisionalDispo: form.provisionalDispo,
        expectedResources: form.expectedResources,
        care: form.care
      };

      await saveTriage(payload);
      
      toast({
        title: "Triage Saved",
        description: `Triage completed for ${enc.name}. Patient moved to triage lane.`,
      });
      
      closeTriage();
      return { ok: true };
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save triage data. Please try again.",
        variant: "destructive",
      });
      return { ok: false };
    } finally {
      setIsSubmitting(false);
    }
  };

  // Save, then assign a room (if available / permitted)
  const saveAndAssign = async () => {
    if (!enc) return;
    const result = await handleSave();
    if (!result?.ok) return;
    
    // Directly open room management drawer
    openRoom(enc);
  };

  return (
    <div className="fixed inset-0 z-[1100]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30" onClick={closeTriage} />
      
      {/* Wider, responsive drawer */}
      <div className="absolute top-0 right-0 h-full w-full sm:w-[85%] md:w-[75%] lg:w-[720px] bg-white shadow-xl flex flex-col">
        {/* Header */}
        <div 
          className="px-4 py-3 border-b sticky top-0 bg-white z-10 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={closeTriage}
          data-testid="header-close-drawer"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-base sm:text-lg">
              Triage — {enc.name}
            </h3>
            <TButton 
              className="border bg-white min-w-[44px]" 
              onClick={(e) => { e.stopPropagation(); closeTriage(); }}
              data-testid="button-close-triage"
            >
              <X className="w-4 h-4" />
            </TButton>
          </div>
          <div className="mt-1 text-xs text-gray-600">
            {enc.age}y {enc.sex} • NHI: {enc.nhi}
          </div>
          <div className="text-xs text-gray-500">{enc.complaint}</div>
        </div>

        {/* Scrollable form area */}
        <form 
          onSubmit={handleSave} 
          className="flex-1 overflow-y-auto px-4 py-3 space-y-6"
          onKeyDown={(e) => { if(e.key === 'Enter' && (e.target as HTMLElement).tagName === 'INPUT') e.preventDefault(); }}
        >
            {/* 1. Arrival & Complaint */}
            <section>
              <h4 className="font-semibold mb-2">Arrival & Complaint</h4>
              <div className="grid lg:grid-cols-2 gap-3">
                <div className="text-sm">
                  <div className="mb-1">Mode of arrival</div>
                  <Segmented
                    value={form.modeOfArrival}
                    onChange={(v) => on("modeOfArrival", v)}
                    options={[
                      { value: "walk-in", label: "Walk-in" },
                      { value: "ambulance", label: "Ambulance" },
                      { value: "transfer", label: "Transfer" }
                    ]}
                  />
                </div>
                <label className="text-sm lg:col-span-2">
                  Presenting complaint
                  <input
                    className="mt-1 w-full border rounded px-3 py-3 text-base min-h-[44px]"
                    value={form.complaintText}
                    onChange={(e) => on("complaintText", e.target.value)}
                    placeholder="Patient's primary complaint"
                  />
                </label>
              </div>
            </section>

            {/* 2. Safety Flags */}
            <section>
              <h4 className="font-semibold mb-2">Safety</h4>
              <div className="grid lg:grid-cols-2 gap-3">
                <div className="text-sm">
                  <div className="mb-1">Allergies</div>
                  <Segmented
                    value={form.allergy}
                    onChange={(v) => on("allergy", v)}
                    options={[
                      { value: "none", label: "None" },
                      { value: "known", label: "Known" },
                      { value: "unknown", label: "Unknown" }
                    ]}
                  />
                </div>
                <div className="text-sm">
                  <div className="mb-1">Pregnancy (if applicable)</div>
                  <Segmented
                    value={form.pregnancy}
                    onChange={(v) => on("pregnancy", v)}
                    options={[
                      { value: "unknown", label: "Unknown" },
                      { value: "yes", label: "Yes" },
                      { value: "no", label: "No" }
                    ]}
                  />
                </div>
                <div className="text-sm">
                  <div className="mb-1">Infection risk</div>
                  <Segmented
                    value={form.infection}
                    onChange={(v) => on("infection", v)}
                    options={[
                      { value: "none", label: "None" },
                      { value: "suspected", label: "Suspected" },
                      { value: "confirmed", label: "Confirmed" }
                    ]}
                  />
                </div>
                <div className="text-sm">
                  <div className="mb-1">Mobility</div>
                  <Segmented
                    value={form.mobility}
                    onChange={(v) => on("mobility", v)}
                    options={[
                      { value: "independent", label: "Independent" },
                      { value: "assist", label: "Assist" },
                      { value: "bed", label: "Bed-bound" }
                    ]}
                  />
                </div>
              </div>
            </section>

            {/* 3. Vitals + Pain */}
            <section>
              <h4 className="font-semibold mb-2 flex items-center space-x-2">
                <Heart className="w-4 h-4" />
                <span>Vitals</span>
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <VitalButton label="HR (bpm)" value={form.hr} onChange={(v) => onChange("hr", v)} min={20} max={220} />
                <VitalButton label="RR (/min)" value={form.rr} onChange={(v) => onChange("rr", v)} min={6} max={60} />
                <VitalButton label="BP Sys" unit=" mmHg" value={form.bpSys} onChange={(v) => onChange("bpSys", v)} min={60} max={260} />
                <VitalButton label="BP Dia" unit=" mmHg" value={form.bpDia} onChange={(v) => onChange("bpDia", v)} min={30} max={150} />
                <VitalButton label="SpO₂" unit=" %" value={form.spo2} onChange={(v) => onChange("spo2", v)} min={50} max={100} />
                <VitalButton label="Temp" unit=" °C" value={form.temp} onChange={(v) => onChange("temp", v)} allowDecimal maxLen={5} min={30} max={43} />
                <VitalButton label="Pain" unit="/10" value={form.pain} onChange={(v) => onChange("pain", v)} min={0} max={10} maxLen={2} />
              </div>
            </section>

            {/* 4. Risk Screens */}
            <section>
              <h4 className="font-semibold mb-2">Risk screens</h4>
              <Chips
                values={Object.entries(form.risk).filter(([,v]) => v).map(([k]) => k)}
                onToggle={(key, on) => {
                  const next = { ...form.risk, [key]: on };
                  onChange("risk", next);
                }}
                options={[
                  { value: "sepsis", label: "Sepsis risk" },
                  { value: "stroke", label: "Stroke / FAST" },
                  { value: "suicide", label: "Suicide/self-harm" }
                ]}
              />
            </section>

            {/* 5. Forecasting */}
            <section>
              <h4 className="font-semibold mb-2">Forecast</h4>
              <div className="text-sm mb-2">Provisional disposition</div>
              <Segmented
                value={form.provisionalDispo}
                onChange={(v) => on("provisionalDispo", v)}
                options={[
                  { value: "unsure", label: "Unsure" },
                  { value: "likelyDischarge", label: "Likely discharge" },
                  { value: "likelyAdmit", label: "Likely admit" }
                ]}
              />
              <div className="text-sm mt-3 mb-1">Expected resources</div>
              <Chips
                values={form.expectedResources}
                onToggle={(val, on) => toggleArrayValue("expectedResources", val, on)}
                options={[
                  { value: "labs", label: "Labs" },
                  { value: "imaging", label: "Imaging" },
                  { value: "specialist", label: "Specialist" }
                ]}
              />
            </section>

            {/* 6. ATS */}
            <section>
              <h4 className="font-semibold mb-2">ATS</h4>
              <div className="flex items-center gap-2">
                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5].map(n => {
                    const selected = String(form.ats) === String(n);
                    return (
                      <button
                        key={n}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => on("ats", String(n))}
                        className={`px-3 py-3 rounded-xl border text-base min-w-[48px] min-h-[44px] ${
                          selected ? "bg-emerald-600 text-white border-emerald-600" : "bg-white hover:bg-gray-50"
                        }`}
                        data-testid={`button-triage-ats-${n}`}
                      >
                        {n}
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  className="px-3 py-3 rounded-xl border min-h-[44px]"
                  onClick={() => on("ats", "")}
                  data-testid="button-clear-triage-ats"
                >
                  Clear
                </button>
              </div>
              {enc.provisionalAts === "true" && (
                <div className="text-xs text-gray-500 mt-1">
                  Replaces provisional ATS
                </div>
              )}
            </section>

            {/* 7. Care Started */}
            <section>
              <h4 className="font-semibold mb-2">Care started</h4>
              <Chips
                values={Object.entries(form.care).filter(([,v]) => v).map(([k]) => k)}
                onToggle={(key, on) => {
                  const next = { ...form.care, [key]: on };
                  onChange("care", next);
                }}
                options={[
                  { value: "analgesia", label: "Analgesia given" },
                  { value: "iv", label: "IV/fluids started" }
                ]}
              />
            </section>

            {/* 8. Clinical Notes */}
            <section>
              <h4 className="font-semibold mb-2">Clinical Notes</h4>
              <textarea
                value={form.notes}
                onChange={(e) => onChange("notes", e.target.value)}
                placeholder="Assessment notes, observations, treatment plan..."
                className="w-full h-20 border rounded px-3 py-3 text-base min-h-[44px] resize-y"
                data-testid="textarea-triage-notes"
              />
            </section>

            {/* Risk Alerts */}
            {(risk.sepsis || risk.hypox || risk.stroke) && (
              <Card className="border-amber-200 bg-amber-50">
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-2 mb-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                    <h3 className="font-medium text-amber-900">Clinical Alerts</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {risk.sepsis && (
                      <Badge variant="destructive" className="text-xs">
                        Sepsis Risk - SIRS criteria met
                      </Badge>
                    )}
                    {risk.hypox && (
                      <Badge variant="destructive" className="text-xs">
                        Hypoxia - SpO₂ &lt; 92%
                      </Badge>
                    )}
                    {risk.stroke && (
                      <Badge variant="destructive" className="text-xs">
                        Stroke Pathway - Consider FAST assessment
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

        </form>
        
        {/* Sticky action bar */}
        <div className="p-3 border-t sticky bottom-0 bg-white flex gap-2">
          <TButton 
            className="bg-emerald-600 text-white flex-1 min-h-[50px]" 
            onClick={once((e: React.MouseEvent) => { e.preventDefault(); handleSave(e); haptic(); })}
            disabled={isSubmitting}
            data-testid="button-save-triage"
          >
            {isSubmitting ? "Saving..." : "Save Triage"}
          </TButton>
          <TButton
            className="bg-blue-600 text-white flex-1 min-h-[50px]"
            onClick={once(() => { saveAndAssign(); haptic(); })}
            disabled={isSubmitting || !!enc?.room}
            title={enc?.room ? "Already assigned to a room" : "Save & Assign Room"}
            data-testid="button-save-assign-triage"
          >
            {isSubmitting ? "Working..." : "Save & Assign Room"}
          </TButton>
          <TButton 
            className="border bg-white min-h-[50px] min-w-[100px]" 
            onClick={closeTriage}
            disabled={isSubmitting}
          >
            Cancel
          </TButton>
        </div>
      </div>
    </div>
  );
}

function Field({ 
  label, 
  value, 
  onChange, 
  placeholder, 
  step 
}: { 
  label: string; 
  value: string; 
  onChange: (value: string) => void; 
  placeholder?: string;
  step?: string;
}) {
  return (
    <div>
      <Label className="text-sm">{label}</Label>
      <Input
        type="number"
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1"
      />
    </div>
  );
}

function numOrNull(value: string): number | null {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}