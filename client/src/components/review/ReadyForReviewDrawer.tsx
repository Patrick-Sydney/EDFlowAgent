import React, { useState } from "react";
import { journeyStore } from "../../stores/journeyStore";
import { useDashboardStore } from "../../stores/dashboardStore";

export default function ReadyForReviewDrawer({ 
  patientId, 
  onSaved 
}: { 
  patientId: string | number; 
  onSaved?: () => void; 
}) {
  const [summary, setSummary] = useState("");
  const [saving, setSaving] = useState(false);
  const { updateEncounter, encounters } = useDashboardStore();

  const handleSave = async () => {
    setSaving(true);
    try {
      // Add journey record
      journeyStore.add(String(patientId), { 
        kind: "clinical", 
        label: "Ready for review", 
        detail: summary || undefined 
      });

      // Find and update the encounter to transition to Review/Decision lane
      const currentEncounter = encounters.find(e => String(e.id) === String(patientId));
      if (currentEncounter) {
        updateEncounter({
          ...currentEncounter,
          lane: "review"
        });
      }

      // Broadcast event for any UI updates
      window.dispatchEvent(new CustomEvent("patient:laneUpdated", { 
        detail: { patientId, newLane: "review" } 
      }));

      onSaved?.();
    } catch (error) {
      console.error("Failed to update patient status:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        Mark this patient as ready for clinical review and decision-making. 
        They will be moved to the Review/Decision lane.
      </div>
      
      <div>
        <div className="text-xs text-muted-foreground mb-2">Clinical Summary (optional)</div>
        <textarea 
          className="w-full rounded-xl border px-3 py-2 min-h-[100px] resize-none" 
          value={summary} 
          onChange={e => setSummary(e.target.value)} 
          placeholder="Brief summary of assessment, findings, or recommendations for review..."
          data-testid="textarea-clinical-summary"
        />
      </div>

      <div className="flex items-center justify-end gap-2">
        <button 
          className="rounded-full border px-4 py-2 text-sm" 
          onClick={() => setSummary("")}
          data-testid="button-clear-summary"
        >
          Clear
        </button>
        <button
          disabled={saving}
          className="rounded-full px-4 py-2 text-sm text-white bg-green-600 disabled:opacity-50"
          onClick={handleSave}
          data-testid="button-mark-ready-for-review"
        >
          {saving ? "Saving..." : "Mark Ready for Review"}
        </button>
      </div>
    </div>
  );
}