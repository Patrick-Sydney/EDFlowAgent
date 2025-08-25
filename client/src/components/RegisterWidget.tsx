import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboardStore } from "@/stores/dashboardStore";
import { useToast } from "@/hooks/use-toast";
import { UserPlus } from "lucide-react";

export default function RegisterWidget() {
  const registerPatient = useDashboardStore((state) => state.registerPatient);
  const { toast } = useToast();
  
  const [form, setForm] = useState({
    name: "",
    age: "",
    sex: "F",
    complaint: "",
    nhi: "",
    isolationRequired: false,
    triageBypass: false,
    provisionalAts: false,
    ats: ""
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const onChange = (key: string, value: any) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.name || !form.age || !form.complaint) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields (name, age, complaint)",
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
        ats: (form.ats && form.ats !== "") ? Number(form.ats) : undefined
      };

      await registerPatient(payload);
      
      toast({
        title: "Patient Registered",
        description: `${form.name} has been successfully registered and added to the waiting area.`,
      });
      
      // Clear form except for flags (for speed)
      setForm({
        ...form,
        name: "",
        age: "",
        complaint: "",
        nhi: "",
        ats: ""
      });
    } catch (error) {
      toast({
        title: "Registration Failed",
        description: "Failed to register patient. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <UserPlus className="w-5 h-5" />
          <span>Register Incoming Patient</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => onChange("name", e.target.value)}
                required
                data-testid="input-patient-name"
              />
            </div>
            
            <div>
              <Label htmlFor="age">Age *</Label>
              <Input
                id="age"
                type="number"
                min="0"
                max="150"
                value={form.age}
                onChange={(e) => onChange("age", e.target.value)}
                required
                data-testid="input-patient-age"
              />
            </div>
            
            <div>
              <Label htmlFor="sex">Sex</Label>
              <Select value={form.sex || "F"} onValueChange={(value) => onChange("sex", value)}>
                <SelectTrigger data-testid="select-patient-sex">
                  <SelectValue placeholder="Select sex" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="F">Female</SelectItem>
                  <SelectItem value="M">Male</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="nhi">NHI (optional)</Label>
              <Input
                id="nhi"
                value={form.nhi}
                onChange={(e) => onChange("nhi", e.target.value)}
                placeholder="e.g. ABC1234"
                data-testid="input-patient-nhi"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="complaint">Presenting Complaint *</Label>
            <Input
              id="complaint"
              value={form.complaint}
              onChange={(e) => onChange("complaint", e.target.value)}
              required
              placeholder="e.g. Chest pain, onset 2 hours"
              data-testid="input-patient-complaint"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isolation"
                  checked={form.isolationRequired}
                  onCheckedChange={(checked) => onChange("isolationRequired", checked)}
                  data-testid="checkbox-isolation"
                />
                <Label htmlFor="isolation" className="text-sm">Isolation required</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="triage-bypass"
                  checked={form.triageBypass}
                  onCheckedChange={(checked) => onChange("triageBypass", checked)}
                  data-testid="checkbox-triage-bypass"
                />
                <Label htmlFor="triage-bypass" className="text-sm">Triage bypass (critical)</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="provisional-ats"
                  checked={form.provisionalAts}
                  onCheckedChange={(checked) => onChange("provisionalAts", checked)}
                  data-testid="checkbox-provisional-ats"
                />
                <Label htmlFor="provisional-ats" className="text-sm">Provisional ATS from ambulance</Label>
              </div>
            </div>
            
            <div>
              <Label htmlFor="ats">ATS Score (if provisional)</Label>
              <Select 
                value={form.ats ? String(form.ats) : undefined} 
                onValueChange={(value) => onChange("ats", value ? Number(value) : "")}
              >
                <SelectTrigger data-testid="select-ats-score">
                  <SelectValue placeholder="No ATS" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">ATS 1 - Immediate</SelectItem>
                  <SelectItem value="2">ATS 2 - Urgent</SelectItem>
                  <SelectItem value="3">ATS 3 - Standard</SelectItem>
                  <SelectItem value="4">ATS 4 - Low urgent</SelectItem>
                  <SelectItem value="5">ATS 5 - Non-urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setForm({
                name: "",
                age: "",
                sex: "F",
                complaint: "",
                nhi: "",
                isolationRequired: false,
                triageBypass: false,
                provisionalAts: false,
                ats: ""
              })}
            >
              Clear
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              data-testid="button-register-patient"
            >
              {isSubmitting ? "Registering..." : "Register Patient"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}