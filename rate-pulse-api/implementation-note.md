# Implementation Note

## Asynq health check interval

- Set `HealthCheckInterval` to 1 hour to reduce Redis `PING` command usage on the free Upstash quota.
- Tradeoff: Asynq will report Redis connectivity issues less frequently through its health checker. Normal queue operations still fail and log errors when Redis is unavailable, so this mainly affects proactive health pings.
