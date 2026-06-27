"use client";

export type StatusLightState = "pass" | "fail" | "error" | "idle";

interface StatusLightProps {
  state: StatusLightState;
  "aria-label"?: string;
  className?: string;
}

/** SAP Fiori semantic hex: pass #107e3e, fail #bb0000, error #e9730c. Idle = neutral gray. */
const stateStyles: Record<StatusLightState, string> = {
  idle: "bg-zinc-500 shadow-none",
  pass: "bg-[#107e3e] shadow-[0_0_20px_rgba(16,126,62,0.5)]",
  fail: "bg-[#bb0000] shadow-[0_0_20px_rgba(187,0,0,0.5)]",
  error: "bg-[#e9730c] shadow-[0_0_20px_rgba(233,115,12,0.5)]",
};

const stateLabels: Record<StatusLightState, string> = {
  idle: "Idle",
  pass: "Pass",
  fail: "Fail",
  error: "Error",
};

/**
 * Industrial status indicator (SAP Fiori semantic colors).
 * Label below provides non-color cue for accessibility (ISA / color-blind safe).
 */
export function StatusLight({ state, "aria-label": ariaLabel, className = "" }: StatusLightProps) {
  const label = ariaLabel ?? `Status: ${state}`;

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <div
        className={`h-16 w-16 rounded-full border-4 border-zinc-300 transition-all duration-300 ${stateStyles[state]}`}
        role="status"
        aria-label={label}
        title={state}
      />
      <span className="text-sm font-medium text-zinc-600" aria-hidden="true">
        {stateLabels[state]}
      </span>
    </div>
  );
}
