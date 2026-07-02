"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { SimulationConfig, SimulationSendMode } from "@/app/types/simulation";
import {
  SIMULATION_MIN_INTERVAL_SECONDS,
  SIMULATION_MIN_START_NUMBER,
} from "@/app/types/simulation";
import {
  validateSimulationConfig,
  type SimulationValidationErrors,
} from "@/lib/simulation";

export interface SimulationConfigModalProps {
  open: boolean;
  onConfirm: (config: SimulationConfig) => void;
  onCancel: () => void;
}

interface DraftFields {
  serialPrefix: string;
  startNumber: string;
  intervalSeconds: string;
  sendMode: SimulationSendMode;
}

const DEFAULT_DRAFT: DraftFields = {
  serialPrefix: "",
  startNumber: String(SIMULATION_MIN_START_NUMBER),
  intervalSeconds: String(SIMULATION_MIN_INTERVAL_SECONDS),
  sendMode: "auto",
};

const inputClassName =
  "rounded-lg border border-zinc-300 bg-white px-4 py-3 text-lg text-zinc-900 placeholder-zinc-500 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/25";

const labelClassName = "text-sm font-medium text-zinc-600";

function parseIntegerField(value: string): number {
  return Number.parseInt(value, 10);
}

function draftToConfig(draft: DraftFields): SimulationConfig {
  return {
    serialPrefix: draft.serialPrefix,
    startNumber: parseIntegerField(draft.startNumber),
    intervalSeconds: parseIntegerField(draft.intervalSeconds),
    sendMode: draft.sendMode,
  };
}

export function SimulationConfigModal({
  open,
  onConfirm,
  onCancel,
}: SimulationConfigModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [draft, setDraft] = useState<DraftFields>(DEFAULT_DRAFT);
  const [errors, setErrors] = useState<SimulationValidationErrors | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      if (!dialog.open) {
        setDraft(DEFAULT_DRAFT);
        setErrors(null);
        dialog.showModal();
      }
      return;
    }

    if (dialog.open) {
      dialog.close();
    }
  }, [open]);

  const handleCancel = useCallback(() => {
    onCancel();
  }, [onCancel]);

  const handleDialogCancel = useCallback(
    (event: React.SyntheticEvent<HTMLDialogElement>) => {
      event.preventDefault();
      handleCancel();
    },
    [handleCancel]
  );

  const handleConfirm = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const config = draftToConfig(draft);
      const validationErrors = validateSimulationConfig(config);

      if (validationErrors) {
        setErrors(validationErrors);
        return;
      }

      setErrors(null);
      onConfirm(config);
    },
    [draft, onConfirm]
  );

  const updateDraft = useCallback(
    <K extends keyof DraftFields>(field: K, value: DraftFields[K]) => {
      setDraft((current) => ({ ...current, [field]: value }));
      setErrors((current) => {
        if (!current) return null;
        const next = { ...current };
        delete next[field as keyof SimulationValidationErrors];
        return Object.keys(next).length > 0 ? next : null;
      });
    },
    []
  );

  const serialPrefixErrorId = `${titleId}-serial-prefix-error`;
  const startNumberErrorId = `${titleId}-start-number-error`;
  const intervalSecondsErrorId = `${titleId}-interval-seconds-error`;
  const sendModeErrorId = `${titleId}-send-mode-error`;

  return (
    <dialog
      ref={dialogRef}
      className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-xl border border-zinc-300 bg-white p-6 text-zinc-900 shadow-xl backdrop:bg-black/40 open:flex open:flex-col open:gap-6"
      aria-modal="true"
      aria-labelledby={titleId}
      onCancel={handleDialogCancel}
    >
      <form className="flex flex-col gap-6" onSubmit={handleConfirm}>
        <div className="flex flex-col gap-2">
          <h2 id={titleId} className="text-2xl font-bold tracking-tight text-zinc-900">
            Simulation configuration
          </h2>
          <p className="text-base text-zinc-600">
            Configure serial number generation and send mode for manufacturing simulation.
          </p>
        </div>

        <label className="flex flex-col gap-2">
          <span className={labelClassName}>Serial prefix</span>
          <input
            type="text"
            value={draft.serialPrefix}
            onChange={(event) => updateDraft("serialPrefix", event.target.value)}
            placeholder="SN-TEST-20260519-"
            className={inputClassName}
            autoFocus
            aria-invalid={errors?.serialPrefix ? true : undefined}
            aria-describedby={errors?.serialPrefix ? serialPrefixErrorId : undefined}
          />
          {errors?.serialPrefix && (
            <p id={serialPrefixErrorId} className="text-sm text-red-600" role="alert">
              {errors.serialPrefix}
            </p>
          )}
        </label>

        <label className="flex flex-col gap-2">
          <span className={labelClassName}>Starting number</span>
          <input
            type="number"
            min={SIMULATION_MIN_START_NUMBER}
            step={1}
            value={draft.startNumber}
            onChange={(event) => updateDraft("startNumber", event.target.value)}
            className={inputClassName}
            aria-invalid={errors?.startNumber ? true : undefined}
            aria-describedby={errors?.startNumber ? startNumberErrorId : undefined}
          />
          {errors?.startNumber && (
            <p id={startNumberErrorId} className="text-sm text-red-600" role="alert">
              {errors.startNumber}
            </p>
          )}
        </label>

        <fieldset className="flex flex-col gap-3">
          <legend className={labelClassName}>Send mode</legend>
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-6">
            <label className="flex items-center gap-2 text-base text-zinc-900">
              <input
                type="radio"
                name="sendMode"
                value="auto"
                checked={draft.sendMode === "auto"}
                onChange={() => updateDraft("sendMode", "auto")}
                className="h-4 w-4 border-zinc-300 text-blue-600 focus:ring-2 focus:ring-blue-600/25"
              />
              Auto
            </label>
            <label className="flex items-center gap-2 text-base text-zinc-900">
              <input
                type="radio"
                name="sendMode"
                value="manual"
                checked={draft.sendMode === "manual"}
                onChange={() => updateDraft("sendMode", "manual")}
                className="h-4 w-4 border-zinc-300 text-blue-600 focus:ring-2 focus:ring-blue-600/25"
              />
              Manual
            </label>
          </div>
          {errors?.sendMode && (
            <p id={sendModeErrorId} className="text-sm text-red-600" role="alert">
              {errors.sendMode}
            </p>
          )}
        </fieldset>

        {draft.sendMode === "auto" && (
          <label className="flex flex-col gap-2">
            <span className={labelClassName}>Interval seconds</span>
            <input
              type="number"
              min={SIMULATION_MIN_INTERVAL_SECONDS}
              step={1}
              value={draft.intervalSeconds}
              onChange={(event) => updateDraft("intervalSeconds", event.target.value)}
              className={inputClassName}
              aria-invalid={errors?.intervalSeconds ? true : undefined}
              aria-describedby={
                errors?.intervalSeconds ? intervalSecondsErrorId : undefined
              }
            />
            {errors?.intervalSeconds && (
              <p
                id={intervalSecondsErrorId}
                className="text-sm text-red-600"
                role="alert"
              >
                {errors.intervalSeconds}
              </p>
            )}
          </label>
        )}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={handleCancel}
            className="rounded-lg border border-zinc-300 bg-white px-6 py-3 text-lg font-semibold text-zinc-900 transition-colors hover:bg-zinc-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-6 py-3 text-lg font-semibold text-white transition-colors hover:bg-blue-700"
          >
            Confirm
          </button>
        </div>
      </form>
    </dialog>
  );
}
