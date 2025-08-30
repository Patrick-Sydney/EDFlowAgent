import React from "react";
import { useVitalsLast } from "../../stores/vitalsStore";

export default function VitalsCapsuleLive({
  patientId,
  onOpenTimeline,
  onAddObs,
}: {
  patientId: string | number;
  onOpenTimeline?: () => void;
  onAddObs?: () => void;
}) {
  const last = useVitalsLast(patientId);

  const Item = ({ label, val, unit }: { label: string; val?: number; unit?: string }) => (
    <div className="rounded-lg border p-2 text-center">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="text-sm font-medium">
        {val == null ? "—" : val}{val == null || !unit ? "" : ` ${unit}`}
      </div>
    </div>
  );

  return (
    <div className="rounded-xl border p-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">Vitals</div>
        <div className="flex gap-2">
          {onOpenTimeline && (
            <button className="rounded-full border px-3 py-2 text-sm" onClick={onOpenTimeline}>Timeline</button>
          )}
          {onAddObs && (
            <button className="rounded-full bg-primary text-primary-foreground px-3 py-2 text-sm" onClick={onAddObs}>+ Obs</button>
          )}
        </div>
      </div>
      <div className="mt-2 grid grid-cols-5 gap-2">
        <Item label="RR"   val={last?.rr}   unit="/m"   />
        <Item label="SpO₂" val={last?.spo2} unit="%"    />
        <Item label="HR"   val={last?.hr}   unit="bpm"  />
        <Item label="SBP"  val={last?.sbp}  unit="mmHg" />
        <Item label="Temp" val={last?.temp} unit="°C"   />
      </div>
      {last?.t && (
        <div className="mt-2 text-[11px] text-muted-foreground">
          Last set {new Date(last.t).toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}