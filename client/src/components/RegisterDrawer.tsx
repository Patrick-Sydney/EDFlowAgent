import { useState } from "react";
import { useDashboardStore } from "@/stores/dashboardStore";
import { useToast } from "@/hooks/use-toast";
import TButton from "@/components/ui/TButton";
import VitalButton from "@/components/VitalButton";

export default function RegisterDrawer() {
  const { registerOpen, closeRegister, registerPatient } = useDashboardStore();
  const { toast } = useToast();
  
  const [form, setForm] = useState({
    name: "", 
    age: "", 
    sex: "",
    complaint: "",
    nhi: "",
    isolationRequired: false,
    triageBypass: false,
    provisionalAts: false,
    ats: "",
    arrivalTime: "" // optional ISO or empty
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const onChange = (key: string, value: any) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const toggle = (key: string) => {
    setForm(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }));
  };

  // Special toggle for provisionalAts: when turning OFF, clear ATS value
  const toggleProvisionalAts = () => {
    setForm(prev => {
      const next = !prev.provisionalAts;
      return { ...prev, provisionalAts: next, ats: next ? prev.ats : "" };
    });
  };

  if (!registerOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.name || !form.age || !form.sex || !form.complaint) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields (name, age, sex, complaint)",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: form.name,
        age: Number(form.age),
        sex: form.sex,
        complaint: form.complaint,
        nhi: form.nhi || undefined,
        isolationRequired: form.isolationRequired,
        triageBypass: form.triageBypass,
        provisionalAts: form.provisionalAts,
        ats: form.ats ? Number(form.ats) : undefined,
        arrivalTime: form.arrivalTime || undefined
      };

      await registerPatient(payload);
      
      toast({
        title: "Patient Registered",
        description: `${form.name} has been successfully registered and added to the waiting area.`,
      });
      
      // Clear critical fields for quick next registration
      setForm(prev => ({ 
        ...prev, 
        name: "", 
        age: "", 
        sex: "",
        complaint: "", 
        nhi: "", 
        ats: "",
        arrivalTime: ""
      }));
      closeRegister();
    } catch (error) {
      toast({
        title: "Registration Failed",
        description: "Unable to register patient. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1100]">
      <div className="absolute inset-0 bg-black/30" onClick={closeRegister} />
      {/* RIGHT sheet — match Triage/Room widths */}
      <div className="absolute top-0 right-0 h-full w-full sm:w-[85%] md:w-[75%] lg:w-[720px] bg-white shadow-xl flex flex-col">
        {/* Header */}
        <div 
          className="px-4 py-3 border-b sticky top-0 bg-white z-10 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={closeRegister}
          data-testid="header-close-drawer"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-base sm:text-lg">Register patient</h3>
            <TButton 
              className="border bg-white min-h-[44px] min-w-[44px]" 
              onClick={(e) => { e.stopPropagation(); closeRegister(); }}
              data-testid="button-close-register"
            >
              Close
            </TButton>
          </div>
          <div className="mt-1 text-xs text-gray-600">Reception • New arrival</div>
        </div>

        {/* Match spacing with Triage/Room drawers */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto px-4 py-3"
          onKeyDown={(e) => { 
            if(e.key === 'Enter' && (e.target as HTMLElement).tagName === 'INPUT') {
              e.preventDefault(); 
            }
          }}
        >
          <div className="space-y-6">
              {/* Identity */}
              <div>
                <h4 className="font-semibold mb-2">Patient details</h4>
                <div className="grid grid-cols-2 gap-3">
                  <label className="text-sm col-span-2">
                    Full name
                    <input 
                  className="mt-1 w-full border rounded px-3 py-3 text-base min-h-[44px]"
                  value={form.name} 
                      onChange={e => onChange("name", e.target.value)} 
                      required 
                      data-testid="input-patient-name"
                    />
                  </label>
                  {/* Age — VitalButton style matching Triage */}
                  <VitalButton 
                    label="Enter Age" 
                    shortLabel="Age"
                    unit=" years" 
                    value={form.age} 
                    onChange={(v) => onChange("age", v)} 
                    min={0} 
                    max={120} 
                    maxLen={3}
                  />
                  {/* Sex — MALE and FEMALE buttons with single select */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => onChange("sex", "M")}
                      className={`px-4 py-3 rounded-xl border text-sm font-medium min-h-[44px] ${
                        form.sex === "M" 
                          ? "bg-blue-50 border-blue-300 text-blue-700" 
                          : "bg-gray-50 border-gray-200 text-gray-500"
                      }`}
                      data-testid="button-sex-male"
                    >
                      MALE
                    </button>
                    <button
                      type="button"
                      onClick={() => onChange("sex", "F")}
                      className={`px-4 py-3 rounded-xl border text-sm font-medium min-h-[44px] ${
                        form.sex === "F" 
                          ? "bg-blue-50 border-blue-300 text-blue-700" 
                          : "bg-gray-50 border-gray-200 text-gray-500"
                      }`}
                      data-testid="button-sex-female"
                    >
                      FEMALE
                    </button>
                  </div>
                  <label className="text-sm col-span-2">
                    NHI (optional)
                    <input 
                      className="mt-1 w-full border rounded px-3 py-3 text-base min-h-[44px]"
                      value={form.nhi} 
                      onChange={e => onChange("nhi", e.target.value)} 
                      data-testid="input-patient-nhi"
                    />
                  </label>
                  <label className="text-sm col-span-2">
                    Arrival time (optional ISO)
                    <input 
                      className="mt-1 w-full border rounded px-3 py-3 text-base min-h-[44px]"
                      placeholder="2025-08-26T14:30:00"
                      value={form.arrivalTime} 
                      onChange={e => onChange("arrivalTime", e.target.value)} 
                      data-testid="input-arrival-time"
                    />
                  </label>
                </div>
              </div>

              {/* Presenting complaint */}
              <div>
                <h4 className="font-semibold mb-2">Presenting complaint</h4>
                <input 
                  className="w-full border rounded px-3 py-3 text-base min-h-[44px]"
                  value={form.complaint} 
                  onChange={e => onChange("complaint", e.target.value)} 
                  required 
                  data-testid="input-presenting-complaint"
                />
              </div>

              {/* Flags */}
              <div>
                <h4 className="font-semibold mb-2">Flags</h4>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 py-2 min-h-[44px] cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="w-5 h-5"
                      checked={form.isolationRequired} 
                      onChange={() => toggle("isolationRequired")} 
                      data-testid="checkbox-isolation-required"
                    />
                    <span>Isolation required</span>
                  </label>
                  <label className="flex items-center gap-2 py-2 min-h-[44px] cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="w-5 h-5"
                      checked={form.triageBypass} 
                      onChange={() => toggle("triageBypass")} 
                      data-testid="checkbox-triage-bypass"
                    />
                    <span>Triage bypass (critical)</span>
                  </label>
                  <label className="flex items-center gap-2 py-2 min-h-[44px] cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="w-5 h-5"
                      checked={form.provisionalAts} 
                      onChange={toggleProvisionalAts} 
                      data-testid="checkbox-provisional-ats"
                    />
                    <span>Provisional ATS from ambulance</span>
                  </label>
                  {/* ATS — 1..5 buttons (disabled unless provisionalAts checked) */}
                  <div className="flex flex-col gap-1 py-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm mr-1">ATS</span>
                      {!form.provisionalAts && (
                        <span className="text-xs text-gray-500">(enable "Provisional ATS from ambulance" to set)</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="grid grid-cols-5 gap-2">
                    {[1, 2, 3, 4, 5].map(n => {
                      const selected = String(form.ats) === String(n);
                      const disabled = !form.provisionalAts;
                      return (
                        <button
                          key={n}
                          type="button"
                          aria-pressed={selected}
                          aria-disabled={disabled}
                          disabled={disabled}
                          onClick={() => { if (!disabled) onChange("ats", String(n)); }}
                          className={`px-3 py-3 rounded-xl border text-base min-w-[48px] min-h-[44px] transition ${
                            disabled ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                                     : selected ? "bg-emerald-600 text-white border-emerald-600"
                                                : "bg-white hover:bg-gray-50"
                          }`}
                          data-testid={`button-ats-${n}`}
                        >
                          {n}
                        </button>
                      );
                    })}
                      </div>
                      <button
                        type="button"
                        aria-disabled={!form.provisionalAts}
                        disabled={!form.provisionalAts}
                        className={`ml-2 px-3 py-3 rounded-xl border text-base min-h-[44px] transition ${
                          !form.provisionalAts ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                                               : "bg-white hover:bg-gray-50"
                        }`}
                        onClick={() => { if (form.provisionalAts) onChange("ats", ""); }}
                        title="Clear ATS"
                        data-testid="button-clear-ats"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                </div>
              </div>
          </div>
        </form>

        {/* Sticky footer */}
        <div className="p-3 border-t sticky bottom-0 bg-white flex gap-2">
          <TButton 
            className="bg-blue-600 hover:bg-blue-700 text-white flex-1 min-h-[44px]" 
            onClick={handleSubmit}
            disabled={isSubmitting}
            data-testid="button-register-submit"
          >
            {isSubmitting ? "Registering..." : "Register"}
          </TButton>
          <TButton 
            className="border bg-white min-h-[44px] min-w-[44px]" 
            onClick={closeRegister}
            data-testid="button-register-cancel"
          >
            Cancel
          </TButton>
        </div>
      </div>

    </div>
  );
}