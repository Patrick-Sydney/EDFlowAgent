import { type Encounter, ATS_COLORS } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bed, Check, Stethoscope } from "lucide-react";
import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PatientCardProps {
  encounter: Encounter;
}

export function PatientCard({ encounter }: PatientCardProps) {
  const { toast } = useToast();
  const [isAssigningRoom, setIsAssigningRoom] = useState(false);
  const [isMarkingReady, setIsMarkingReady] = useState(false);
  const [roomNumber, setRoomNumber] = useState("");
  const [disposition, setDisposition] = useState("");
  const [showRoomDialog, setShowRoomDialog] = useState(false);
  const [showReadyDialog, setShowReadyDialog] = useState(false);
  const [isMarkingResultsComplete, setIsMarkingResultsComplete] = useState(false);
  const [isStartingTriage, setIsStartingTriage] = useState(false);
  const [siteConfig, setSiteConfig] = useState<any>(null);

  // Calculate time since arrival
  const getTimeInED = () => {
    const now = new Date();
    const arrival = new Date(encounter.arrivalTime);
    const diffMinutes = Math.floor((now.getTime() - arrival.getTime()) / 60000);
    
    if (diffMinutes < 60) {
      return `${diffMinutes}m`;
    } else {
      const hours = Math.floor(diffMinutes / 60);
      const mins = diffMinutes % 60;
      return `${hours}h ${mins}m`;
    }
  };

  const getTimeColor = () => {
    const now = new Date();
    const arrival = new Date(encounter.arrivalTime);
    const diffMinutes = Math.floor((now.getTime() - arrival.getTime()) / 60000);
    
    if (diffMinutes > 240) return "bg-red-100 text-red-800 font-bold";
    if (diffMinutes > 120) return "bg-amber-100 text-amber-800";
    return "bg-yellow-100 text-yellow-800";
  };

  const handleAssignRoom = async () => {
    if (!roomNumber.trim()) {
      toast({
        title: "Error",
        description: "Please enter a room number.",
        variant: "destructive",
      });
      return;
    }

    setIsAssigningRoom(true);
    try {
      await apiRequest('POST', '/api/actions/assign-room', {
        id: encounter.id,
        room: roomNumber.trim()
      });
      
      toast({
        title: "Room Assigned",
        description: `Patient assigned to ${roomNumber}`,
      });
      
      setShowRoomDialog(false);
      setRoomNumber("");
    } catch (error) {
      toast({
        title: "Error", 
        description: "Failed to assign room",
        variant: "destructive",
      });
    } finally {
      setIsAssigningRoom(false);
    }
  };

  const handleMarkReady = async () => {
    if (!disposition.trim()) {
      toast({
        title: "Error",
        description: "Please enter disposition.",
        variant: "destructive", 
      });
      return;
    }

    setIsMarkingReady(true);
    try {
      await apiRequest('POST', '/api/actions/mark-ready', {
        id: encounter.id,
        disposition: disposition.trim()
      });
      
      toast({
        title: "Patient Ready",
        description: `Marked ready: ${disposition}`,
      });
      
      setShowReadyDialog(false);
      setDisposition("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark ready",
        variant: "destructive",
      });
    } finally {
      setIsMarkingReady(false);
    }
  };

  const handleMarkResultsComplete = async () => {
    setIsMarkingResultsComplete(true);
    try {
      await apiRequest('POST', '/api/actions/results-complete', {
        id: encounter.id
      });
      
      toast({
        title: "Results Complete",
        description: "Diagnostic results have been marked complete",
      });
    } catch (error) {
      toast({
        title: "Error", 
        description: "Failed to mark results complete",
        variant: "destructive",
      });
    } finally {
      setIsMarkingResultsComplete(false);
    }
  };

  const handleStartTriage = async () => {
    setIsStartingTriage(true);
    try {
      await apiRequest('POST', '/api/actions/start-triage', {
        id: encounter.id
      });
      
      toast({
        title: "Triage Started",
        description: "Patient moved to triage",
      });
    } catch (error) {
      toast({
        title: "Error", 
        description: "Failed to start triage",
        variant: "destructive",
      });
    } finally {
      setIsStartingTriage(false);
    }
  };

  // Fetch site configuration on component mount
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch('/api/config');
        const config = await response.json();
        setSiteConfig(config);
      } catch (error) {
        console.error('Failed to fetch site config:', error);
      }
    };
    fetchConfig();
  }, []);

  const atsColorClass = ATS_COLORS[encounter.ats as keyof typeof ATS_COLORS] || "bg-gray-500";

  return (
    <div className="patient-card bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200" data-testid={`card-patient-${encounter.id}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className={`w-3 h-3 rounded-full ${atsColorClass.replace('bg-', 'bg-')}`}></div>
          <div>
            <div className="font-medium text-gray-900" data-testid={`text-name-${encounter.id}`}>{encounter.name}</div>
            <div className="text-sm text-gray-600" data-testid={`text-demographics-${encounter.id}`}>{encounter.age}{encounter.sex}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs font-medium text-gray-900" data-testid={`text-nhi-${encounter.id}`}>{encounter.nhi}</div>
          <Badge 
            className={`text-xs font-medium ${atsColorClass} text-white`}
            data-testid={`badge-ats-${encounter.id}`}
          >
            ATS {encounter.ats}
          </Badge>
        </div>
      </div>
      
      <div className="text-sm text-gray-700 mb-3" data-testid={`text-complaint-${encounter.id}`}>{encounter.complaint}</div>
      
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs text-gray-500" data-testid={`text-arrival-${encounter.id}`}>
          Arrived: {new Date(encounter.arrivalTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
        </div>
        <div className={`text-xs px-2 py-1 rounded-full ${getTimeColor()}`} data-testid={`text-time-${encounter.id}`}>
          {getTimeInED()}
        </div>
      </div>

      {encounter.room && (
        <div className="mb-3">
          <Badge className="bg-medical-blue text-white" data-testid={`badge-room-${encounter.id}`}>
            {encounter.room}
          </Badge>
        </div>
      )}

      {encounter.provider && (
        <div className="mb-3">
          <Badge variant="outline" className="text-purple-800 border-purple-200" data-testid={`badge-provider-${encounter.id}`}>
            {encounter.provider}
          </Badge>
        </div>
      )}

      {encounter.disposition && (
        <div className="mb-3">
          <div className="text-xs text-amber-700 font-medium" data-testid={`text-disposition-${encounter.id}`}>
            📋 {encounter.disposition}
          </div>
        </div>
      )}

      {/* Clinical Action Buttons Based on Lane */}
      <div className="flex space-x-2">
        {/* Waiting → Start Triage (default) */}
        {encounter.lane === "waiting" && 
         !((encounter.triageBypass === "true" || encounter.isolationRequired === "true") || siteConfig?.triageInRoom) && (
          <Button 
            size="sm" 
            onClick={handleStartTriage}
            disabled={isStartingTriage}
            className="flex-1 bg-sky-600 hover:bg-sky-700 text-white"
            data-testid={`button-start-triage-${encounter.id}`}
          >
            <Stethoscope className="w-3 h-3 mr-1" />
            {isStartingTriage ? "Starting..." : "Start Triage"}
          </Button>
        )}

        {/* Waiting → Assign Room (only for exceptions) */}
        {encounter.lane === "waiting" && 
         ((encounter.triageBypass === "true" || encounter.isolationRequired === "true") || siteConfig?.triageInRoom) && (
          <Dialog open={showRoomDialog} onOpenChange={setShowRoomDialog}>
            <DialogTrigger asChild>
              <Button 
                size="sm" 
                className="flex-1 bg-medical-blue hover:bg-blue-700 text-white"
                data-testid={`button-assign-room-${encounter.id}`}
              >
                <Bed className="w-3 h-3 mr-1" />
                Assign Room
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Assign Room - {encounter.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="room">Room Number</Label>
                  <Input
                    id="room"
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    placeholder="e.g., Room 8"
                    data-testid="input-room-number"
                  />
                </div>
                <div className="flex space-x-2">
                  <Button 
                    onClick={handleAssignRoom}
                    disabled={isAssigningRoom}
                    className="flex-1"
                    data-testid="button-confirm-assign-room"
                  >
                    {isAssigningRoom ? "Assigning..." : "Assign"}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowRoomDialog(false)}
                    className="flex-1"
                    data-testid="button-cancel-assign-room"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Triage → Assign Room */}
        {encounter.lane === "triage" && (
          <Dialog open={showRoomDialog} onOpenChange={setShowRoomDialog}>
            <DialogTrigger asChild>
              <Button 
                size="sm" 
                className="flex-1 bg-medical-blue hover:bg-blue-700 text-white"
                data-testid={`button-assign-room-${encounter.id}`}
              >
                <Bed className="w-3 h-3 mr-1" />
                Assign Room
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Assign Room - {encounter.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="room">Room Number</Label>
                  <Input
                    id="room"
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    placeholder="e.g., Room 8"
                    data-testid="input-room-number"
                  />
                </div>
                <div className="flex space-x-2">
                  <Button 
                    onClick={handleAssignRoom}
                    disabled={isAssigningRoom}
                    className="flex-1"
                    data-testid="button-confirm-assign-room"
                  >
                    {isAssigningRoom ? "Assigning..." : "Assign"}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowRoomDialog(false)}
                    className="flex-1"
                    data-testid="button-cancel-assign-room"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Roomed → Mark Ready */}
        {encounter.lane === "roomed" && (
          <Dialog open={showReadyDialog} onOpenChange={setShowReadyDialog}>
            <DialogTrigger asChild>
              <Button 
                size="sm" 
                className="flex-1 bg-medical-green hover:bg-green-700 text-white"
                data-testid={`button-mark-ready-${encounter.id}`}
              >
                <Check className="w-3 h-3 mr-1" />
                Mark Ready
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Mark Ready - {encounter.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="disposition">Disposition</Label>
                  <Input
                    id="disposition"
                    value={disposition}
                    onChange={(e) => setDisposition(e.target.value)}
                    placeholder="e.g., Discharge home with medications"
                    data-testid="input-disposition"
                  />
                </div>
                <div className="flex space-x-2">
                  <Button 
                    onClick={handleMarkReady}
                    disabled={isMarkingReady}
                    className="flex-1"
                    data-testid="button-confirm-mark-ready"
                  >
                    {isMarkingReady ? "Processing..." : "Mark Ready"}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowReadyDialog(false)}
                    className="flex-1"
                    data-testid="button-cancel-mark-ready"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Diagnostics → Mark Results Complete or Mark Ready if complete */}
        {encounter.lane === "diagnostics" && (
          <>
            {encounter.resultsStatus === "complete" ? (
              <Dialog open={showReadyDialog} onOpenChange={setShowReadyDialog}>
                <DialogTrigger asChild>
                  <Button 
                    size="sm" 
                    className="flex-1 bg-medical-green hover:bg-green-700 text-white"
                    data-testid={`button-mark-ready-${encounter.id}`}
                  >
                    <Check className="w-3 h-3 mr-1" />
                    Mark Ready
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Mark Ready - {encounter.name}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="disposition">Disposition</Label>
                      <Input
                        id="disposition"
                        value={disposition}
                        onChange={(e) => setDisposition(e.target.value)}
                        placeholder="e.g., Discharge home with medications"
                        data-testid="input-disposition"
                      />
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        onClick={handleMarkReady}
                        disabled={isMarkingReady}
                        className="flex-1"
                        data-testid="button-confirm-mark-ready"
                      >
                        {isMarkingReady ? "Processing..." : "Mark Ready"}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setShowReadyDialog(false)}
                        className="flex-1"
                        data-testid="button-cancel-mark-ready"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            ) : (
              <Button 
                size="sm" 
                onClick={handleMarkResultsComplete}
                disabled={isMarkingResultsComplete}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white"
                data-testid={`button-mark-results-complete-${encounter.id}`}
              >
                {isMarkingResultsComplete ? "Processing..." : "Mark Results Complete"}
              </Button>
            )}
          </>
        )}

        {/* Review/Decision → Mark Ready */}
        {encounter.lane === "review" && (
          <Dialog open={showReadyDialog} onOpenChange={setShowReadyDialog}>
            <DialogTrigger asChild>
              <Button 
                size="sm" 
                className="flex-1 bg-medical-green hover:bg-green-700 text-white"
                data-testid={`button-mark-ready-${encounter.id}`}
              >
                <Check className="w-3 h-3 mr-1" />
                Mark Ready
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Mark Ready - {encounter.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="disposition">Disposition</Label>
                  <Input
                    id="disposition"
                    value={disposition}
                    onChange={(e) => setDisposition(e.target.value)}
                    placeholder="e.g., Discharge home with medications"
                    data-testid="input-disposition"
                  />
                </div>
                <div className="flex space-x-2">
                  <Button 
                    onClick={handleMarkReady}
                    disabled={isMarkingReady}
                    className="flex-1"
                    data-testid="button-confirm-mark-ready"
                  >
                    {isMarkingReady ? "Processing..." : "Mark Ready"}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowReadyDialog(false)}
                    className="flex-1"
                    data-testid="button-cancel-mark-ready"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Ready/Discharged/Admitted → No actions shown */}
      </div>
    </div>
  );
}
