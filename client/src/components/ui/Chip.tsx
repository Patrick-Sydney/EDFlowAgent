import React from "react";
import clsx from "clsx";

type Props = {
  children: React.ReactNode;
  tone?: "default" | "info" | "warning" | "critical";
  className?: string;
  onClick?: () => void;
  title?: string;
};
export default function Chip({ children, tone = "default", className, onClick, title }: Props) {
  const tones: Record<string, string> = {
    default: "bg-slate-100 text-slate-700",
    info: "bg-blue-50 text-blue-700",
    warning: "bg-amber-50 text-amber-700",
    critical: "bg-red-100 text-red-700",
  };
  return (
    <span
      title={title}
      onClick={onClick}
      className={clsx(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs select-none",
        tones[tone],
        onClick && "cursor-pointer hover:opacity-80",
        className
      )}
    >
      {children}
    </span>
  );
}