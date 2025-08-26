import { useEffect, useState } from "react";
import { useDashboardStore } from "@/stores/dashboardStore";
import TButton from "@/components/ui/TButton";
import NumberPad from "@/components/ui/NumberPad";
import { useToast } from "@/hooks/use-toast";

interface ReceptionEditDrawerProps {
  open: boolean;
  encounter: any;
  onClose: () => void;
}

export default function ReceptionEditDrawer({ open, encounter, onClose }: ReceptionEditDrawerProps) {
  const { saveDemographics } = useDashboardStore();
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", nhi: "", sex: "", age: "" });
  const [activePad, setActivePad] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (open && encounter) {
      setForm({
        name: encounter.name || "",
        nhi: encounter.nhi || "",
        sex: (encounter.sex || "").toLowerCase(), // 'm'|'f'
        age: encounter.age?.toString() || ""
      });
      setActivePad(false);
    }
  }, [open, encounter]);

  const on = (k: string, v: any) => setForm(s => ({ ...s, [k]: v }));

  const submit = async () => {
    if (!encounter) return;
    setPending(true);
    try {
      const response = await fetch("/api/encounters/demographics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: encounter.id,
          name: form.name,
          nhi: form.nhi,
          sex: form.sex,
          age: form.age
        })
      });
      const result = await response.json();
      
      if (!result?.ok) {
        toast({
          title: "Error",
          description: result?.error || "Failed to save demographics",
          variant: "destructive"
        });
        return;
      }
      
      toast({
        title: "Success",
        description: "Demographics updated successfully"
      });
      onClose?.();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save demographics",
        variant: "destructive"
      });
    } finally {
      setPending(false);
    }
  };

  if (!open || !encounter) return null;

  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="absolute top-0 right-0 h-full w-full sm:w-[85%] md:w-[75%] lg:w-[720px] bg-white shadow-xl flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 border-b sticky top-0 bg-white z-10">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-base sm:text-lg">Edit Demographics — {encounter.name || "Patient"}</h3>
            <TButton className="border bg-white min-h-[44px]" onClick={onClose}>Close</TButton>
          </div>
          <div className="mt-1 text-xs text-gray-600">Reception • Admin only</div>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <label className="text-sm block">
                Full name
                <input 
                  className="mt-1 w-full border rounded px-3 py-3 text-base min-h-[44px]"
                  value={form.name} 
                  onChange={e => on("name", e.target.value)} 
                  data-testid="input-edit-name"
                />
              </label>
              <label className="text-sm block">
                NHI
                <input 
                  className="mt-1 w-full border rounded px-3 py-3 text-base min-h-[44px]"
                  value={form.nhi} 
                  onChange={e => on("nhi", e.target.value)} 
                  data-testid="input-edit-nhi"
                />
              </label>
            </div>
            <div className="space-y-6">
              <div>
                <div className="text-sm mb-2">Sex</div>
                <div className="flex gap-2">
                  <button 
                    type="button"
                    className={`px-4 py-3 rounded-xl border min-h-[44px] ${
                      form.sex === "m" ? "bg-blue-50 border-blue-300 text-blue-700" : "bg-gray-50 border-gray-200"
                    }`}
                    onClick={() => on("sex", "m")}
                    data-testid="button-edit-sex-m"
                  >
                    M
                  </button>
                  <button 
                    type="button"
                    className={`px-4 py-3 rounded-xl border min-h-[44px] ${
                      form.sex === "f" ? "bg-blue-50 border-blue-300 text-blue-700" : "bg-gray-50 border-gray-200"
                    }`}
                    onClick={() => on("sex", "f")}
                    data-testid="button-edit-sex-f"
                  >
                    F
                  </button>
                </div>
              </div>

              <div className="text-sm">
                Age
                <div className="mt-1">
                  <button
                    type="button"
                    className={`px-4 py-3 rounded-xl border w-full text-left min-h-[44px] ${
                      form.age !== "" ? "bg-blue-50 border-blue-300 text-blue-700" : "bg-gray-50 border-gray-200 text-gray-500"
                    }`}
                    onClick={() => setActivePad(!activePad)}
                    data-testid="button-edit-set-age"
                  >
                    {form.age !== "" ? `Age: ${form.age}` : "Set Age"}
                  </button>
                  {activePad && (
                    <NumberPad
                      value={form.age}
                      onChange={(v) => on("age", v)}
                      onClose={() => setActivePad(false)}
                      maxLen={3}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t sticky bottom-0 bg-white flex gap-2">
          <TButton 
            className="border bg-white min-h-[44px]" 
            onClick={onClose} 
            disabled={pending}
            data-testid="button-edit-cancel"
          >
            Cancel
          </TButton>
          <TButton 
            className="bg-blue-600 text-white flex-1 min-h-[44px]" 
            onClick={submit} 
            disabled={pending}
            data-testid="button-edit-save"
          >
            {pending ? "Saving…" : "Save changes"}
          </TButton>
        </div>
      </div>
    </div>
  );
}