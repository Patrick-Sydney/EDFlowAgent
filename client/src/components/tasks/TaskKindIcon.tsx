// components/tasks/TaskKindIcon.tsx
import React from "react";
import { TaskKind } from "@/tasks/types";
import { 
  Heart, 
  Droplets, 
  Move3D, 
  ArrowRightLeft, 
  Home,
  HelpCircle 
} from "lucide-react";

type Props = {
  kind: TaskKind;
  className?: string;
  size?: number;
};

export default function TaskKindIcon({ kind, className = "", size = 16 }: Props) {
  const iconProps = { size, className };

  switch (kind) {
    case "comfort":
      return <Heart {...iconProps} />;
    case "hygiene":
      return <Droplets {...iconProps} />;
    case "mobility":
      return <Move3D {...iconProps} />;
    case "escort":
      return <ArrowRightLeft {...iconProps} />;
    case "environment":
      return <Home {...iconProps} />;
    default:
      return <HelpCircle {...iconProps} />;
  }
}