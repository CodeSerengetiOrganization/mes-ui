"use client";

import { useState, useCallback } from "react";
import { StatusLight, type StatusLightState } from "./StatusLight";
import type { EolSubmitResponse, ManufacturingResult } from "@/app/types/eol";

export function EolScanForm() {
  const [serialNumber, setSerialNumber] = useState("");
  const [manufacturingResult, setManufacturingResult] = useState<ManufacturingResult>("pass");
  const [status, setStatus] = useState<StatusLightState>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
            disabled={loading}
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
              disabled={loading}
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
            disabled={loading}
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
    </div>
  );
}
