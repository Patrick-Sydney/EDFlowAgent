import React, { useMemo } from "react";
import RNMobileLaneNav, { LanePill } from "@/components/rn/RNMobileLaneNav";
import { RNPatientRow } from "@/components/rn/RNPatientRow";

export type PatientLite = {
  id: string;
  givenName?: string; familyName?: string; displayName?: string;
  age?: number; sex?: string;
  chiefComplaint?: string;
  waitingFor?: string;       // e.g. "5h 15m waiting"
  ews?: number;
  ats?: 1|2|3|4|5;
  roomName?: string | null;
};

export type Lane = { id: string; label: string; patients: PatientLite[] };


export default function RNViewMobile({ lanes, onStartTriage, onOpenObs, onOpenCard, onOpenVitals, onOpenIdentity }: {
  lanes: Lane[];
  onStartTriage: (p: PatientLite) => void;
  onOpenObs: (p: PatientLite) => void;
  onOpenCard: (p: PatientLite) => void;
  onOpenVitals: (p: PatientLite) => void;
  onOpenIdentity?: (p: PatientLite) => void;
}) {
  const pills: LanePill[] = useMemo(
    () => lanes.map((l) => ({ id: l.id, label: l.label, count: l.patients.length })),
    [lanes]
  );

  return (
    <div className="pb-24">
      <RNMobileLaneNav lanes={pills} stickyOffset={48} />

      <div className="mx-3 space-y-8 md:grid md:grid-cols-2 md:gap-6 md:space-y-0">
        {lanes.map((lane) => (
          <section key={lane.id} id={lane.id} className="scroll-mt-16">
            <div className="sticky top-[calc(env(safe-area-inset-top)+104px)] z-20 bg-background border-b border-border px-2 py-2">
              <h2 className="text-base font-semibold">
                {lane.label} <span className="text-muted-foreground">({lane.patients.length})</span>
              </h2>
            </div>
            <div className="mt-3 space-y-3">
              {lane.patients.map((p) => (
                <RNPatientRow
                  key={p.id}
                  p={p}
                  laneLabel={lane.label}
                  onStartTriage={onStartTriage}
                  onOpenObs={onOpenObs}
                  onOpenCard={onOpenCard}
                  onOpenVitals={onOpenVitals}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}