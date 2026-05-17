package service

import (
	"context"
	"time"

	db "github.com/ThanhVinhTong/rate-pulse/db/sqlc"
)

const (
	HealthStatusHealthy   = "healthy"
	HealthStatusDegraded  = "degraded"
	HealthStatusUnhealthy = "unhealthy"
)

type HealthService struct {
	store     *db.Store
	startedAt time.Time
}

func NewHealthService(store *db.Store) *HealthService {
	return &HealthService{
		store:     store,
		startedAt: time.Now(),
	}
}

func (s *HealthService) CheckHealth(ctx context.Context) CheckHealthResult {
	now := time.Now()
	result := CheckHealthResult{
		ServiceName:   "rate-pulse-api",
		Status:        HealthStatusHealthy,
		Version:       "unknown",
		UptimeSeconds: int64(now.Sub(s.startedAt).Seconds()),
		CheckedAt:     now,
		Dependencies: []DependencyHealth{
			s.databaseHealth(ctx),
		},
	}

	for _, dependency := range result.Dependencies {
		if dependency.Status != HealthStatusHealthy {
			result.Status = HealthStatusDegraded
			break
		}
	}

	return result
}

func (s *HealthService) databaseHealth(ctx context.Context) DependencyHealth {
	if s.store == nil {
		return DependencyHealth{
			Name:    "postgres",
			Status:  HealthStatusUnhealthy,
			Message: "database store is not configured",
		}
	}

	pingCtx, cancel := context.WithTimeout(ctx, 2*time.Second)
	defer cancel()

	if err := s.store.PingContext(pingCtx); err != nil {
		return DependencyHealth{
			Name:    "postgres",
			Status:  HealthStatusUnhealthy,
			Message: "database ping failed",
		}
	}

	return DependencyHealth{
		Name:    "postgres",
		Status:  HealthStatusHealthy,
		Message: "database is reachable",
	}
}
