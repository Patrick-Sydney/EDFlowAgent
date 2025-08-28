import React, { useMemo } from "react";
import RNMobileLaneNav, { LanePill } from "@/components/rn/RNMobileLaneNav";
import { PatientCardCompact } from "@/components/rn/PatientCardCompact";

// Shape the data your page already has
export type PatientLite = {
  id: string;
  givenName?: string; familyName?: string; displayName?: string;
  chiefComplaint?: string;
  waitingFor?: string;       // e.g. "23m waiting"
  ews?: number;
  roomName?: string | null;
};

export type Lane = { id: string; label: string; patients: PatientLite[] };

export default function RNViewMobile({ lanes, onStartTriage, onOpenObs, onOpenCard }: {
  lanes: Lane[];                                       // Waiting / InTriage / Room
  onStartTriage: (p: PatientLite) => void;
  onOpenObs: (p: PatientLite) => void;
  onOpenCard: (p: PatientLite) => void;
}) {
  const pills: LanePill[] = useMemo(
    () => lanes.map((l) => ({ id: l.id, label: l.label, count: l.patients.length })),
    [lanes]
  );

  return (
    <div className="pb-24">
      <RNMobileLaneNav lanes={pills} />

      <div className="mx-3 space-y-6 md:grid md:grid-cols-2 md:gap-6 md:space-y-0">
        {lanes.map((lane) => (
          <section key={lane.id} id={lane.id} className="scroll-mt-24">
            <div className="sticky top-[calc(env(safe-area-inset-top)+132px)] z-20 bg-background/85 backdrop-blur px-1 py-2">
              <h2 className="text-base font-semibold">
                {lane.label} <span className="text-muted-foreground">({lane.patients.length})</span>
              </h2>
            </div>
            <div className="mt-2 space-y-3">
              {lane.patients.map((p) => {
                const name = p.displayName || `${p.givenName ?? ''} ${p.familyName ?? ''}`.trim() || '—';
                const status = lane.label === "Room" ? (p.roomName ?? "Rooming") : lane.label;
                const primaryLabel = lane.label === "Waiting" ? "Start Triage" : "+ Obs";
                const onPrimary = () => (lane.label === "Waiting" ? onStartTriage(p) : onOpenObs(p));
                return (
                  <PatientCardCompact
                    key={p.id}
                    name={name}
                    status={status}
                    timer={p.waitingFor}
                    complaint={p.chiefComplaint}
                    ews={p.ews}
                    primaryLabel={primaryLabel}
                    onPrimary={onPrimary}
                    onOpen={() => onOpenCard(p)}
                  />
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}