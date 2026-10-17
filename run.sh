#!/usr/bin/env bash
# Runs a command inside node:22, as the calling user, with this repository mounted — no Node on the host.
#   ./run.sh npm install
#   ./run.sh npm run build
#   ./run.sh dev              # http://localhost:5173
set -euo pipefail

cd "$(dirname "$0")"
port=5173
publish=()
if [[ "${1:-}" == "dev" ]]; then
  publish=(-p "$port:$port")
  set -- npm run dev -- --host 0.0.0.0 --port "$port"
fi

cache="${XDG_CACHE_HOME:-$HOME/.cache}/fintrace-npm"
mkdir -p "$cache"
tty=()
[[ -t 0 && -t 1 ]] && tty=(-it)
exec docker run --rm "${tty[@]}" \
  -u "$(id -u):$(id -g)" \
  -e HOME=/tmp -e npm_config_cache=/cache \
  -v "$cache":/cache \
  -v "$PWD":/w -w /w \
  "${publish[@]}" \
  node:22-bookworm-slim "$@"
