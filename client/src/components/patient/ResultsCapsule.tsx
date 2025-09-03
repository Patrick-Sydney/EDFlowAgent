import React, { useMemo } from "react";
import Chip from "@/components/ui/Chip";
import { journeyStore, JourneyEvent } from "@/stores/journeyStore";

type Props = { patientId: string };

export default function ResultsCapsule({ patientId }: Props) {
  const latest = useMemo(() => {
    const evs = journeyStore.list(patientId).filter((e: JourneyEvent) => e.kind === "result");
    const pick = (name: string) =>
      [...evs].reverse().find(e => (e.label || "").toLowerCase().includes(name));
    return {
      ecg: pick("ecg"),
      troponin: pick("trop"),
      lactate: pick("lact"),
      ct: pick("ct"),
      cta: pick("cta"),
    };
  }, [patientId]);

  const fmt = (ev?: any, fallback = "—") =>
    ev ? new Date(ev.t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : fallback;

  return (
    <section className="rounded-lg border p-3">
      <div className="text-sm font-semibold mb-2">Results</div>
      <div className="flex flex-wrap gap-2 text-xs">
        <Chip title="Latest ECG">{`ECG: ${fmt(latest.ecg)}`}</Chip>
        <Chip title="Latest Troponin">{`Troponin: ${fmt(latest.troponin)}`}</Chip>
        <Chip title="Latest Lactate">{`Lactate: ${fmt(latest.lactate)}`}</Chip>
        <Chip title="Latest CT">{`CT: ${fmt(latest.ct)}`}</Chip>
        <Chip title="Latest CTA">{`CTA: ${fmt(latest.cta)}`}</Chip>
      </div>
    </section>
  );
}