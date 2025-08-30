import React, { createContext, useContext, useMemo, useState } from "react";

export const normalizeId = (id: unknown) => String(id ?? "");

export type ObsPoint = {
  t: string;
  rr?: number; spo2?: number; hr?: number; sbp?: number; temp?: number; ews?: number;
  source?: "triage" | "obs" | "device";
};

type State = Record<string, ObsPoint[]>;

const Ctx = createContext<{
  state: State;
  add: (patientId: string, point: ObsPoint) => void;
}>({ state: {}, add: () => {} });

export function VitalsProvider({ children }: { children: React.ReactNode }) {
  // dev guard: spot multiple providers (which would isolate state)
  if (import.meta.env.DEV) {
    // @ts-ignore
    window.__VITALS_PROVIDER_CNT__ = (window.__VITALS_PROVIDER_CNT__ || 0) + 1;
    // @ts-ignore
    if (window.__VITALS_PROVIDER_CNT__ > 1) console.warn("Multiple VitalsProvider instances detected");
  }
  
  const [state, setState] = useState<State>({});
  const add = (patientId: string, point: ObsPoint) =>
    setState(s => {
      const list = [...(s[patientId] || []), point]
        .sort((a, b) => Date.parse(a.t) - Date.parse(b.t));
      return { ...s, [patientId]: list };
    });
  const value = useMemo(() => ({ state, add }), [state]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useVitals(patientId: string) {
  const { state, add } = useContext(Ctx);
  const list = state[patientId] || [];
  const last = list[list.length - 1];
  return { list, last, add: (p: ObsPoint) => add(patientId, p) };
}