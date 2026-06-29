import { Kafka, type Producer } from "kafkajs";

const TOPIC =
  process.env.KAFKA_TOPIC_MANUFACTURING_RESULTS ??
  "manufacturing-results-topic";

function getBootstrapServers(): string {
  const servers = process.env.KAFKA_BOOTSTRAP_SERVERS;
  if (!servers?.trim()) {
    throw new Error("KAFKA_BOOTSTRAP_SERVERS is not set");
  }
  return servers.trim();
}

let producer: Producer | null = null;

async function getProducer(): Promise<Producer> {
  if (producer) {
    return producer;
  }
  const brokers = getBootstrapServers().split(",").map((s) => s.trim());
  const kafka = new Kafka({
    clientId: "mes-ui-eol",
    brokers,
    // No TLS, no SASL per cluster config (plain listener on 9092)
  });
  const p = kafka.producer();
  await p.connect();
  producer = p;
  return producer;
}

export type OverallResult = "PASS" | "FAIL" | "ABORTED";

/** Manufacturing result payload aligned with mes-api ManufacturingResultEvent (snake_case). */
export interface ManufacturingResultPayload {
  serial_number: string;
  product_type: string;
  mo_id: number;
  station_id: number | null;
  controller_id: number;
  fixture_id: number;
  nest_number: number;
  overall_result: OverallResult;
  cycle_time_seconds: number;
  sw_version: string | null;
  hw_revision: string | null;
  test_data_json: Record<string, unknown> | null;
  error_code: string | null;
  operator_id: string;
  shift_code: string;
  created_at: string;
}

/**
 * Send manufacturing result to manufacturing-results-topic.
 * Uses KAFKA_BOOTSTRAP_SERVERS and optional KAFKA_TOPIC_MANUFACTURING_RESULTS
 * (legacy fallback: KAFKA_TOPIC_EOL_RAW_DATA).
 */
export async function sendManufacturingResultToKafka(
  payload: ManufacturingResultPayload
): Promise<void> {
  const p = await getProducer();
  await p.send({
    topic: TOPIC,
    messages: [
      {
        key: payload.serial_number,
        value: JSON.stringify(payload),
      },
    ],
  });
}
