import { NextRequest, NextResponse } from "next/server";
import type { EolSubmitBody, EolSubmitResponse } from "@/app/types/eol";
import { sendEolToKafka } from "@/lib/kafka";

function validateBarcode(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * POST /api/eol
 * Accepts barcode and optional manufacturing result; produces to topic eol-raw-data.
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

    const { barcode, manufacturingResult } = body as EolSubmitBody;

    if (!validateBarcode(barcode)) {
      return NextResponse.json(
        {
          success: false,
          message: "Barcode is required and must be non-empty.",
          status: "error",
        },
        { status: 400 }
      );
    }

    const now = new Date();
    const endTime = new Date(now.getTime() + 3000); // current time + 3 seconds
    const result = manufacturingResult === "fail" ? 0 : 1; // 1 = pass, 0 = fail

    const payload = {
      eventType: "manufacturing_simple" as const,
      barcode: barcode.trim(),
      productCode: 1001,
      productSeq: 42,
      stationCode: 201,
      stationChannelNo: 1,
      result,
      operator: "OP01",
      startTime: now.toISOString(),
      endTime: endTime.toISOString(),
    };

    try {
      await sendEolToKafka(payload);
    } catch (sendErr) {
      const msg = sendErr instanceof Error ? sendErr.message : "Kafka send failed.";
      return NextResponse.json(
        {
          success: false,
          message: `Failed to send message to eol-raw-data: ${msg}`,
          status: "error",
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Message sent to eol-raw-data.",
      status: "pass",
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
