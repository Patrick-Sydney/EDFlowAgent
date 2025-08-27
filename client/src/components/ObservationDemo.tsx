import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboardStore } from "@/stores/dashboardStore";
import { Activity, Thermometer } from "lucide-react";

/**
 * Demo component to test intelligent observation management
 * Shows how new observations automatically trigger EWS calculation and monitoring policy
 */
export function ObservationDemo() {
  const { encounters, addObservation } = useDashboardStore();
  
  console.log('ObservationDemo rendering, encounters count:', encounters?.length);
  
  // Find a patient in roomed stage for demo, prefer Alex Taylor
  const demoPatient = encounters.find(e => e.name === 'Alex Taylor') || encounters.find(e => e.lane === 'roomed');
  console.log('Demo patient found:', demoPatient?.name, demoPatient?.id);
  
  if (!demoPatient) {
    return (
      <Card className="w-80">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Monitoring Demo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No roomed patients available for observation demo.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  const addHighRiskVitals = () => {
    console.log('🔴 HIGH RISK BUTTON CLICKED!');
    console.log('Adding high-risk vitals for patient:', demoPatient.name, demoPatient.id);
    const timestamp = new Date().toISOString();
    
    // Add high-risk vitals that should trigger frequent monitoring
    const observations = [
      { id: `hr-${Date.now()}`, type: "HR" as const, value: "130", unit: "bpm", takenAt: timestamp, recordedBy: "Demo" },
      { id: `bp-${Date.now()+1}`, type: "BP" as const, value: "85/45", unit: "mmHg", takenAt: timestamp, recordedBy: "Demo" },
      { id: `temp-${Date.now()+2}`, type: "Temp" as const, value: "39.2", unit: "°C", takenAt: timestamp, recordedBy: "Demo" },
      { id: `rr-${Date.now()+3}`, type: "RR" as const, value: "28", unit: "/min", takenAt: timestamp, recordedBy: "Demo" },
      { id: `spo2-${Date.now()+4}`, type: "SpO2" as const, value: "89", unit: "%", takenAt: timestamp, recordedBy: "Demo" }
    ];
    
    observations.forEach(obs => {
      console.log('Adding observation:', obs);
      addObservation(demoPatient.id, obs);
    });
    console.log('High-risk vitals added. Check patient card for updates.');
  };
  
  const addNormalVitals = () => {
    console.log('🟢 NORMAL VITALS BUTTON CLICKED!');
    console.log('Adding normal vitals for patient:', demoPatient.name, demoPatient.id);
    const timestamp = new Date().toISOString();
    
    // Add normal vitals that should trigger routine monitoring
    const observations = [
      { id: `hr-${Date.now()}`, type: "HR" as const, value: "75", unit: "bpm", takenAt: timestamp, recordedBy: "Demo" },
      { id: `bp-${Date.now()+1}`, type: "BP" as const, value: "120/80", unit: "mmHg", takenAt: timestamp, recordedBy: "Demo" },
      { id: `temp-${Date.now()+2}`, type: "Temp" as const, value: "37.0", unit: "°C", takenAt: timestamp, recordedBy: "Demo" },
      { id: `rr-${Date.now()+3}`, type: "RR" as const, value: "16", unit: "/min", takenAt: timestamp, recordedBy: "Demo" },
      { id: `spo2-${Date.now()+4}`, type: "SpO2" as const, value: "98", unit: "%", takenAt: timestamp, recordedBy: "Demo" }
    ];
    
    observations.forEach(obs => {
      console.log('Adding observation:', obs);
      addObservation(demoPatient.id, obs);
    });
    console.log('Normal vitals added. Check patient card for updates.');
  };
  
  return (
    <Card className="w-80">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Thermometer className="h-4 w-4" />
          Intelligent Monitoring Demo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-sm">
          <div className="font-medium">{demoPatient.name}</div>
          <div className="text-muted-foreground">Test patient for monitoring system</div>
        </div>
        
        <div className="flex flex-col gap-2">
          <Button 
            size="sm" 
            onClick={addHighRiskVitals}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Add High-Risk Vitals
          </Button>
          <div className="text-xs text-muted-foreground">
            HR 130, BP 85/45, Temp 39.2°C, RR 28, SpO2 89%
            → Should trigger 15min monitoring
          </div>
        </div>
        
        <div className="flex flex-col gap-2">
          <Button 
            size="sm" 
            onClick={addNormalVitals}
            variant="outline"
          >
            Add Normal Vitals  
          </Button>
          <div className="text-xs text-muted-foreground">
            HR 75, BP 120/80, Temp 37.0°C, RR 16, SpO2 98%
            → Should trigger 2hr monitoring
          </div>
        </div>
        
        <div className="text-xs text-muted-foreground pt-2 border-t">
          💡 Add vitals and expand the patient card to see:
          <br />• Intelligent EWS calculation with risk bands
          <br />• Real next observation times (not just intervals)
          <br />• Clinical reasoning display
        </div>
      </CardContent>
    </Card>
  );
}