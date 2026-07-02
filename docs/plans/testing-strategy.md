# Testing strategy (tech note)

Use when implementing Ticket-7-0 and later Story-7 tickets.

## Industry best practice (practical)

| Situation | Typical practice |
|-----------|------------------|
| Pure formatting / validation with clear rules | **Unit tests** — high value, low cost |
| Long-lived feature code (e.g. simulation helpers) | **Unit tests** — regressions are worth catching |
| API / Kafka payload contract (`POST /api/eol`, `ManufacturingResultPayload`) | **Integration or route tests** — higher value than UI-only tests |
| React modal / form wiring (checkbox, Start/Stop) | **Light testing** — manual QA or a few component tests if infra exists |
| Logic shared by client and server | **Test once** in the shared module (`lib/simulation.ts`, route handler) |
| Logic only in UI with obvious inline validation | **Lower priority** than shared helpers and API |

## What to test in Story-7

| Layer | File(s) | Priority | Test type |
|-------|---------|----------|-----------|
| Serial format + config validation | `lib/simulation.ts` | **High** | Unit (Vitest) — Ticket-7-0 |
| EOL API payload + defaults | `app/api/eol/route.ts` | **High** | Route / integration — Ticket-7-3 |
| Kafka key = `serial_number` | `lib/kafka.ts` | **Medium** | Unit with mocked producer, or integration |
| `SimulationConfigModal` | `app/components/SimulationConfigModal.tsx` | **Low** | Manual QA first |
| `EolScanForm` simulation loop | `app/components/EolScanForm.tsx` | **Low** | Manual QA; optional hook extraction + unit tests later |

## Out of scope (for Story-7 testing)

- Full E2E (Playwright) unless the team already uses it
- Unit tests for every React component
- Tests for Tailwind layout or accessibility (manual check is enough initially)

## CI (when added)

- Run `pnpm test` on every PR; fail the build if unit tests fail.
