export type ManufacturingResult = "pass" | "fail";

export interface EolSubmitBody {
  barcode: string;
  manufacturingResult?: ManufacturingResult;
}

export interface EolSubmitResponse {
  success: boolean;
  message: string;
  status: "pass" | "fail" | "error";
}
