import React from "react";
import { FlaskConical } from "lucide-react";

export default function ResultsCapsule({
  resultsPending = 0,
  onOpenResults,
  onQuickOrders,
}: {
  resultsPending?: number;
  onOpenResults?: () => void;
  onQuickOrders?: () => void;
}) {
  return (
    <div className="rounded-xl border p-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">Results</div>
        <div className="flex items-center gap-2">
          <button className="rounded-full border px-3 py-2 text-sm" onClick={onOpenResults}>Open</button>
          <button className="rounded-full border px-3 py-2 text-sm" onClick={onQuickOrders}>Quick orders</button>
        </div>
      </div>
      <div className="mt-2 text-sm text-muted-foreground inline-flex items-center gap-1">
        <FlaskConical className="h-4 w-4"/> {resultsPending} pending
      </div>
    </div>
  );
}