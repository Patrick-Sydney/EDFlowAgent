import React, { useMemo, useCallback } from "react";
import RNMobileLaneNav, { LanePill } from "@/components/rn/RNMobileLaneNav";
import PatientCardExpandable from "@/components/PatientCardExpandable";

export type MDPatient = {
  id: string;
  displayName?: string; 
  givenName?: string; 
  familyName?: string;
  age?: number; 
  sex?: string;
  chiefComplaint?: string;
  ews?: number;
  ats?: 1|2|3|4|5;
  roomName?: string | null;
  mdWaiting?: string;
  resultsReady?: boolean;
  dispoReady?: boolean;
  isolationRequired?: boolean;
};

export type MDLane = { 
  id: 'worklist' | 'results' | 'dispo'; 
  label: string; 
  patients: MDPatient[] 
};

export default function MDViewMobile({ 
  lanes, 
  onSeeNow, 
  onOpenResults, 
  onOrderSet, 
  onDispo, 
  onOpenCard,
  onOpenIdentity 
}: {
  lanes: MDLane[];
  onSeeNow: (p: MDPatient) => void;
  onOpenResults: (p: MDPatient) => void;
  onOrderSet: (p: MDPatient) => void;
  onDispo: (p: MDPatient) => void;
  onOpenCard: (p: MDPatient) => void;
  onOpenIdentity?: (p: MDPatient) => void;
}) {
  const pills: LanePill[] = useMemo(
    () => lanes.map((l) => ({ id: l.id, label: l.label, count: l.patients.length })),
    [lanes]
  );

  const primaryMap: Record<MDLane['id'], { label: string; fn: (p: MDPatient) => void }> = {
    worklist: { label: 'See Now', fn: onSeeNow },
    results:  { label: 'Open Results', fn: onOpenResults },
    dispo:    { label: 'Disposition', fn: onDispo },
  };

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
                const status = lane.id === 'worklist' ? (p.roomName ? `Room ${p.roomName}` : 'To see') : lane.id === 'results' ? 'Results' : 'Dispo';
                const { label, fn } = primaryMap[lane.id];
                
                // Memoized handlers to prevent infinite re-renders
                const handlePrimary = useCallback(() => fn(p), [fn, p]);
                const handleOrderSet = useCallback(() => onOrderSet(p), [onOrderSet, p]);
                const handleOpenFull = useCallback(() => onOpenCard(p), [onOpenCard, p]);
                
                return (
                  <PatientCardExpandable
                    key={p.id}
                    role="MD"
                    name={name}
                    ageSex={ageSex}
                    status={status}
                    timer={p.mdWaiting}
                    complaint={p.chiefComplaint}
                    locationLabel={p.roomName}
                    ews={p.ews}
                    ats={p.ats}
                    patientId={p.id}
                    primaryLabel={label}
                    onPrimary={handlePrimary}
                    onOrderSet={handleOrderSet}
                    onOpenFull={handleOpenFull}
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