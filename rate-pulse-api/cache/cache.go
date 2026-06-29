package cache

import (
	"context"
	"time"
)

type ResponseCache interface {
	Get(ctx context.Context, key string) ([]byte, bool, error)
	Set(ctx context.Context, key string, value []byte, ttl time.Duration) error
	Delete(ctx context.Context, keys ...string) error
	DeleteByPrefix(ctx context.Context, prefix string) error
}

type NoopResponseCache struct{}

func (NoopResponseCache) Get(ctx context.Context, key string) ([]byte, bool, error) {
	return nil, false, nil
}

func (NoopResponseCache) Set(ctx context.Context, key string, value []byte, ttl time.Duration) error {
	return nil
}

func (NoopResponseCache) Delete(ctx context.Context, keys ...string) error {
	return nil
}

func (NoopResponseCache) DeleteByPrefix(ctx context.Context, prefix string) error {
	return nil
}
