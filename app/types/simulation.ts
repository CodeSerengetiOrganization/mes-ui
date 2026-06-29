/** Simulation-only types — delete with manufacturing simulation feature. */

export type SimulationSendMode = "auto" | "manual";

export interface SimulationConfig {
  serialPrefix: string;
  startNumber: number;
  intervalSeconds: number;
  sendMode: SimulationSendMode;
}

export const SIMULATION_MIN_INTERVAL_SECONDS = 5;
export const SIMULATION_MIN_START_NUMBER = 1;
export const SIMULATION_DEFAULT_PAD_WIDTH = 4;
