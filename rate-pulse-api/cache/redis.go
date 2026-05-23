package cache

import (
	"context"
	"crypto/tls"
	"errors"
	"net"
	"strings"
	"time"

	"github.com/ThanhVinhTong/rate-pulse/util"
	"github.com/redis/go-redis/v9"
)

type RedisResponseCache struct {
	client *redis.Client
}

// NewRedisClient creates a Redis client for general use (e.g., rate limiting)
func NewRedisClient(config util.Config) (*redis.Client, error) {
	if strings.TrimSpace(config.RedisAddress) == "" {
		return nil, errors.New("REDIS_ADDRESS is required")
	}

	opt := &redis.Options{
		Addr:     strings.TrimSpace(config.RedisAddress),
		Username: strings.TrimSpace(config.RedisUsername),
		Password: config.RedisPassword,
	}
	if config.RedisTLS {
		opt.TLSConfig = redisTLSConfig(opt.Addr)
	}

	return redis.NewClient(opt), nil
}

func NewRedisResponseCache(config util.Config) (*RedisResponseCache, error) {
	if strings.TrimSpace(config.RedisAddress) == "" {
		return nil, errors.New("REDIS_ADDRESS is required")
	}

	opt := &redis.Options{
		Addr:     strings.TrimSpace(config.RedisAddress),
		Username: strings.TrimSpace(config.RedisUsername),
		Password: config.RedisPassword,
	}
	if config.RedisTLS {
		opt.TLSConfig = redisTLSConfig(opt.Addr)
	}

	return &RedisResponseCache{
		client: redis.NewClient(opt),
	}, nil
}

func (cache *RedisResponseCache) Get(ctx context.Context, key string) ([]byte, bool, error) {
	value, err := cache.client.Get(ctx, key).Bytes()
	if errors.Is(err, redis.Nil) {
		return nil, false, nil
	}
	if err != nil {
		return nil, false, err
	}

	return value, true, nil
}

func (cache *RedisResponseCache) Set(ctx context.Context, key string, value []byte, ttl time.Duration) error {
	return cache.client.Set(ctx, key, value, ttl).Err()
}

func (cache *RedisResponseCache) Delete(ctx context.Context, keys ...string) error {
	if len(keys) == 0 {
		return nil
	}

	return cache.client.Del(ctx, keys...).Err()
}

func redisTLSConfig(address string) *tls.Config {
	host, _, err := net.SplitHostPort(address)
	if err != nil {
		host = address
	}

	return &tls.Config{
		MinVersion: tls.VersionTLS12,
		ServerName: host,
	}
}
