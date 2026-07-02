"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { StatusLight, type StatusLightState } from "./StatusLight";
import { SimulationConfigModal } from "./SimulationConfigModal";
import type { EolSubmitResponse, ManufacturingResult } from "@/app/types/eol";
import type { SimulationConfig } from "@/app/types/simulation";
import { formatSerialNumber } from "@/lib/simulation";

export function EolScanForm() {
  const [serialNumber, setSerialNumber] = useState("");
  const [manufacturingResult, setManufacturingResult] = useState<ManufacturingResult>("pass");
  const [status, setStatus] = useState<StatusLightState>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [simulationEnabled, setSimulationEnabled] = useState(false);
  const [simulationConfig, setSimulationConfig] = useState<SimulationConfig | null>(null);
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [isSimulationRunning, setIsSimulationRunning] = useState(false);
  const [simulationSending, setSimulationSending] = useState(false);

  const serialCounterRef = useRef(0);
  const intervalIdRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const abortedRef = useRef(false);
  const tickInFlightRef = useRef(false);

  const simulationActive = simulationConfig !== null;
  const manualFormDisabled = simulationActive || loading;
  const isManualSimulation =
    simulationConfig?.sendMode === "manual";

  const stopSimulation = useCallback(() => {
    abortedRef.current = true;

    if (intervalIdRef.current !== null) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }

    setIsSimulationRunning(false);
  }, []);

  const sendSimulationTick = useCallback(async () => {
    if (!simulationConfig || abortedRef.current || tickInFlightRef.current) {
      return;
    }

    tickInFlightRef.current = true;
    setSimulationSending(true);

    const serial_number = formatSerialNumber(
      simulationConfig.serialPrefix,
      serialCounterRef.current
    );

    try {
      const res = await fetch("/api/eol", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serial_number,
          manufacturingResult,
        }),
      });

      const data = (await res.json()) as EolSubmitResponse;

      if (abortedRef.current) return;

      setMessage(data.message);
      setStatus(data.status);

      if (res.ok && data.success) {
        serialCounterRef.current += 1;
      } else {
        stopSimulation();
      }
    } catch (err) {
      if (abortedRef.current) return;

      const text = err instanceof Error ? err.message : "Network error.";
      setMessage(`Send failed: ${text}`);
      setStatus("error");
      stopSimulation();
    } finally {
      tickInFlightRef.current = false;
      setSimulationSending(false);
    }
  }, [simulationConfig, manufacturingResult, stopSimulation]);

  useEffect(() => {
    return () => {
      abortedRef.current = true;
      if (intervalIdRef.current !== null) {
        clearInterval(intervalIdRef.current);
      }
    };
  }, []);

  const handleSimulationCheckboxChange = useCallback(
    (checked: boolean) => {
      if (checked) {
        setSimulationEnabled(true);
        setConfigModalOpen(true);
        return;
      }

      if (isSimulationRunning) return;

      setSimulationEnabled(false);
      setSimulationConfig(null);
    },
    [isSimulationRunning]
  );

  const handleConfigConfirm = useCallback((config: SimulationConfig) => {
    setSimulationConfig(config);
    setConfigModalOpen(false);
  }, []);

  const handleConfigCancel = useCallback(() => {
    setConfigModalOpen(false);
    if (simulationConfig === null) {
      setSimulationEnabled(false);
    }
  }, [simulationConfig]);

  const handleSimulationStart = useCallback(() => {
    if (!simulationConfig || isSimulationRunning) return;

    abortedRef.current = false;
    serialCounterRef.current = simulationConfig.startNumber;
    setIsSimulationRunning(true);
    setMessage(null);
    setStatus("idle");

    if (simulationConfig.sendMode === "auto") {
      void sendSimulationTick();

      intervalIdRef.current = setInterval(() => {
        void sendSimulationTick();
      }, simulationConfig.intervalSeconds * 1000);
    } else {
      void sendSimulationTick();
    }
  }, [simulationConfig, isSimulationRunning, sendSimulationTick]);

  const handleSimulationStop = stopSimulation;

  const submit = useCallback(async () => {
    const trimmed = serialNumber.trim();
    if (!trimmed) {
      setMessage("Please enter or scan a serial number.");
      setStatus("error");
      return;
    }

    setLoading(true);
    setMessage(null);
    setStatus("idle");

    try {
      const res = await fetch("/api/eol", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serial_number: trimmed,
          manufacturingResult,
        }),
      });

      const data = (await res.json()) as EolSubmitResponse;

      setMessage(data.message);
      setStatus(data.status);

      if (res.ok && data.success) {
        setSerialNumber("");
      }
    } catch (err) {
      const text = err instanceof Error ? err.message : "Network error.";
      setMessage(`Send failed: ${text}`);
      setStatus("error");
    } finally {
      setLoading(false);
    }
  }, [serialNumber, manufacturingResult]);

  return (
    <div className="flex w-full max-w-2xl flex-col items-center gap-10">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
          EOL Raw Data
        </h1>
        <p className="text-lg text-zinc-600">
          Enter or scan serial number to send to topic{" "}
          <code className="rounded bg-zinc-200 px-1.5 py-0.5 font-mono text-sm text-zinc-700">
            manufacturing-results-topic
          </code>
        </p>
      </div>

      <p className="text-xl text-zinc-600">
        Scan or type serial number below, then submit to send the Kafka message.
      </p>

      <label className="flex w-full items-center gap-3 rounded-lg border border-zinc-300 bg-white px-4 py-3">
        <input
          type="checkbox"
          checked={simulationEnabled}
          onChange={(event) => handleSimulationCheckboxChange(event.target.checked)}
          disabled={isSimulationRunning}
          className="h-5 w-5 rounded border-zinc-300 text-blue-600 focus:ring-2 focus:ring-blue-600/25 disabled:opacity-50"
          aria-label="Enable manufacturing simulation"
        />
        <span className="text-base font-medium text-zinc-900">
          Enable Manufacturing Simulation
        </span>
      </label>

      {simulationActive && simulationConfig && (
        <section
          aria-label="Manufacturing simulation controls"
          className="flex w-full flex-col gap-4 rounded-lg border border-zinc-300 bg-white p-4"
        >
          <h2 className="text-lg font-semibold text-zinc-900">Simulation configuration</h2>
          <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <dt className="font-medium text-zinc-600">Serial prefix</dt>
              <dd className="font-mono text-zinc-900">{simulationConfig.serialPrefix}</dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="font-medium text-zinc-600">First serial number</dt>
              <dd className="font-mono text-zinc-900">
                {formatSerialNumber(
                  simulationConfig.serialPrefix,
                  simulationConfig.startNumber
                )}
              </dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="font-medium text-zinc-600">Send mode</dt>
              <dd className="capitalize text-zinc-900">{simulationConfig.sendMode}</dd>
            </div>
            {simulationConfig.sendMode === "auto" && (
              <div className="flex flex-col gap-1">
                <dt className="font-medium text-zinc-600">Interval</dt>
                <dd className="text-zinc-900">{simulationConfig.intervalSeconds}s</dd>
              </div>
            )}
          </dl>
          <div className="flex flex-col gap-3 sm:flex-row">
            {!isSimulationRunning && (
              <button
                type="button"
                onClick={handleSimulationStart}
                className="rounded-lg bg-green-600 px-6 py-3 text-lg font-semibold text-white transition-colors hover:bg-green-700"
                aria-label="Start manufacturing simulation"
              >
                Start
              </button>
            )}
            {isSimulationRunning && isManualSimulation && (
              <button
                type="button"
                onClick={() => void sendSimulationTick()}
                disabled={simulationSending}
                className="rounded-lg bg-green-600 px-6 py-3 text-lg font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-50"
                aria-label="Send next simulated serial number"
              >
                {simulationSending ? "Sending…" : "Send next"}
              </button>
            )}
            <button
              type="button"
              onClick={handleSimulationStop}
              disabled={!isSimulationRunning}
              className="rounded-lg bg-red-600 px-6 py-3 text-lg font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
              aria-label="Stop manufacturing simulation"
            >
              Stop
            </button>
            <button
              type="button"
              onClick={() => setConfigModalOpen(true)}
              disabled={isSimulationRunning}
              className="rounded-lg border border-zinc-300 bg-white px-6 py-3 text-lg font-semibold text-zinc-900 transition-colors hover:bg-zinc-50 disabled:opacity-50 sm:ml-auto"
              aria-label="Edit simulation configuration"
            >
              Edit configuration
            </button>
          </div>
        </section>
      )}

      <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-end">
        <label className="flex flex-1 flex-col gap-2">
          <span className="text-sm font-medium text-zinc-600">Serial number</span>
          <input
            type="text"
            value={serialNumber}
            onChange={(e) => setSerialNumber(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="Scan or enter serial number"
            className="rounded-lg border border-zinc-300 bg-white px-4 py-3 text-lg text-zinc-900 placeholder-zinc-500 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/25"
            autoFocus
            disabled={manualFormDisabled}
            aria-label="Serial number input"
          />
        </label>
        <div className="flex gap-3 sm:items-end">
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-zinc-600">Result</span>
            <select
              value={manufacturingResult}
              onChange={(e) => setManufacturingResult(e.target.value as ManufacturingResult)}
              className="rounded-lg border border-zinc-300 bg-white px-4 py-3 text-zinc-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/25"
              disabled={manualFormDisabled}
              aria-label="Manufacturing result"
            >
              <option value="pass">Pass</option>
              <option value="fail">Fail</option>
              <option value="aborted">Aborted</option>
            </select>
          </label>
          <button
            type="button"
            onClick={submit}
            disabled={manualFormDisabled}
            className="rounded-lg bg-blue-600 px-6 py-3 text-lg font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
            aria-label="Submit serial number to Kafka"
          >
            {loading ? "Sending…" : "Submit"}
          </button>
        </div>
      </div>

      {message !== null && (
        <p
          className="min-h-[2rem] text-center text-lg font-medium text-zinc-900"
          role="status"
          aria-live="polite"
        >
          {message}
        </p>
      )}

      <div className="flex flex-col items-center gap-3">
        <span className="text-sm font-medium text-zinc-600">Status</span>
        <StatusLight state={status} aria-label={`Status: ${status}`} />
      </div>

      <SimulationConfigModal
        open={configModalOpen}
        initialConfig={simulationConfig}
        onConfirm={handleConfigConfirm}
        onCancel={handleConfigCancel}
      />
    </div>
  );
}
