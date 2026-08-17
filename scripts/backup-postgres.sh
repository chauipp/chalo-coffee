#!/usr/bin/env bash
set -euo pipefail

: "${BACKUP_DIR:?Set BACKUP_DIR to an existing backup directory}"
: "${POSTGRES_CONTAINER:?Set POSTGRES_CONTAINER (for example: chalo-coffee-postgres-1)}"
: "${BACKEND_CONTAINER:?Set BACKEND_CONTAINER (for example: chalo-coffee-backend-1)}"
: "${DB_USERNAME:?Set DB_USERNAME}"
: "${DB_DATABASE:?Set DB_DATABASE}"

if [[ ! -d "$BACKUP_DIR" ]]; then
  echo "BACKUP_DIR must already exist: $BACKUP_DIR" >&2
  exit 1
fi

timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
backup_file="$BACKUP_DIR/chalo-postgres-${DB_DATABASE}-${timestamp}.dump"
checksum_file="${backup_file}.sha256"
uploads_file="${backup_file%.dump}.uploads.tar.gz"
uploads_checksum_file="${uploads_file}.sha256"
temp_file="${backup_file}.partial"
temp_uploads_file="${uploads_file}.partial"
temp_uploads_dir="$(mktemp -d "$BACKUP_DIR/.uploads-${timestamp}-XXXXXX")"

if [[ -e "$backup_file" || -e "$checksum_file" || -e "$uploads_file" || -e "$uploads_checksum_file" || -e "$temp_file" || -e "$temp_uploads_file" ]]; then
  echo "Refusing to overwrite existing backup target: $backup_file" >&2
  exit 1
fi

trap 'rm -f "$temp_file" "$temp_uploads_file" "${temp_file}.sha256" "${temp_uploads_file}.sha256"; rm -rf "$temp_uploads_dir"' EXIT
docker exec "$POSTGRES_CONTAINER" pg_dump -Fc -U "$DB_USERNAME" "$DB_DATABASE" > "$temp_file"
sha256sum "$temp_file" > "${temp_file}.sha256"
docker cp "$BACKEND_CONTAINER:/app/uploads/." "$temp_uploads_dir"
tar -C "$temp_uploads_dir" -czf "$temp_uploads_file" .
sha256sum "$temp_uploads_file" > "${temp_uploads_file}.sha256"
mv "$temp_file" "$backup_file"
mv "${temp_file}.sha256" "$checksum_file"
mv "$temp_uploads_file" "$uploads_file"
mv "${temp_uploads_file}.sha256" "$uploads_checksum_file"
trap - EXIT
rm -rf "$temp_uploads_dir"
echo "Backup created: $backup_file and $uploads_file"
