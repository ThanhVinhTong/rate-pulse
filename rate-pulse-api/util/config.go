package util

import (
	"path/filepath"
	"time"

	"github.com/spf13/viper"
)

// Config represents the configuration for the application
type Config struct {
	DBDriver               string        `mapstructure:"DB_DRIVER"`
	DBSource               string        `mapstructure:"DB_SOURCE"`
	HTTPServerAddress      string        `mapstructure:"HTTP_SERVER_ADDRESS"`
	GRPCServerAddress      string        `mapstructure:"GRPC_SERVER_ADDRESS"`
	RedisAddress           string        `mapstructure:"REDIS_ADDRESS"`
	RedisUsername          string        `mapstructure:"REDIS_USERNAME"`
	RedisPassword          string        `mapstructure:"REDIS_PASSWORD"`
	RedisTLS               bool          `mapstructure:"REDIS_TLS"`
	TokenSymmetricKey      string        `mapstructure:"TOKEN_SYMMETRIC_KEY"`
	AccessTokenDuration    time.Duration `mapstructure:"ACCESS_TOKEN_DURATION"`
	RefreshTokenDuration   time.Duration `mapstructure:"REFRESH_TOKEN_DURATION"`
	EmailSenderName        string        `mapstructure:"EMAIL_SENDER_NAME"`
	EmailSenderAddress     string        `mapstructure:"EMAIL_SENDER_ADDRESS"`
	EmailSMTPHost          string        `mapstructure:"EMAIL_SMTP_HOST"`
	EmailSMTPPort          int           `mapstructure:"EMAIL_SMTP_PORT"`
	EmailSMTPUsername      string        `mapstructure:"EMAIL_SMTP_USERNAME"`
	EmailSMTPPassword      string        `mapstructure:"EMAIL_SMTP_PASSWORD"`
	FrontendVerifyEmailURL string        `mapstructure:"FRONTEND_VERIFY_EMAIL_URL"`
	RateLimitPerMinute     int           `mapstructure:"RATE_LIMIT_PER_MINUTE"`
	EnableHTTPServer       bool          `mapstructure:"ENABLE_HTTP_SERVER"`
	EnableGRPCServer       bool          `mapstructure:"ENABLE_GRPC_SERVER"`
	EnableTaskProcessor    bool          `mapstructure:"ENABLE_TASK_PROCESSOR"`
}

// LoadConfig loads the configuration from the environment variables
func LoadConfig(path string) (config Config, err error) {
	viper.AddConfigPath(path)
	viper.AddConfigPath(filepath.Join(path, ".."))
	viper.SetConfigName("app")
	viper.SetConfigType("env")

	viper.AutomaticEnv()
	viper.BindEnv("DB_DRIVER")
	viper.BindEnv("DB_SOURCE")
	viper.BindEnv("HTTP_SERVER_ADDRESS")
	viper.BindEnv("GRPC_SERVER_ADDRESS")
	viper.BindEnv("REDIS_ADDRESS")
	viper.BindEnv("REDIS_USERNAME")
	viper.BindEnv("REDIS_PASSWORD")
	viper.BindEnv("REDIS_TLS")
	viper.BindEnv("TOKEN_SYMMETRIC_KEY")
	viper.BindEnv("ACCESS_TOKEN_DURATION")
	viper.BindEnv("REFRESH_TOKEN_DURATION")
	viper.BindEnv("EMAIL_SENDER_NAME")
	viper.BindEnv("EMAIL_SENDER_ADDRESS")
	viper.BindEnv("EMAIL_SMTP_HOST")
	viper.BindEnv("EMAIL_SMTP_PORT")
	viper.BindEnv("EMAIL_SMTP_USERNAME")
	viper.BindEnv("EMAIL_SMTP_PASSWORD")
	viper.BindEnv("FRONTEND_VERIFY_EMAIL_URL")
	viper.BindEnv("RATE_LIMIT_PER_MINUTE")
	viper.BindEnv("ENABLE_HTTP_SERVER")
	viper.BindEnv("ENABLE_GRPC_SERVER")
	viper.BindEnv("ENABLE_TASK_PROCESSOR")

	err = viper.ReadInConfig()
	if err != nil {
		// Check if the error is because the config file was not found
		if _, ok := err.(viper.ConfigFileNotFoundError); !ok {
			// It's a real error (like a syntax error in the file), so return it
			return config, err
		}
		// If it's just a missing file, we ignore it and continue
		// because AutomaticEnv() will catch the Kubernetes Secrets
	}

	err = viper.Unmarshal(&config)
	if err != nil {
		return config, err
	}

	setDefaultRuntimeFlags(&config)
	return
}

func setDefaultRuntimeFlags(config *Config) {
	if !viper.IsSet("ENABLE_HTTP_SERVER") {
		config.EnableHTTPServer = true
	}
	if !viper.IsSet("ENABLE_GRPC_SERVER") {
		config.EnableGRPCServer = true
	}
	if !viper.IsSet("ENABLE_TASK_PROCESSOR") {
		config.EnableTaskProcessor = true
	}
}
