#!/usr/bin/env bash
# Starts the laa-civil-manage-api Spring Boot backend for local development.
# Override the checkout location with LAA_CIVIL_MANAGE_API_PATH if it isn't a sibling folder.
set -euo pipefail

BACKEND_DIR="${LAA_CIVIL_MANAGE_API_PATH:-../laa-civil-manage-api}"

if [ ! -d "$BACKEND_DIR" ]; then
  echo "laa-civil-manage-api not found at '$BACKEND_DIR'." >&2
  echo "Clone https://github.com/ministryofjustice/laa-civil-manage-api there, or set LAA_CIVIL_MANAGE_API_PATH to its location." >&2
  exit 1
fi

if [ ! -x "$BACKEND_DIR/gradlew" ]; then
  echo "'$BACKEND_DIR/gradlew' is missing or not executable." >&2
  exit 1
fi

echo "Starting laa-civil-manage-api from $BACKEND_DIR (spring profile: local) ..."
cd "$BACKEND_DIR"
exec ./gradlew bootRun --args='--spring.profiles.active=local'
