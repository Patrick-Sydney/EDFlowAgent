export function toEncounterArray(raw: any): any[] {
  const list = Array.isArray(raw) ? raw : Object.values(raw ?? {});
  return list.map((e: any) => ({ ...e, lane: e?.lane ?? e?.state ?? "waiting" }));
}