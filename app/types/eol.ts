import type { OverallResult } from "@/lib/kafka";

export type ManufacturingResult = "pass" | "fail" | "aborted";

export interface EolSubmitBody {
  serial_number?: string;
  manufacturingResult?: ManufacturingResult;
}

export interface EolSubmitResponse {
  success: boolean;
  message: string;
  status: ManufacturingResult | "error";
}

export function toOverallResult(manufacturingResult?: ManufacturingResult): OverallResult {
  switch (manufacturingResult) {
    case "fail":
      return "FAIL";
    case "aborted":
      return "ABORTED";
    case "pass":
    default:
      return "PASS";
  }
}
