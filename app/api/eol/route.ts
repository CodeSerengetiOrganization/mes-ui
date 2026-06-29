import { NextRequest, NextResponse } from "next/server";
import { toOverallResult, type EolSubmitBody, type EolSubmitResponse } from "@/app/types/eol";
import {
  sendManufacturingResultToKafka,
  type ManufacturingResultPayload,
} from "@/lib/kafka";

function resolveSerialNumber(body: EolSubmitBody): string | null {
  const value = body.serial_number;
  if (typeof value !== "string" || value.trim().length === 0) {
    return null;
  }
  return value.trim();
}

function buildManufacturingResultPayload(
  serialNumber: string,
  manufacturingResult?: EolSubmitBody["manufacturingResult"]
): ManufacturingResultPayload {
  const overallResult = toOverallResult(manufacturingResult);
  const createdAt = new Date().toISOString();
  const base = {
    serial_number: serialNumber,
    product_type: "SCU",
    mo_id: 1,
    controller_id: 10,
    fixture_id: 11,
    nest_number: 1,
    overall_result: overallResult,
    operator_id: "OP-TEST",
    created_at: createdAt,
  };

  switch (overallResult) {
    case "FAIL":
      return {
        ...base,
        station_id: 201,
        cycle_time_seconds: 0,
        sw_version: "1.2.3",
        hw_revision: "Rev-A",
        test_data_json: { Power_Voltage: 11.1, Static_Current: 0.005 },
        error_code: "FUNCTION_FAIL",
        shift_code: "B",
      };
    case "ABORTED":
      return {
        ...base,
        station_id: null,
        cycle_time_seconds: 15.0,
        sw_version: "1.2.3",
        hw_revision: "Rev-A",
        test_data_json: null,
        error_code: "ABORTED BY OPERATOR",
        shift_code: "A",
      };
    case "PASS":
    default:
      return {
        ...base,
        station_id: null,
        cycle_time_seconds: 42.5,
        sw_version: "1.2.3",
        hw_revision: "Rev-A",
        test_data_json: { voltage_v: 12.0, current_ma: 150 },
        error_code: null,
        shift_code: "A",
      };
  }
}

/**
 * POST /api/eol
 * Accepts serial_number and optional manufacturing result; produces to topic manufacturing-results-topic.
 * Requires KAFKA_BOOTSTRAP_SERVERS (e.g. kafka-kafka-bootstrap.machine-monitoring.svc:9092 in-cluster, or localhost:9092 with port-forward).
 */
export async function POST(request: NextRequest): Promise<NextResponse<EolSubmitResponse>> {
  try {
    const body = (await request.json()) as unknown;

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid request body.",
          status: "error",
        },
        { status: 400 }
      );
    }

    const serialNumber = resolveSerialNumber(body as EolSubmitBody);
    const { manufacturingResult } = body as EolSubmitBody;

    if (!serialNumber) {
      return NextResponse.json(
        {
          success: false,
          message: "serial_number is required and must be non-empty.",
          status: "error",
        },
        { status: 400 }
      );
    }

    const payload = buildManufacturingResultPayload(serialNumber, manufacturingResult);

    try {
      await sendManufacturingResultToKafka(payload);
    } catch (sendErr) {
      const msg = sendErr instanceof Error ? sendErr.message : "Kafka send failed.";
      return NextResponse.json(
        {
          success: false,
          message: `Failed to send message to manufacturing-results-topic: ${msg}`,
          status: "error",
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Message sent to manufacturing-results-topic.",
      status: manufacturingResult ?? "pass",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error.";
    return NextResponse.json(
      {
        success: false,
        message: `Send failed: ${message}`,
        status: "error",
      },
      { status: 500 }
    );
  }
}
