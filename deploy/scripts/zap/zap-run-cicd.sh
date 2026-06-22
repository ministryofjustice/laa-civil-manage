#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../../.." && pwd)"
COMPOSE_FILE="${SCRIPT_DIR}/docker-compose.yml"

# Give Docker client operations more time in CI before timing out.
export DOCKER_CLIENT_TIMEOUT=180
export COMPOSE_HTTP_TIMEOUT=180

retry_pull() {
    local attempts=4
    local delay_seconds=10

    for attempt in $(seq 1 "${attempts}"); do
        echo "--- Pulling external ZAP dependencies (attempt ${attempt}/${attempts}) ---"

        if docker compose -f "${COMPOSE_FILE}" pull wiremock zap-scan; then
            return 0
        fi

        if [ "${attempt}" -lt "${attempts}" ]; then
            echo "--- Pull failed; retrying in ${delay_seconds}s ---"
            sleep "${delay_seconds}"
        fi
    done

    echo "--- Pull failed after ${attempts} attempts ---"
    return 1
}

echo "--- Updating Zap.Yaml for CI ---"
cd "${REPO_ROOT}"
sed -i 's|zap-results|tmp|g' zap.yaml

retry_pull

docker compose \
    -f "${COMPOSE_FILE}" \
    up \
    --exit-code-from zap-scan