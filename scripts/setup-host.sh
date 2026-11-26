#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
umask 077

if [[ ! -e .env ]]; then
  password=$(openssl rand -hex 24)
  (set -o noclobber; printf 'FORGE_USERNAME=admin\nAUTH_TOKEN=%s\n' "$password" > .env)
fi

if ! grep -q '^AUTH_TOKEN=.' .env; then
  printf 'Set AUTH_TOKEN in .env before continuing.\n' >&2
  exit 1
fi

chmod 600 .env
printf 'Forge credentials for this host\n'
grep '^FORGE_USERNAME=' .env || printf 'FORGE_USERNAME=admin\n'
sed -n 's/^AUTH_TOKEN=/Password: /p' .env
