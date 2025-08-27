// Build default values for ObservationSetModalTouch from a patient's existing observations
// Drop under src/lib/obsDefaults.ts (adjust alias as needed)

export type ObsType = 'RR'|'SpO2'|'HR'|'BP'|'Temp'|'ACVPU'|'O2';
export interface Observation { id?: string; type: ObsType; value: string; unit?: string; takenAt: string; recordedBy: string; phase?: 'triage'|'obs' }

export type ObsDefaults = Partial<Record<'RR'|'SpO2'|'HR'|'SBP'|'Temp'|'ACVPU'|'O2', string>>;

const parseSBP = (bpVal?: string): string | undefined => {
  if (!bpVal) return undefined;
  const m = String(bpVal).match(/(\d{2,3})\s*\/?\s*(\d{2,3})?/);
  return m?.[1];
};

const parseO2Device = (val?: string): string | undefined => {
  if (!val) return undefined;
  const v = val.toLowerCase();
  if (v.includes('room air')) return 'Room air';
  if (v.includes('nasal')) return 'Nasal prongs';
  if (v.includes('hudson')) return 'Hudson mask';
  if (v.includes('nrb') || v.includes('non-rebreather')) return 'NRB mask';
  return undefined;
};

export function buildObsDefaults(observations: Observation[]): ObsDefaults {
  // newest first
  const sorted = observations.slice().sort((a,b)=> b.takenAt.localeCompare(a.takenAt));
  const out: ObsDefaults = {};
  for (const o of sorted) {
    switch (o.type) {
      case 'RR': if (!out.RR) out.RR = o.value; break;
      case 'SpO2': if (!out.SpO2) out.SpO2 = o.value; break;
      case 'HR': if (!out.HR) out.HR = o.value; break;
      case 'BP': if (!out.SBP) out.SBP = parseSBP(o.value); break;
      case 'Temp': if (!out.Temp) out.Temp = o.value; break;
      case 'ACVPU': if (!out.ACVPU) out.ACVPU = o.value; break;
      case 'O2': if (!out.O2) out.O2 = parseO2Device(o.value) ?? o.value; break;
    }
  }
  return out;
}