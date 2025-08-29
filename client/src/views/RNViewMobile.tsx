import React, { useMemo } from "react";
import RNMobileLaneNav, { LanePill } from "@/components/rn/RNMobileLaneNav";
import { PatientCardCompact } from "@/components/rn/PatientCardCompact";

export type PatientLite = {
  id: string;
  givenName?: string; familyName?: string; displayName?: string;
  age?: number; sex?: string;
  chiefComplaint?: string;
  waitingFor?: string;       // e.g. "5h 15m waiting"
  ews?: number;
  roomName?: string | null;
};

export type Lane = { id: string; label: string; patients: PatientLite[] };

export default function RNViewMobile({ lanes, onStartTriage, onOpenObs, onOpenCard }: {
  lanes: Lane[];
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
              {lane.patients.map((p) => {
                const name = p.displayName || `${p.givenName ?? ''} ${p.familyName ?? ''}`.trim() || '—';
                const status = lane.label === "Room" ? (p.roomName ?? "Rooming") : lane.label;
                const primaryLabel = lane.label === "Waiting" ? "Start Triage" : "+ Obs";
                const onPrimary = () => (lane.label === "Waiting" ? onStartTriage(p) : onOpenObs(p));
                const ageSex = p.age ? `${p.age}${p.sex ? ` ${p.sex}` : ''}` : (p.sex ?? undefined);
                return (
                  <PatientCardCompact
                    key={p.id}
                    name={name}
                    status={status}
                    timer={p.waitingFor}
                    complaint={p.chiefComplaint}
                    ews={p.ews}
                    ageSex={ageSex}
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