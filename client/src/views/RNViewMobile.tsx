import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import RNMobileLaneNav, { LanePill } from "@/components/rn/RNMobileLaneNav";
import PatientCardExpandable, { MinVitals } from "@/components/PatientCardExpandable";

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

// Helper function to convert observations to MinVitals
function getLatestVitals(observations: any[]): MinVitals | undefined {
  if (!observations || observations.length === 0) return undefined;
  
  // Get the latest observation for each vital type
  const latestObs: Record<string, any> = {};
  observations.forEach(obs => {
    if (obs.type && (!latestObs[obs.type] || new Date(obs.takenAt) > new Date(latestObs[obs.type].takenAt))) {
      latestObs[obs.type] = obs;
    }
  });
  
  return {
    rr: latestObs.RR ? parseInt(latestObs.RR.value) : undefined,
    spo2: latestObs.SpO2 ? parseInt(latestObs.SpO2.value) : undefined,
    hr: latestObs.HR ? parseInt(latestObs.HR.value) : undefined,
    sbp: latestObs.BP ? parseInt(latestObs.BP.value.split('/')[0]) : undefined,
    temp: latestObs.Temp ? parseFloat(latestObs.Temp.value) : undefined,
    takenAt: Math.max(...observations.map(obs => new Date(obs.takenAt).getTime())).toString(),
  };
}

export default function RNViewMobile({ lanes, onStartTriage, onOpenObs, onOpenCard, onOpenIdentity }: {
  lanes: Lane[];
  onStartTriage: (p: PatientLite) => void;
  onOpenObs: (p: PatientLite) => void;
  onOpenCard: (p: PatientLite) => void;
  onOpenIdentity?: (p: PatientLite) => void;
}) {
  const pills: LanePill[] = useMemo(
    () => lanes.map((l) => ({ id: l.id, label: l.label, count: l.patients.length })),
    [lanes]
  );

  // Get all patient IDs for observation queries
  const allPatientIds = useMemo(() => {
    const ids = new Set<string>();
    lanes.forEach(lane => {
      lane.patients.forEach(patient => {
        ids.add(patient.id);
      });
    });
    return Array.from(ids);
  }, [lanes]);

  // Fetch observations for all patients
  const observationQueries = useQuery({
    queryKey: ['/api/observations', 'all-patients', allPatientIds.sort().join(',')],
    queryFn: async () => {
      const results: Record<string, any[]> = {};
      await Promise.all(
        allPatientIds.map(async (patientId) => {
          try {
            const response = await fetch(`/api/observations/${patientId}`);
            if (response.ok) {
              results[patientId] = await response.json();
            } else {
              results[patientId] = [];
            }
          } catch {
            results[patientId] = [];
          }
        })
      );
      return results;
    },
    enabled: allPatientIds.length > 0,
    staleTime: 30000, // Consider data fresh for 30 seconds
  });

  const observationsData = observationQueries.data || {};

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
                const ageSex = p.age ? `${p.age}${p.sex ? ` ${p.sex}` : ''}` : (p.sex ?? undefined);
                const minVitals = getLatestVitals(observationsData[p.id] || []);
                
                return (
                  <PatientCardExpandable
                    key={p.id}
                    role="RN"
                    name={name}
                    ageSex={ageSex}
                    status={status}
                    timer={p.waitingFor}
                    complaint={p.chiefComplaint}
                    ews={p.ews}
                    ats={p.ats}
                    patientId={p.id}
                    minVitals={minVitals}
                    primaryLabel={primaryLabel}
                    onPrimary={
                      lane.label === "Waiting" ? () => onStartTriage(p) : () => onOpenObs(p)
                    }
                    onAddObs={() => onOpenObs(p)}
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