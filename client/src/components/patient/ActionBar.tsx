import React from "react";
import { Button } from "../ui/button";

type Handlers = {
  onAddObs?: () => void;
  onAssignRoom?: () => void;
  onOrderSet?: () => void;
  onDispo?: () => void;
  onSeeNow?: () => void;
};

export default function ActionBar({
  role, lane, handlers,
}: {
  role: "RN" | "Charge" | "MD";
  lane: string;
  handlers: Handlers;
}) {
  // Pick up to 4 context actions. Keep it simple and explicit.
  const actions: { key: string; label: string; onClick?: () => void }[] = [];

  if (role === "RN") {
    actions.push({ key: "obs", label: "+ Obs", onClick: handlers.onAddObs });
    if (/Waiting|In Triage/i.test(lane)) actions.push({ key: "assign", label: "Assign room", onClick: handlers.onAssignRoom });
  }
  if (role === "Charge") {
    actions.push({ key: "assign", label: "Assign room", onClick: handlers.onAssignRoom });
    actions.push({ key: "obs", label: "+ Obs", onClick: handlers.onAddObs });
  }
  if (role === "MD") {
    actions.push({ key: "see", label: "See now", onClick: handlers.onSeeNow });
    actions.push({ key: "orders", label: "Order set", onClick: handlers.onOrderSet });
    actions.push({ key: "dispo", label: "Disposition", onClick: handlers.onDispo });
  }

  // De-dup and cap to 4
  const uniq: Record<string, boolean> = {};
  const firstFour = actions.filter(a => (uniq[a.key] ? false : (uniq[a.key] = true))).slice(0, 4);

  if (firstFour.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {firstFour.map(a => (
        <Button key={a.key} onClick={a.onClick} className="h-9 rounded-full px-3">{a.label}</Button>
      ))}
    </div>
  );
}