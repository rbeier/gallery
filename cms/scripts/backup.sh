#!/usr/bin/env bash
#
# Backup script for the production gallery deployment.
#
# Backs up the Strapi CMS SQLite database and the uploads directory that the
# Docker deployment persists under $DATA_DIR (default /opt/rbeier.dev).
#
# The database is pulled straight out of the running cms container with
# `docker cp`, so the script needs no sqlite3 CLI on the host. Before copying,
# it checkpoints the WAL into the main db file so the snapshot is complete;
# any remaining -wal/-shm sidecars are copied too as a safety net.
#
# Usage:
#   ./cms/scripts/backup.sh
#
# Environment variables (all optional):
#   DATA_DIR      Deployment data root         (default: /opt/rbeier.dev)
#   BACKUP_DIR    Where archives are written    (default: $DATA_DIR/backups)
#   RETENTION     Days of backups to keep       (default: 14)
#   COMPOSE_FILE  docker compose file to use    (default: $DATA_DIR/docker-compose.yml)
#   DB_PATH       DB path inside the container   (default: /data/data.db)
#
set -euo pipefail

DATA_DIR="${DATA_DIR:-/opt/rbeier.dev}"
BACKUP_DIR="${BACKUP_DIR:-$DATA_DIR/backups}"
RETENTION="${RETENTION:-14}"
COMPOSE_FILE="${COMPOSE_FILE:-$DATA_DIR/docker-compose.yml}"
DB_PATH="${DB_PATH:-/data/data.db}"

UPLOADS_DIR="$DATA_DIR/cms-data/uploads"

TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
STAGING="$(mktemp -d)"

log()  { printf '[backup %s] %s\n' "$(date +%H:%M:%S)" "$*"; }
die()  { printf '[backup ERROR] %s\n' "$*" >&2; exit 1; }
cleanup() { rm -rf "$STAGING"; }
trap cleanup EXIT

compose() { docker compose -f "$COMPOSE_FILE" "$@"; }

# --- sanity checks ---------------------------------------------------------
command -v docker >/dev/null 2>&1 || die "docker not found"
[ -d "$UPLOADS_DIR" ] || die "uploads dir not found: $UPLOADS_DIR"
CID="$(compose ps -q cms)"
[ -n "$CID" ] || die "cms container not running (cannot copy live db)"
mkdir -p "$BACKUP_DIR" "$STAGING/database"

# --- database backup (docker cp) -------------------------------------------
# Flush the WAL into the main db file so the copied data.db is self-contained.
# better-sqlite3 ships inside the CMS image; best effort, sidecars cover misses.
log "checkpointing WAL inside cms container"
compose exec -T cms node -e \
  "const S=require('better-sqlite3');const db=new S(process.argv[1]);db.pragma('wal_checkpoint(TRUNCATE)');db.close();" \
  "$DB_PATH" \
  || log "WARN: WAL checkpoint failed; copying db+wal+shm as-is"

log "copying database out of container ($DB_PATH)"
docker cp "$CID:$DB_PATH"      "$STAGING/database/data.db"
docker cp "$CID:${DB_PATH}-wal" "$STAGING/database/data.db-wal" 2>/dev/null || true
docker cp "$CID:${DB_PATH}-shm" "$STAGING/database/data.db-shm" 2>/dev/null || true

# Verify the snapshot if a host sqlite3 is available (non-fatal otherwise).
if command -v sqlite3 >/dev/null 2>&1; then
  log "verifying snapshot integrity"
  result="$(sqlite3 "$STAGING/database/data.db" 'PRAGMA integrity_check;')"
  [ "$result" = "ok" ] || die "integrity check failed: $result"
fi

# --- assemble archive ------------------------------------------------------
ARCHIVE="$BACKUP_DIR/gallery-backup-$TIMESTAMP.tar.gz"
log "creating archive $ARCHIVE"

# Archive lays out as:  database/data.db  and  uploads/...
tar -czf "$ARCHIVE" \
  -C "$STAGING" database \
  -C "$DATA_DIR/cms-data" uploads

log "archive written ($(du -h "$ARCHIVE" | cut -f1))"

# --- checksum --------------------------------------------------------------
if command -v sha256sum >/dev/null 2>&1; then
  ( cd "$BACKUP_DIR" && sha256sum "$(basename "$ARCHIVE")" > "$(basename "$ARCHIVE").sha256" )
elif command -v shasum >/dev/null 2>&1; then
  ( cd "$BACKUP_DIR" && shasum -a 256 "$(basename "$ARCHIVE")" > "$(basename "$ARCHIVE").sha256" )
fi

# --- retention -------------------------------------------------------------
log "pruning backups older than $RETENTION days"
find "$BACKUP_DIR" -maxdepth 1 -name 'gallery-backup-*.tar.gz*' -type f \
  -mtime "+$RETENTION" -print -delete || true

log "done"
