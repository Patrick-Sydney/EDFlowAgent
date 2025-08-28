import React from "react";
import RNViewMobile, { Lane, PatientLite } from "./RNViewMobile";

export default function RNViewAdapter(props: {
  lanes: Lane[];
  onStartTriage: (p: PatientLite) => void;
  onOpenObs: (p: PatientLite) => void;
  onOpenCard: (p: PatientLite) => void;
  DeskView?: React.ComponentType<any>; // your existing RN view
}) {
  const isPhone = typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches; // md breakpoint
  const { DeskView, ...rest } = props as any;
  if (isPhone || !DeskView) return <RNViewMobile {...rest} />;
  return <DeskView {...rest} />;
}