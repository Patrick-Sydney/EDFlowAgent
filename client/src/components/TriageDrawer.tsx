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
    hr: "",
    rr: "",
    bpSys: "",
    bpDia: "",
    spo2: "",
    temp: "",
    pain: "",
    notes: "",
    ats: ""
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!enc) return;
    
    // Populate form with existing triage data
    setForm({
      hr: enc.triageHr ?? "",
      rr: enc.triageRr ?? "",
      bpSys: enc.triageBpSys ?? "",
      bpDia: enc.triageBpDia ?? "",
      spo2: enc.triageSpo2 ?? "",
      temp: enc.triageTemp ? (enc.triageTemp / 10).toString() : "",
      pain: enc.triagePain ?? "",
      notes: enc.triageNotes ?? "",
      ats: enc.ats ?? ""
    });
  }, [enc]);

  const onChange = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
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
        ats: form.ats ? Number(form.ats) : undefined
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

          <form onSubmit={handleSave} className="space-y-6">
            {/* Vital Signs */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Heart className="w-5 h-5" />
                  <span>Vital Signs</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <Field
                    label="HR (bpm)"
                    value={form.hr}
                    onChange={(v) => onChange("hr", v)}
                    placeholder="80"
                  />
                  <Field
                    label="RR (/min)"
                    value={form.rr}
                    onChange={(v) => onChange("rr", v)}
                    placeholder="16"
                  />
                  <Field
                    label="Temp (°C)"
                    value={form.temp}
                    onChange={(v) => onChange("temp", v)}
                    placeholder="36.5"
                    step="0.1"
                  />
                  <Field
                    label="SpO₂ (%)"
                    value={form.spo2}
                    onChange={(v) => onChange("spo2", v)}
                    placeholder="98"
                  />
                  <Field
                    label="BP Sys"
                    value={form.bpSys}
                    onChange={(v) => onChange("bpSys", v)}
                    placeholder="120"
                  />
                  <Field
                    label="BP Dia"
                    value={form.bpDia}
                    onChange={(v) => onChange("bpDia", v)}
                    placeholder="80"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Pain and Notes */}
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="pain">Pain Scale (0-10)</Label>
                    <Input
                      id="pain"
                      type="number"
                      min="0"
                      max="10"
                      value={form.pain}
                      onChange={(e) => onChange("pain", e.target.value)}
                      placeholder="0"
                      data-testid="input-triage-pain"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="notes">Clinical Notes</Label>
                    <Textarea
                      id="notes"
                      value={form.notes}
                      onChange={(e) => onChange("notes", e.target.value)}
                      placeholder="Assessment notes, observations..."
                      className="h-20"
                      data-testid="textarea-triage-notes"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ATS Assignment */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-4">
                  <div>
                    <Label>ATS Priority</Label>
                    <Select
                      value={form.ats}
                      onValueChange={(value) => onChange("ats", value)}
                    >
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
                  </div>
                  {enc.provisionalAts === "true" && (
                    <Badge variant="outline" className="text-xs">
                      Replaces provisional ATS
                    </Badge>
                  )}
                </div>
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