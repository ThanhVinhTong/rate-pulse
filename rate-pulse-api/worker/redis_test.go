package worker

import (
	"testing"

	"github.com/ThanhVinhTong/rate-pulse/util"
	"github.com/stretchr/testify/require"
)

func TestNewRedisClientOptFromFields(t *testing.T) {
	opt, err := NewRedisClientOpt(util.Config{
		RedisAddress:  "localhost:6379",
		RedisUsername: "default",
		RedisPassword: "secret",
	})

	require.NoError(t, err)
	require.Equal(t, "localhost:6379", opt.Addr)
	require.Equal(t, "default", opt.Username)
	require.Equal(t, "secret", opt.Password)
	require.Nil(t, opt.TLSConfig)
}

func TestNewRedisClientOptFromFieldsWithTLS(t *testing.T) {
	opt, err := NewRedisClientOpt(util.Config{
		RedisAddress: "example.upstash.io:6379",
		RedisTLS:     true,
	})

	require.NoError(t, err)
	require.NotNil(t, opt.TLSConfig)
	require.Equal(t, "example.upstash.io", opt.TLSConfig.ServerName)
}

func TestNewRedisClientOptRequiresAddress(t *testing.T) {
	opt, err := NewRedisClientOpt(util.Config{})

	require.Error(t, err)
	require.Empty(t, opt)
}
