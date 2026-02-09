#!/bin/bash
# ==============================================================================
# MoneyMate - PostgreSQL Backup Script
# Creates compressed backup + optional upload to GCS
# Usage: ./backup-db.sh [--upload]
# Cron:  0 2 * * * /opt/moneymate/deploy/backup-db.sh >> /var/log/moneymate/backup.log 2>&1
# ==============================================================================
set -euo pipefail

BACKUP_DIR="/opt/moneymate/backups"
CONTAINER_NAME="moneymate-postgres"
DB_NAME="moneymate"
DB_USER="postgres"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
DAY_OF_WEEK=$(date +%u)  # 1=Monday, 7=Sunday
BACKUP_FILE="$BACKUP_DIR/${DB_NAME}-${TIMESTAMP}.sql.gz"

# Retention policy
DAILY_KEEP=7     # keep last 7 daily backups
WEEKLY_KEEP=4    # keep last 4 weekly backups (Sunday)

# GCS bucket (optional)
GCS_BUCKET="${GCS_BACKUP_BUCKET:-}"

echo "[$(date)] 💾 Starting PostgreSQL backup..."
mkdir -p "$BACKUP_DIR"

# ------------------------------------------------------------------------------
# 1. Create backup
# ------------------------------------------------------------------------------
if ! docker ps --format '{{.Names}}' | grep -q "$CONTAINER_NAME"; then
  echo "[$(date)] ❌ Container $CONTAINER_NAME is not running!"
  exit 1
fi

docker exec "$CONTAINER_NAME" pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$BACKUP_FILE"

BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "[$(date)] ✅ Backup created: $BACKUP_FILE ($BACKUP_SIZE)"

# ------------------------------------------------------------------------------
# 2. Tag weekly backup (copy on Sundays)
# ------------------------------------------------------------------------------
if [ "$DAY_OF_WEEK" -eq 7 ]; then
  WEEKLY_FILE="$BACKUP_DIR/${DB_NAME}-weekly-${TIMESTAMP}.sql.gz"
  cp "$BACKUP_FILE" "$WEEKLY_FILE"
  echo "[$(date)] 📅 Weekly backup created: $WEEKLY_FILE"
fi

# ------------------------------------------------------------------------------
# 3. Upload to GCS (optional)
# ------------------------------------------------------------------------------
if [ -n "$GCS_BUCKET" ] && command -v gsutil &> /dev/null; then
  echo "[$(date)] ☁️  Uploading to GCS: $GCS_BUCKET ..."
  gsutil cp "$BACKUP_FILE" "gs://$GCS_BUCKET/daily/"
  
  if [ "$DAY_OF_WEEK" -eq 7 ]; then
    gsutil cp "$WEEKLY_FILE" "gs://$GCS_BUCKET/weekly/"
  fi
  
  echo "[$(date)] ✅ Upload to GCS complete"
fi

# ------------------------------------------------------------------------------
# 4. Cleanup old backups (retention policy)
# ------------------------------------------------------------------------------
echo "[$(date)] 🧹 Cleaning up old backups..."

# Delete daily backups older than $DAILY_KEEP days
find "$BACKUP_DIR" -name "${DB_NAME}-2*.sql.gz" -not -name "*weekly*" -mtime +$DAILY_KEEP -delete 2>/dev/null && \
  echo "[$(date)] Cleaned daily backups older than $DAILY_KEEP days" || true

# Delete weekly backups older than $WEEKLY_KEEP weeks
find "$BACKUP_DIR" -name "${DB_NAME}-weekly-*.sql.gz" -mtime +$((WEEKLY_KEEP * 7)) -delete 2>/dev/null && \
  echo "[$(date)] Cleaned weekly backups older than $WEEKLY_KEEP weeks" || true

# ------------------------------------------------------------------------------
# 5. Summary
# ------------------------------------------------------------------------------
TOTAL_BACKUPS=$(ls -1 "$BACKUP_DIR"/*.sql.gz 2>/dev/null | wc -l)
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" 2>/dev/null | cut -f1)
echo "[$(date)] 📊 Total backups: $TOTAL_BACKUPS ($TOTAL_SIZE)"
echo "[$(date)] ✅ Backup complete!"
