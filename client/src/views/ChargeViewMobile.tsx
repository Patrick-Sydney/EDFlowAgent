import React, { useMemo } from "react";
import RNMobileLaneNav, { LanePill } from "@/components/rn/RNMobileLaneNav";
import PatientCardExpandable from "@/components/PatientCardExpandable";

export type ChargePatient = {
  id: string;
  displayName?: string; 
  givenName?: string; 
  familyName?: string;
  age?: number; 
  sex?: string;
  chiefComplaint?: string;
  waitingFor?: string;
  ews?: number;
  ats?: 1|2|3|4|5;
  roomName?: string | null;
  triageStartedAt?: string | null;
  arrivalAt?: string;
};

export type ChargeLane = { 
  id: 'waiting' | 'intriage' | 'room'; 
  label: string; 
  patients: ChargePatient[] 
};

export default function ChargeViewMobile({
  lanes,
  onStartTriage,
  onAssignRoom,
  onOpenCard,
  onAddObs,
  onOpenIdentity,
}: {
  lanes: ChargeLane[];
  onStartTriage: (p: ChargePatient) => void;
  onAssignRoom: (p: ChargePatient) => void;
  onOpenCard: (p: ChargePatient) => void;
  onAddObs: (p: ChargePatient) => void;
  onOpenIdentity?: (p: ChargePatient) => void;
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
                const ageSex = p.age ? `${p.age}${p.sex ? ` ${p.sex}` : ''}` : (p.sex ?? undefined);
                const status = lane.id === 'room' ? (p.roomName ?? 'Rooming') : lane.label;
                const primaryLabel =
                  lane.id === "waiting"  ? "Start Triage" :
                  lane.id === "intriage" ? "Assign Room" : undefined;
                
                return (
                  <PatientCardExpandable
                    key={p.id}
                    role="Charge"
                    name={name}
                    ageSex={ageSex}
                    status={status}
                    timer={p.waitingFor}
                    complaint={p.chiefComplaint}
                    ews={p.ews}
                    ats={p.ats}
                    patientId={p.id}
                    primaryLabel={primaryLabel}
                    onPrimary={
                      lane.id === "waiting" ? () => onStartTriage(p) :
                      lane.id === "intriage" ? () => onAssignRoom(p) :
                      undefined
                    }
                    onAssignRoom={() => onAssignRoom(p)}
                    onAddObs={() => onAddObs(p)}
                    onOpenFull={() => onOpenCard(p)}
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