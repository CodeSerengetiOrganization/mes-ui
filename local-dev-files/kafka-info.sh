#!/usr/bin/env bash
# Kafka in k3s – gather connection info for namespace machine-monitoring
# Usage: bash kafka-info.sh

set -e
KAFKA_NS="machine-monitoring"

echo "=============================================="
echo "Namespace: $KAFKA_NS"
echo "=============================================="

echo ""
echo "=== 1. Services ==="
kubectl get svc -n "$KAFKA_NS" -o wide 2>/dev/null || echo "Failed to get services"

echo ""
echo "=== 2. Pods ==="
kubectl get pods -n "$KAFKA_NS" -o wide 2>/dev/null || echo "Failed to get pods"

echo ""
echo "=== 3. Secrets (names only) ==="
kubectl get secrets -n "$KAFKA_NS" 2>/dev/null || echo "Failed to get secrets"

echo ""
echo "=== 4. Kafka CR (Strimzi) ==="
kubectl get kafka -n "$KAFKA_NS" -o yaml 2>/dev/null || echo "No Kafka CR or not Strimzi"

echo ""
echo "=== 5. KafkaUser (Strimzi) ==="
kubectl get kafkauser -n "$KAFKA_NS" -o yaml 2>/dev/null || echo "No KafkaUser CR"

echo ""
echo "=== 6. Pod container ports (first Kafka-like pod) ==="
KAFKA_POD=$(kubectl get pods -n "$KAFKA_NS" -o name 2>/dev/null | grep -i kafka | head -1)
if [ -n "$KAFKA_POD" ]; then
  kubectl get "$KAFKA_POD" -n "$KAFKA_NS" -o jsonpath='{.spec.containers[*].name}' 2>/dev/null
  echo ""
  kubectl get "$KAFKA_POD" -n "$KAFKA_NS" -o jsonpath='{range .spec.containers[*]}{.name}{"\t"}{.ports}{"\n"}{end}' 2>/dev/null
else
  echo "No Kafka pod found"
fi

echo ""
echo "=== 7. ConfigMaps (names only) ==="
kubectl get configmaps -n "$KAFKA_NS" 2>/dev/null || echo "Failed to get configmaps"

echo ""
echo "=============================================="
echo "Done. Share this output to get connection details."
echo "=============================================="