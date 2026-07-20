#!/usr/bin/env bash
#
# MongoDB Backup Script
#
# Creates a compressed BSON dump of the database and stores it in ./backups/.
# Usage:
#   ./scripts/backup.sh                        # backup using env defaults
#   MONGODB_URI=mongodb://... ./scripts/backup.sh
#
# Recommended cron (daily at 2 AM):
#   0 2 * * * /path/to/scripts/backup.sh >> /var/log/mongo-backup.log 2>&1
#
# Restore:
#   mongorestore --uri="$MONGODB_URI" --archive=./backups/ticket-system-<date>.gz --gzip
#

set -euo pipefail

# ── Configuration ─────────────────────────────────────────────────────────────
: "${MONGODB_URI:?Set MONGODB_URI environment variable before running backup.sh}"
DATABASE="${MONGO_DATABASE:-ticket-system}"
BACKUP_DIR="${BACKUP_DIR:-$(dirname "$0")/../backups}"
DATE=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_FILE="${BACKUP_DIR}/${DATABASE}-${DATE}.gz"

# ── Prepare backup directory ──────────────────────────────────────────────────
mkdir -p "$BACKUP_DIR"

# ── Create backup ─────────────────────────────────────────────────────────────
echo "[$(date)] Starting backup of database: ${DATABASE}"

mongodump \
  --uri="$MONGODB_URI" \
  --db="$DATABASE" \
  --archive="$BACKUP_FILE" \
  --gzip

echo "[$(date)] Backup completed: ${BACKUP_FILE}"
echo "[$(date)] Size: $(du -h "$BACKUP_FILE" | cut -f1)"

# ── Cleanup old backups (keep last 30 days) ───────────────────────────────────
KEEP_DAYS="${KEEP_DAYS:-30}"
echo "[$(date)] Removing backups older than ${KEEP_DAYS} days..."

find "$BACKUP_DIR" -name "${DATABASE}-*.gz" -type f -mtime +${KEEP_DAYS} -delete

REMAINING=$(find "$BACKUP_DIR" -name "${DATABASE}-*.gz" -type f | wc -l)
echo "[$(date)] Backups on disk: ${REMAINING}"
echo "[$(date)] Backup script finished."
