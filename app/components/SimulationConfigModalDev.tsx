"use client";

import { useState } from "react";
import type { SimulationConfig } from "@/app/types/simulation";
import { SimulationConfigModal } from "./SimulationConfigModal";

/** Temporary dev harness for Ticket-7-2 — remove when Ticket-7-4 wires the modal into EolScanForm. */
export function SimulationConfigModalDev() {
  const [open, setOpen] = useState(false);
  const [config, setConfig] = useState<SimulationConfig | null>(null);

  return (
    <div className="flex w-full max-w-2xl flex-col items-center gap-4">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border border-dashed border-zinc-400 bg-white px-6 py-3 text-base font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
      >
        Open simulation config (dev)
      </button>

      {config !== null && (
        <pre className="w-full overflow-x-auto rounded-lg bg-zinc-200 p-4 text-left text-sm text-zinc-800">
          {JSON.stringify(config, null, 2)}
        </pre>
      )}

      <SimulationConfigModal
        open={open}
        onConfirm={(confirmed) => {
          setConfig(confirmed);
          setOpen(false);
        }}
        onCancel={() => setOpen(false)}
      />
    </div>
  );
}
