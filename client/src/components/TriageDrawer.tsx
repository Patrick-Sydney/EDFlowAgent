import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useDashboardStore } from "@/stores/dashboardStore";
import { useToast } from "@/hooks/use-toast";
import { X, AlertTriangle, Heart } from "lucide-react";

export default function TriageDrawer() {
  const { triageOpen, triageEncounter, closeTriage, saveTriage } = useDashboardStore();
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
      hr: enc.triageHr ?? "",
      rr: enc.triageRr ?? "",
      bpSys: enc.triageBpSys ?? "",
      bpDia: enc.triageBpDia ?? "",
      spo2: enc.triageSpo2 ?? "",
      temp: enc.triageTemp ? (enc.triageTemp / 10).toString() : "",
      pain: enc.triagePain ?? "",
      notes: enc.triageNotes ?? "",
      ats: enc.ats ?? "",
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save triage data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30" onClick={closeTriage} />
      
      {/* Drawer */}
      <div className="absolute top-0 right-0 h-full w-full max-w-lg bg-white shadow-xl overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Triage Assessment</h2>
              <p className="text-sm text-gray-600">
                {enc.name} • {enc.age}y {enc.sex} • NHI: {enc.nhi}
              </p>
              <p className="text-sm text-gray-500 mt-1">{enc.complaint}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={closeTriage}
              data-testid="button-close-triage"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            {/* 1. Arrival & Complaint */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Arrival & Complaint</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm">Mode of arrival</Label>
                    <Select value={form.modeOfArrival} onValueChange={(value) => onChange("modeOfArrival", value)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="walk-in">Walk-in</SelectItem>
                        <SelectItem value="ambulance">Ambulance</SelectItem>
                        <SelectItem value="transfer">Transfer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-sm">Presenting complaint</Label>
                    <Input
                      className="mt-1"
                      value={form.complaintText}
                      onChange={(e) => onChange("complaintText", e.target.value)}
                      placeholder="Patient's primary complaint"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 2. Safety Flags */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Safety</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm">Allergies</Label>
                    <Select value={form.allergy} onValueChange={(value) => onChange("allergy", value)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="known">Known</SelectItem>
                        <SelectItem value="unknown">Unknown</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm">Pregnancy (if applicable)</Label>
                    <Select value={form.pregnancy} onValueChange={(value) => onChange("pregnancy", value)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unknown">Unknown</SelectItem>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm">Infection risk</Label>
                    <Select value={form.infection} onValueChange={(value) => onChange("infection", value)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="suspected">Suspected</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm">Mobility</Label>
                    <Select value={form.mobility} onValueChange={(value) => onChange("mobility", value)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="independent">Independent</SelectItem>
                        <SelectItem value="assist">Requires assist</SelectItem>
                        <SelectItem value="bed">Bed-bound</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 3. Vitals + Pain */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-sm font-semibold">
                  <Heart className="w-4 h-4" />
                  <span>Vitals</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  <Field label="HR" value={form.hr} onChange={(v) => onChange("hr", v)} placeholder="80" />
                  <Field label="RR" value={form.rr} onChange={(v) => onChange("rr", v)} placeholder="16" />
                  <Field label="Temp" value={form.temp} onChange={(v) => onChange("temp", v)} placeholder="36.5" step="0.1" />
                  <Field label="SpO₂" value={form.spo2} onChange={(v) => onChange("spo2", v)} placeholder="98" />
                  <Field label="BP Sys" value={form.bpSys} onChange={(v) => onChange("bpSys", v)} placeholder="120" />
                  <Field label="BP Dia" value={form.bpDia} onChange={(v) => onChange("bpDia", v)} placeholder="80" />
                  <Field label="Pain 0-10" value={form.pain} onChange={(v) => onChange("pain", v)} placeholder="0" />
                </div>
              </CardContent>
            </Card>

            {/* 4. Risk Screens */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Risk screens</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label className="flex items-center space-x-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={form.risk.sepsis}
                      onChange={(e) => onChange("risk", { ...form.risk, sepsis: e.target.checked })}
                    />
                    <span className="text-sm">Sepsis risk</span>
                  </Label>
                  <Label className="flex items-center space-x-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={form.risk.stroke}
                      onChange={(e) => onChange("risk", { ...form.risk, stroke: e.target.checked })}
                    />
                    <span className="text-sm">Stroke FAST</span>
                  </Label>
                  <Label className="flex items-center space-x-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={form.risk.suicide}
                      onChange={(e) => onChange("risk", { ...form.risk, suicide: e.target.checked })}
                    />
                    <span className="text-sm">Suicide/self-harm risk</span>
                  </Label>
                </div>
              </CardContent>
            </Card>

            {/* 5. Forecasting */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Forecast</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm">Provisional disposition</Label>
                    <Select value={form.provisionalDispo} onValueChange={(value) => onChange("provisionalDispo", value)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unsure">Unsure</SelectItem>
                        <SelectItem value="likelyDischarge">Likely discharge</SelectItem>
                        <SelectItem value="likelyAdmit">Likely admit</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm">Expected resources</Label>
                    <div className="mt-2 flex flex-wrap gap-3">
                      <Label className="flex items-center space-x-2 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={form.expectedResources.includes("labs")}
                          onChange={(e) => toggleArrayValue("expectedResources", "labs", e.target.checked)}
                        />
                        <span className="text-sm">Labs</span>
                      </Label>
                      <Label className="flex items-center space-x-2 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={form.expectedResources.includes("imaging")}
                          onChange={(e) => toggleArrayValue("expectedResources", "imaging", e.target.checked)}
                        />
                        <span className="text-sm">Imaging</span>
                      </Label>
                      <Label className="flex items-center space-x-2 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={form.expectedResources.includes("specialist")}
                          onChange={(e) => toggleArrayValue("expectedResources", "specialist", e.target.checked)}
                        />
                        <span className="text-sm">Specialist</span>
                      </Label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 6. ATS */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold">ATS Priority</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4">
                  <Select value={form.ats} onValueChange={(value) => onChange("ats", value)}>
                    <SelectTrigger className="w-48" data-testid="select-triage-ats">
                      <SelectValue placeholder="Select ATS..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">ATS 1 - Immediate</SelectItem>
                      <SelectItem value="2">ATS 2 - Very urgent</SelectItem>
                      <SelectItem value="3">ATS 3 - Urgent</SelectItem>
                      <SelectItem value="4">ATS 4 - Semi-urgent</SelectItem>
                      <SelectItem value="5">ATS 5 - Non-urgent</SelectItem>
                    </SelectContent>
                  </Select>
                  {enc.provisionalAts === "true" && (
                    <Badge variant="outline" className="text-xs">
                      Replaces provisional ATS
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 7. Care Started */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Care started</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label className="flex items-center space-x-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={form.care.analgesia}
                      onChange={(e) => onChange("care", { ...form.care, analgesia: e.target.checked })}
                    />
                    <span className="text-sm">Analgesia given</span>
                  </Label>
                  <Label className="flex items-center space-x-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={form.care.iv}
                      onChange={(e) => onChange("care", { ...form.care, iv: e.target.checked })}
                    />
                    <span className="text-sm">IV/fluids started</span>
                  </Label>
                </div>
              </CardContent>
            </Card>

            {/* 8. Clinical Notes */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Clinical Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={form.notes}
                  onChange={(e) => onChange("notes", e.target.value)}
                  placeholder="Assessment notes, observations, treatment plan..."
                  className="h-20"
                  data-testid="textarea-triage-notes"
                />
              </CardContent>
            </Card>

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

            {/* Actions */}
            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={closeTriage}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                data-testid="button-save-triage"
              >
                {isSubmitting ? "Saving..." : "Save Triage"}
              </Button>
            </div>
          </form>
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