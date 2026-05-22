package worker

import (
	"crypto/tls"
	"errors"
	"net"
	"strings"

	"github.com/ThanhVinhTong/rate-pulse/util"
	"github.com/hibiken/asynq"
)

func NewRedisClientOpt(config util.Config) (asynq.RedisClientOpt, error) {
	if strings.TrimSpace(config.RedisAddress) == "" {
		return asynq.RedisClientOpt{}, errors.New("REDIS_ADDRESS is required")
	}

	opt := asynq.RedisClientOpt{
		Addr:     strings.TrimSpace(config.RedisAddress),
		Username: strings.TrimSpace(config.RedisUsername),
		Password: config.RedisPassword,
	}
	if config.RedisTLS {
		opt.TLSConfig = redisTLSConfig(opt.Addr)
	}

	return opt, nil
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
