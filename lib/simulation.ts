/** Simulation-only helpers — delete with manufacturing simulation feature. */

import type { SimulationConfig } from "@/app/types/simulation";
import {
  SIMULATION_DEFAULT_PAD_WIDTH,
  SIMULATION_MIN_INTERVAL_SECONDS,
  SIMULATION_MIN_START_NUMBER,
} from "@/app/types/simulation";

export interface SimulationValidationErrors {
  serialPrefix?: string;
  startNumber?: string;
  intervalSeconds?: string;
  sendMode?: string;
}

/**
 * Build an incrementing serial number: `{prefix}{zeroPaddedNumber}`.
 * Example: `formatSerialNumber("SN-TEST-20260519-", 1)` → `SN-TEST-20260519-0001`.
 */
export function formatSerialNumber(
  prefix: string,
  number: number,
  padWidth: number = SIMULATION_DEFAULT_PAD_WIDTH
): string {
  return `${prefix}${String(number).padStart(padWidth, "0")}`;
}

/** Returns field-level error messages, or `null` when config is valid. */
export function validateSimulationConfig(
  config: SimulationConfig
): SimulationValidationErrors | null {
  const errors: SimulationValidationErrors = {};

  if (!config.serialPrefix.trim()) {
    errors.serialPrefix = "Serial prefix is required.";
  }

  if (
    !Number.isInteger(config.startNumber) ||
    config.startNumber < SIMULATION_MIN_START_NUMBER
  ) {
    errors.startNumber = `Starting number must be ${SIMULATION_MIN_START_NUMBER} or greater.`;
  }

  if (config.sendMode === "auto") {
    if (
      !Number.isInteger(config.intervalSeconds) ||
      config.intervalSeconds < SIMULATION_MIN_INTERVAL_SECONDS
    ) {
      errors.intervalSeconds = `Send interval must be at least ${SIMULATION_MIN_INTERVAL_SECONDS} second(s).`;
    }
  }

  if (config.sendMode !== "auto" && config.sendMode !== "manual") {
    errors.sendMode = "Select automatic or manual send mode.";
  }

  return Object.keys(errors).length > 0 ? errors : null;
}
