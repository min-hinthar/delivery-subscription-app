# Monitoring Alert Configuration Examples

**Purpose**: Example configurations for setting up automated alerts for database health monitoring.

---

## Table of Contents

1. [Cron + Slack Webhook](#1-cron--slack-webhook)
2. [Uptime Robot](#2-uptime-robot)
3. [Better Uptime](#3-better-uptime)
4. [Datadog](#4-datadog)
5. [New Relic](#5-new-relic)
6. [PagerDuty](#6-pagerduty)
7. [Custom Monitoring Script](#7-custom-monitoring-script)

---

## 1. Cron + Slack Webhook

**Best for**: Small teams, simple setup, free

### Setup

1. **Create Slack Incoming Webhook**:
   - Go to https://api.slack.com/apps
   - Create new app → Incoming Webhooks
   - Copy webhook URL

2. **Create alert script**:

```bash
#!/bin/bash
# scripts/monitoring/alert-slack.sh

set -euo pipefail

SLACK_WEBHOOK="${SLACK_WEBHOOK_URL}"
APP_NAME="Morning Star Delivery"
THRESHOLD=80

# Check connection health
RESULT=$(bash scripts/monitoring/check-db-connections.sh 2>&1)
EXIT_CODE=$?

# Parse connection usage
USAGE=$(echo "$RESULT" | grep "Usage:" | awk '{print $2}' | tr -d '%' || echo "0")

if [[ $EXIT_CODE -ne 0 ]] || (( $(echo "$USAGE > $THRESHOLD" | bc -l 2>/dev/null || echo "0") )); then
  # Send alert to Slack
  curl -X POST "$SLACK_WEBHOOK" \
    -H 'Content-Type: application/json' \
    -d "{
      \"text\": \"🚨 *${APP_NAME} Database Alert*\",
      \"blocks\": [
        {
          \"type\": \"section\",
          \"text\": {
            \"type\": \"mrkdwn\",
            \"text\": \"*Database Connection Warning*\\nConnection usage: *${USAGE}%* (threshold: ${THRESHOLD}%)\"
          }
        },
        {
          \"type\": \"section\",
          \"text\": {
            \"type\": \"mrkdwn\",
            \"text\": \"\`\`\`${RESULT}\`\`\`\"
          }
        }
      ]
    }"
fi
```

3. **Make executable**:
```bash
chmod +x scripts/monitoring/alert-slack.sh
```

4. **Add to crontab** (check every 5 minutes):
```bash
# Edit crontab
crontab -e

# Add line:
*/5 * * * * cd /path/to/delivery-subscription-app && SLACK_WEBHOOK_URL="https://hooks.slack.com/services/YOUR/WEBHOOK" bash scripts/monitoring/alert-slack.sh >> /var/log/db-alerts.log 2>&1
```

---

## 2. Uptime Robot

**Best for**: Simple uptime monitoring, free tier available

### Setup

1. **Create account** at https://uptimerobot.com

2. **Add new monitor**:
   - Monitor Type: HTTP(s)
   - Friendly Name: "DB Health Check"
   - URL: `https://your-domain.com/api/health/db?secret=YOUR_SECRET`
   - Monitoring Interval: 5 minutes
   - Monitor Timeout: 30 seconds

3. **Configure keyword monitoring** (optional):
   - Keyword: `"status":"healthy"`
   - Keyword Type: Exists
   - Alert when keyword: Does not exist

4. **Add alert contacts**:
   - Email, SMS, Slack, Discord, etc.

### Pro Tips
- Use a dedicated health check secret
- Set up multiple contacts (email + Slack)
- Enable "Send DOWN alerts immediately"

---

## 3. Better Uptime

**Best for**: Beautiful status pages, multi-region monitoring

### Setup

1. **Create account** at https://betteruptime.com

2. **Create monitor**:
   ```yaml
   URL: https://your-domain.com/api/health/db?secret=YOUR_SECRET
   Method: GET
   Expected Status Code: 200
   Regions: Multiple (US-East, US-West, EU)
   Check Frequency: 30 seconds
   ```

3. **Add JSON validation**:
   ```json
   {
     "checks": [
       {
         "type": "json_path",
         "path": "$.status",
         "expected_value": "healthy"
       },
       {
         "type": "json_path",
         "path": "$.checks.database.status",
         "expected_value": "up"
       }
     ]
   }
   ```

4. **Create on-call schedule**:
   - Add team members
   - Set escalation policy
   - Configure notification channels

5. **Create status page** (public or private):
   - Show database health
   - Show API health
   - Custom domain support

---

## 4. Datadog

**Best for**: Enterprise monitoring, deep analytics

### Setup

1. **Install Datadog Agent** (optional, for server monitoring)

2. **Create Synthetic Test**:

```yaml
# datadog-synthetics.yaml
type: api
subtype: http
name: Database Health Check
config:
  request:
    url: https://your-domain.com/api/health/db?secret={{HEALTH_CHECK_SECRET}}
    method: GET
    timeout: 30
  assertions:
    - type: statusCode
      operator: is
      target: 200
    - type: body
      operator: contains
      target: '"status":"healthy"'
    - type: responseTime
      operator: lessThan
      target: 5000
  locations:
    - aws:us-east-1
    - aws:us-west-2
  options:
    tick_every: 300 # 5 minutes
```

3. **Create Custom Metrics** (using RPC functions):

```typescript
// pages/api/monitoring/metrics.ts
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export default async function handler(req, res) {
  const supabase = createSupabaseAdminClient();

  // Get connection stats
  const { data: connStats } = await supabase.rpc('get_connection_stats');

  // Send to Datadog (requires dd-trace)
  const { dogstatsd } = require('dd-trace');
  dogstatsd.gauge('db.connections.active', connStats.active_connections);
  dogstatsd.gauge('db.connections.percent', connStats.percent_used);

  res.status(200).json({ ok: true });
}
```

4. **Create Monitors**:
   - Connection usage > 80%
   - Query response time > 1000ms
   - Health check failures

5. **Set up Dashboards**:
   - Real-time connection usage
   - Query performance trends
   - Table growth over time

---

## 5. New Relic

**Best for**: APM + infrastructure monitoring

### Setup

1. **Install New Relic APM**:
```bash
npm install newrelic
```

2. **Configure newrelic.js**:
```javascript
'use strict';

exports.config = {
  app_name: ['Morning Star Delivery'],
  license_key: process.env.NEW_RELIC_LICENSE_KEY,
  logging: {
    level: 'info'
  },
  distributed_tracing: {
    enabled: true
  }
};
```

3. **Create Synthetic Monitor**:
   - URL: `https://your-domain.com/api/health/db?secret=YOUR_SECRET`
   - Frequency: 5 minutes
   - Locations: Multiple
   - Script validation:

```javascript
/**
 * Health check validation script
 */
$http.get('https://your-domain.com/api/health/db?secret=' + $secure.HEALTH_CHECK_SECRET,
  function(err, response, body) {
    if (err) {
      throw new Error('Health check failed: ' + err);
    }

    const data = JSON.parse(body);

    // Validate status
    assert.equal(data.status, 'healthy', 'Database should be healthy');
    assert.equal(data.checks.database.status, 'up', 'Database should be up');

    // Validate response time
    assert.ok(data.checks.database.response_time_ms < 5000,
      'Response time should be < 5000ms');

    // Validate connections if available
    if (data.checks.database.connections) {
      assert.ok(data.checks.database.connections.percent_used < 80,
        'Connection usage should be < 80%');
    }
  }
);
```

4. **Create Alert Conditions**:
   - Health check fails
   - Response time > 5s
   - Error rate > 5%

---

## 6. PagerDuty

**Best for**: On-call management, incident response

### Setup

1. **Create service** in PagerDuty

2. **Get integration key**

3. **Create alert webhook**:

```bash
#!/bin/bash
# scripts/monitoring/alert-pagerduty.sh

INTEGRATION_KEY="${PAGERDUTY_INTEGRATION_KEY}"
THRESHOLD=80

RESULT=$(bash scripts/monitoring/check-db-connections.sh 2>&1)
EXIT_CODE=$?
USAGE=$(echo "$RESULT" | grep "Usage:" | awk '{print $2}' | tr -d '%' || echo "0")

if [[ $EXIT_CODE -ne 0 ]] || (( $(echo "$USAGE > $THRESHOLD" | bc -l) )); then
  # Create PagerDuty incident
  curl -X POST 'https://events.pagerduty.com/v2/enqueue' \
    -H 'Content-Type: application/json' \
    -d "{
      \"routing_key\": \"${INTEGRATION_KEY}\",
      \"event_action\": \"trigger\",
      \"payload\": {
        \"summary\": \"Database connection usage at ${USAGE}%\",
        \"severity\": \"error\",
        \"source\": \"monitoring-script\",
        \"custom_details\": {
          \"connection_usage\": \"${USAGE}%\",
          \"threshold\": \"${THRESHOLD}%\",
          \"full_output\": \"${RESULT}\"
        }
      }
    }"
fi
```

4. **Set up escalation policy**:
   - On-call schedule
   - Escalation rules
   - Notification preferences

---

## 7. Custom Monitoring Script

**Best for**: Full control, integration with existing systems

### Complete Monitoring Script

```bash
#!/bin/bash
# scripts/monitoring/comprehensive-alert.sh

set -euo pipefail

# Configuration
CONNECTION_THRESHOLD=80
SLOW_QUERY_MS=1000
ALERT_EMAIL="ops@example.com"
SLACK_WEBHOOK="${SLACK_WEBHOOK_URL:-}"
LOG_FILE="/var/log/db-monitoring.log"

# Timestamp for logging
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# Initialize alert message
ALERT_MESSAGE=""
ALERT_LEVEL="INFO"

# Function to log
log() {
  echo "[$TIMESTAMP] $1" | tee -a "$LOG_FILE"
}

# Function to send alert
send_alert() {
  local level=$1
  local message=$2

  log "$level: $message"

  # Email alert
  if [[ -n "$ALERT_EMAIL" ]]; then
    echo "$message" | mail -s "[$level] DB Monitoring Alert" "$ALERT_EMAIL"
  fi

  # Slack alert
  if [[ -n "$SLACK_WEBHOOK" ]]; then
    local emoji="ℹ️"
    [[ "$level" == "WARNING" ]] && emoji="⚠️"
    [[ "$level" == "CRITICAL" ]] && emoji="🚨"

    curl -X POST "$SLACK_WEBHOOK" \
      -H 'Content-Type: application/json' \
      -d "{\"text\": \"${emoji} *${level}*: ${message}\"}" \
      2>/dev/null
  fi
}

log "Starting database health check"

# Check 1: Connection health
CONNECTION_CHECK=$(bash scripts/monitoring/check-db-connections.sh 2>&1 || echo "ERROR")
if echo "$CONNECTION_CHECK" | grep -q "ERROR\|WARNING"; then
  ALERT_LEVEL="WARNING"
  ALERT_MESSAGE="${ALERT_MESSAGE}\n\nConnection Health:\n${CONNECTION_CHECK}"
fi

# Check 2: Query performance
SLOW_QUERIES=$(bash scripts/monitoring/check-query-performance.sh 2>&1 | grep "Found.*queries exceeding" || echo "")
if [[ -n "$SLOW_QUERIES" ]]; then
  ALERT_LEVEL="WARNING"
  ALERT_MESSAGE="${ALERT_MESSAGE}\n\nSlow Queries:\n${SLOW_QUERIES}"
fi

# Check 3: Health endpoint
HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" "https://your-domain.com/api/health/db?secret=$HEALTH_CHECK_SECRET" || echo "000")
if [[ "$HEALTH_CHECK" != "200" ]]; then
  ALERT_LEVEL="CRITICAL"
  ALERT_MESSAGE="${ALERT_MESSAGE}\n\nHealth endpoint returned: ${HEALTH_CHECK}"
fi

# Send alert if issues detected
if [[ "$ALERT_LEVEL" != "INFO" ]]; then
  send_alert "$ALERT_LEVEL" "Database monitoring detected issues:${ALERT_MESSAGE}"
else
  log "All checks passed ✓"
fi
```

**Setup cron**:
```bash
# Run every 5 minutes
*/5 * * * * bash /path/to/scripts/monitoring/comprehensive-alert.sh

# Or run hourly for performance checks
0 * * * * bash /path/to/scripts/monitoring/check-query-performance.sh >> /var/log/query-performance.log
```

---

## Alert Priority Matrix

| Condition | Severity | Response Time | Notification |
|-----------|----------|---------------|--------------|
| Connection usage >60% | Info | Monitor | Log only |
| Connection usage >80% | Warning | 30 min | Email + Slack |
| Connection usage >95% | Critical | Immediate | Page on-call |
| Health check down | Critical | Immediate | Page on-call |
| Query >1000ms | Warning | 1 hour | Email |
| Query >5000ms | Critical | 15 min | Email + Slack |
| Response time >5s | Warning | 30 min | Slack |
| Response time >10s | Critical | 15 min | Page on-call |

---

## Testing Alerts

### Test Slack Webhook

```bash
curl -X POST "YOUR_SLACK_WEBHOOK_URL" \
  -H 'Content-Type: application/json' \
  -d '{"text": "🧪 Test alert from monitoring system"}'
```

### Test PagerDuty

```bash
curl -X POST 'https://events.pagerduty.com/v2/enqueue' \
  -H 'Content-Type: application/json' \
  -d '{
    "routing_key": "YOUR_INTEGRATION_KEY",
    "event_action": "trigger",
    "payload": {
      "summary": "Test alert",
      "severity": "info",
      "source": "test"
    }
  }'
```

### Test Email

```bash
echo "Test alert" | mail -s "Test DB Alert" your-email@example.com
```

---

## Best Practices

1. **Start simple**: Begin with cron + Slack, upgrade as needed
2. **Test regularly**: Test alerts monthly to ensure they work
3. **Set appropriate thresholds**: Avoid alert fatigue
4. **Document runbooks**: What to do when alert fires
5. **Review and adjust**: Tune thresholds based on actual usage
6. **Multiple channels**: Email + Slack for warnings, page for critical
7. **Escalation policy**: If no response in X minutes, escalate

---

## Troubleshooting

**Alerts not firing?**
- Check cron is running: `crontab -l`
- Check script permissions: `ls -la scripts/monitoring/`
- Check logs: `tail -f /var/log/db-monitoring.log`

**Too many false positives?**
- Increase thresholds
- Add retry logic before alerting
- Use different thresholds for different times (higher during peak hours)

**Webhook not working?**
- Test webhook URL directly with curl
- Check for firewalls blocking outbound requests
- Verify webhook URL is still valid

---

**Last Updated**: 2026-01-05
**Maintained by**: Operations Team
