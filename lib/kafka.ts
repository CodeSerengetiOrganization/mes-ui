import { Kafka, type Producer } from "kafkajs";

const TOPIC = process.env.KAFKA_TOPIC_EOL_RAW_DATA ?? "eol-raw-data";

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

export interface EolMessagePayload {
  barcode: string;
  manufacturingResult: string | null;
  timestamp: string;
  topic: string;
}

/**
 * Send EOL payload to topic eol-raw-data.
 * Uses KAFKA_BOOTSTRAP_SERVERS and optional KAFKA_TOPIC_EOL_RAW_DATA.
 */
export async function sendEolToKafka(payload: EolMessagePayload): Promise<void> {
  const p = await getProducer();
  await p.send({
    topic: TOPIC,
    messages: [{ value: JSON.stringify(payload) }],
  });
}
