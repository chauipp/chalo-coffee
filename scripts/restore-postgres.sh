#!/usr/bin/env bash
set -euo pipefail

: "${BACKUP_FILE:?Set BACKUP_FILE to a pg_dump custom-format file}"
: "${POSTGRES_CONTAINER:?Set POSTGRES_CONTAINER (for example: chalo-coffee-postgres-1)}"
: "${DB_USERNAME:?Set DB_USERNAME}"
: "${DB_DATABASE:?Set DB_DATABASE}"

expected_confirmation="--confirm-restore=${DB_DATABASE}"
if [[ "${1:-}" != "$expected_confirmation" ]]; then
  echo "Restore is destructive. Re-run with exactly: $expected_confirmation" >&2
  exit 1
fi
if [[ ! -f "$BACKUP_FILE" || ! -f "${BACKUP_FILE}.sha256" ]]; then
  echo "Backup file and its .sha256 companion are both required" >&2
  exit 1
fi

(cd "$(dirname "$BACKUP_FILE")" && sha256sum -c "$(basename "${BACKUP_FILE}").sha256")
docker exec -i "$POSTGRES_CONTAINER" pg_restore --clean --if-exists --no-owner -U "$DB_USERNAME" -d "$DB_DATABASE" < "$BACKUP_FILE"
if [[ "${2:-}" == "--restore-uploads" ]]; then
  : "${BACKEND_CONTAINER:?Set BACKEND_CONTAINER when restoring uploads}"
  uploads_file="${BACKUP_FILE%.dump}.uploads.tar.gz"
  if [[ ! -f "$uploads_file" || ! -f "${uploads_file}.sha256" ]]; then
    echo "Uploads archive and checksum are required with --restore-uploads" >&2
    exit 1
  fi
  (cd "$(dirname "$uploads_file")" && sha256sum -c "$(basename "${uploads_file}").sha256")
  temp_uploads_dir="$(mktemp -d)"
  trap 'rm -rf "$temp_uploads_dir"' EXIT
  tar -C "$temp_uploads_dir" -xzf "$uploads_file"
  docker exec "$BACKEND_CONTAINER" sh -c 'find /app/uploads -mindepth 1 -delete'
  docker cp "$temp_uploads_dir/." "$BACKEND_CONTAINER:/app/uploads"
  rm -rf "$temp_uploads_dir"
  trap - EXIT
fi
echo "Restore completed for database: $DB_DATABASE"
