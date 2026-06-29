import { describe, expect, it } from "vitest";
import type { SimulationConfig } from "@/app/types/simulation";
import { SIMULATION_MIN_INTERVAL_SECONDS } from "@/app/types/simulation";
import { formatSerialNumber, validateSimulationConfig } from "./simulation";

const PREFIX = "SN-TEST-20260519-";

describe("formatSerialNumber", () => {
  it("pads counter with default width 4", () => {
    expect(formatSerialNumber(PREFIX, 1)).toBe("SN-TEST-20260519-0001");
  });

  it("increments counter with default pad width", () => {
    expect(formatSerialNumber(PREFIX, 1)).toBe(`${PREFIX}0001`);
    expect(formatSerialNumber(PREFIX, 2)).toBe(`${PREFIX}0002`);
  });

  it("uses custom padWidth when passed explicitly", () => {
    expect(formatSerialNumber(PREFIX, 1, 6)).toBe("SN-TEST-20260519-000001");
    expect(formatSerialNumber(PREFIX, 42, 2)).toBe("SN-TEST-20260519-42");
  });
});

describe("validateSimulationConfig", () => {
  const validAuto: SimulationConfig = {
    serialPrefix: "SN-TEST-",
    startNumber: 1,
    intervalSeconds: SIMULATION_MIN_INTERVAL_SECONDS,
    sendMode: "auto",
  };

  const validManual: SimulationConfig = {
    serialPrefix: "SN-TEST-",
    startNumber: 1,
    intervalSeconds: 0,
    sendMode: "manual",
  };

  it("returns null for valid auto config", () => {
    expect(validateSimulationConfig(validAuto)).toBeNull();
  });

  it("returns null for valid manual config", () => {
    expect(validateSimulationConfig(validManual)).toBeNull();
  });

  it("rejects empty serialPrefix", () => {
    const result = validateSimulationConfig({ ...validAuto, serialPrefix: "" });
    expect(result?.serialPrefix).toBeDefined();
  });

  it("rejects whitespace-only serialPrefix", () => {
    const result = validateSimulationConfig({
      ...validAuto,
      serialPrefix: "   ",
    });
    expect(result?.serialPrefix).toBeDefined();
  });

  it("rejects startNumber below minimum", () => {
    const result = validateSimulationConfig({ ...validAuto, startNumber: 0 });
    expect(result?.startNumber).toBeDefined();
  });

  it("rejects non-integer startNumber", () => {
    const result = validateSimulationConfig({ ...validAuto, startNumber: 1.5 });
    expect(result?.startNumber).toBeDefined();
  });

  it("rejects auto mode interval below minimum", () => {
    const result = validateSimulationConfig({
      ...validAuto,
      intervalSeconds: SIMULATION_MIN_INTERVAL_SECONDS - 1,
    });
    expect(result?.intervalSeconds).toBeDefined();
  });

  it("rejects non-integer intervalSeconds in auto mode", () => {
    const result = validateSimulationConfig({
      ...validAuto,
      intervalSeconds: 5.5,
    });
    expect(result?.intervalSeconds).toBeDefined();
  });

  it("does not validate intervalSeconds in manual mode", () => {
    expect(
      validateSimulationConfig({
        ...validManual,
        intervalSeconds: 1,
      })
    ).toBeNull();
  });
});
