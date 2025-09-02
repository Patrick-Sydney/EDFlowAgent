// Map friendly display names to your internal patientIds.
// Adjust these values to match your actual seeded demo patients.
export const DEMO_PATIENTS: Record<string, string> = {
  "Alex Taylor": "alex",
  "Moana Rangi": "moana",
  "Rose Chen": "rose",
};

// Resolve helpers — try various strategies to find a patientId
export function resolvePatientId(name: string): string | undefined {
  const fromMap = DEMO_PATIENTS[name];
  if (fromMap) return fromMap;
  // If your app exposes a patientsStore with a lookup, try it:
  // @ts-ignore
  const ps = (window as any).patientsStore;
  try {
    if (ps?.findByName) {
      const p = ps.findByName(name);
      return p?.id ?? p?.patientId;
    }
    if (ps?.all) {
      const list = ps.all() || [];
      const item = list.find((x:any) => x?.name === name || x?.fullName === name);
      return item?.id ?? item?.patientId;
    }
  } catch {}
  return undefined;
}