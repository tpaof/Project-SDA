#!/bin/bash
# ==============================================================================
# MoneyMate - PostgreSQL Restore Script
# Restores database from a backup file
# Usage: ./restore-db.sh <backup-file.sql.gz>
# ==============================================================================
set -euo pipefail

CONTAINER_NAME="moneymate-postgres"
DB_NAME="moneymate"
DB_USER="postgres"
BACKUP_FILE="${1:-}"

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: $0 <backup-file.sql.gz>"
  echo ""
  echo "Available backups:"
  ls -lht /opt/moneymate/backups/*.sql.gz 2>/dev/null || echo "  No backups found"
  exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
  echo "❌ Backup file not found: $BACKUP_FILE"
  exit 1
fi

# Confirmation
BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "⚠️  WARNING: This will REPLACE the current database!"
echo ""
echo "  Backup file: $BACKUP_FILE ($BACKUP_SIZE)"
echo "  Database:    $DB_NAME"
echo "  Container:   $CONTAINER_NAME"
echo ""
read -p "Are you sure? (type 'yes' to confirm): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  echo "Cancelled."
  exit 0
fi

# Check container is running
if ! docker ps --format '{{.Names}}' | grep -q "$CONTAINER_NAME"; then
  echo "❌ Container $CONTAINER_NAME is not running!"
  echo "Start it with: docker compose up -d postgres"
  exit 1
fi

echo "🔄 Restoring database from backup..."

# Step 1: Drop existing connections
echo "[1/4] Dropping existing connections..."
docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -c "
  SELECT pg_terminate_backend(pg_stat_activity.pid)
  FROM pg_stat_activity
  WHERE pg_stat_activity.datname = '$DB_NAME'
  AND pid <> pg_backend_pid();
" 2>/dev/null || true

# Step 2: Drop and recreate database
echo "[2/4] Recreating database..."
docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -c "DROP DATABASE IF EXISTS $DB_NAME;"
docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -c "CREATE DATABASE $DB_NAME;"

# Step 3: Restore from backup
echo "[3/4] Restoring data..."
gunzip -c "$BACKUP_FILE" | docker exec -i "$CONTAINER_NAME" psql -U "$DB_USER" "$DB_NAME"

# Step 4: Verify
echo "[4/4] Verifying restore..."
TABLE_COUNT=$(docker exec "$CONTAINER_NAME" psql -U "$DB_USER" "$DB_NAME" -t -c \
  "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';")
echo "  Tables found: $(echo "$TABLE_COUNT" | tr -d ' ')"

echo ""
echo "✅ Database restored successfully from: $BACKUP_FILE"
echo ""
echo "Note: You may need to restart the server:"
echo "  docker compose restart server"
