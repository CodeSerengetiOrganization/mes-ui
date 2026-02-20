"use client";

export type StatusLightState = "pass" | "fail" | "error" | "idle";

interface StatusLightProps {
  state: StatusLightState;
  "aria-label"?: string;
  className?: string;
}

/**
 * Industrial status indicator: green = pass, red = fail, amber = error/other (e.g. Kafka send failure).
 * Idle = off/gray.
 */
export function StatusLight({ state, "aria-label": ariaLabel, className = "" }: StatusLightProps) {
  const label = ariaLabel ?? `Status: ${state}`;

  const stateStyles: Record<StatusLightState, string> = {
    idle: "bg-zinc-600 shadow-none",
    pass: "bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.8)]",
    fail: "bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.8)]",
    error: "bg-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.8)]",
  };

  return (
    <div
      className={`h-16 w-16 rounded-full border-4 border-white/20 transition-all duration-300 ${stateStyles[state]} ${className}`}
      role="status"
      aria-label={label}
      title={state}
    />
  );
}
