#!/bin/bash
# ==============================================================================
# MoneyMate - Health Check Script
# Checks all services and reports status
# Usage: ./healthcheck.sh [--webhook <url>]
# Cron:  */5 * * * * /opt/moneymate/deploy/healthcheck.sh >> /var/log/moneymate/healthcheck.log 2>&1
# ==============================================================================
set -euo pipefail

WEBHOOK_URL="${2:-}"
DOMAIN="${MONEYMATE_DOMAIN:-localhost}"
ALL_OK=true

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

pass() { echo -e "  ${GREEN}✓${NC} $1"; }
fail() { echo -e "  ${RED}✗${NC} $1"; ALL_OK=false; }
warn() { echo -e "  ${YELLOW}!${NC} $1"; }

echo "🏥 MoneyMate Health Check — $(date)"
echo "========================================="

# ------------------------------------------------------------------------------
# 1. Docker containers
# ------------------------------------------------------------------------------
echo ""
echo "📦 Docker Containers:"

EXPECTED_CONTAINERS=("moneymate-postgres" "moneymate-redis" "moneymate-server" "moneymate-client" "moneymate-ocr-worker")

for CONTAINER in "${EXPECTED_CONTAINERS[@]}"; do
  STATUS=$(docker inspect --format='{{.State.Status}}' "$CONTAINER" 2>/dev/null || echo "not_found")
  HEALTH=$(docker inspect --format='{{.State.Health.Status}}' "$CONTAINER" 2>/dev/null || echo "none")

  if [ "$STATUS" = "running" ]; then
    if [ "$HEALTH" = "healthy" ] || [ "$HEALTH" = "none" ]; then
      pass "$CONTAINER: running ($HEALTH)"
    else
      warn "$CONTAINER: running but $HEALTH"
    fi
  else
    fail "$CONTAINER: $STATUS"
  fi
done

# ------------------------------------------------------------------------------
# 2. Endpoint checks
# ------------------------------------------------------------------------------
echo ""
echo "🌐 Endpoints:"

# API health
if curl -sf http://localhost:3000/api/health > /dev/null 2>&1; then
  pass "API /api/health: OK"
else
  fail "API /api/health: FAILED"
fi

# Client (Nginx)
if curl -sf http://localhost:80 > /dev/null 2>&1; then
  pass "Client (port 80): OK"
else
  fail "Client (port 80): FAILED"
fi

# OCR Worker
if curl -sf http://localhost:8080/health > /dev/null 2>&1; then
  pass "OCR Worker /health: OK"
else
  warn "OCR Worker /health: UNREACHABLE (may be normal if internal only)"
fi

# HTTPS (if domain configured)
if [ "$DOMAIN" != "localhost" ]; then
  if curl -sf "https://$DOMAIN" > /dev/null 2>&1; then
    pass "HTTPS ($DOMAIN): OK"
  else
    warn "HTTPS ($DOMAIN): UNREACHABLE"
  fi
fi

# ------------------------------------------------------------------------------
# 3. Resource usage
# ------------------------------------------------------------------------------
echo ""
echo "📊 Resources:"

# Disk usage
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}')
DISK_PCT=${DISK_USAGE%\%}
if [ "$DISK_PCT" -lt 80 ]; then
  pass "Disk: $DISK_USAGE used"
elif [ "$DISK_PCT" -lt 90 ]; then
  warn "Disk: $DISK_USAGE used (getting full!)"
else
  fail "Disk: $DISK_USAGE used (CRITICAL)"
fi

# Memory
MEM_USAGE=$(free | awk 'NR==2 {printf "%.0f", $3/$2 * 100}')
if [ "$MEM_USAGE" -lt 80 ]; then
  pass "Memory: ${MEM_USAGE}% used"
elif [ "$MEM_USAGE" -lt 90 ]; then
  warn "Memory: ${MEM_USAGE}% used"
else
  fail "Memory: ${MEM_USAGE}% used (CRITICAL)"
fi

# Docker disk usage (compact)
DOCKER_SIZE=$(docker system df --format '{{.Size}}' 2>/dev/null | head -1 || echo "unknown")
pass "Docker images: $DOCKER_SIZE"

# ------------------------------------------------------------------------------
# 4. Database connectivity
# ------------------------------------------------------------------------------
echo ""
echo "🗄️  Database:"

if docker exec moneymate-postgres pg_isready -U postgres > /dev/null 2>&1; then
  pass "PostgreSQL: ready"
  
  # Check DB size
  DB_SIZE=$(docker exec moneymate-postgres psql -U postgres -t -c \
    "SELECT pg_size_pretty(pg_database_size('moneymate'));" 2>/dev/null | tr -d ' ')
  pass "Database size: $DB_SIZE"
else
  fail "PostgreSQL: not ready"
fi

if docker exec moneymate-redis redis-cli ping > /dev/null 2>&1; then
  pass "Redis: PONG"
else
  fail "Redis: not responding"
fi

# ------------------------------------------------------------------------------
# 5. Summary
# ------------------------------------------------------------------------------
echo ""
echo "========================================="

if $ALL_OK; then
  echo -e "${GREEN}✅ All checks passed!${NC}"
  EXIT_CODE=0
else
  echo -e "${RED}❌ Some checks failed!${NC}"
  EXIT_CODE=1
fi

# Optional webhook notification on failure
if [ "$EXIT_CODE" -ne 0 ] && [ -n "$WEBHOOK_URL" ]; then
  HOSTNAME=$(hostname)
  curl -sf -X POST "$WEBHOOK_URL" \
    -H "Content-Type: application/json" \
    -d "{\"text\": \"⚠️ MoneyMate health check failed on $HOSTNAME at $(date)\"}" \
    > /dev/null 2>&1 || true
fi

exit $EXIT_CODE
