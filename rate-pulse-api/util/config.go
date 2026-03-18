package util

import (
	"time"

	"github.com/spf13/viper"
)

// Config represents the configuration for the application
type Config struct {
	DBDriver            string        `mapstructure:"DB_DRIVER"`
	DBSource            string        `mapstructure:"DB_SOURCE"`
	ServerAddress       string        `mapstructure:"SERVER_ADDRESS"`
	TokenSymmetricKey   string        `mapstructure:"TOKEN_SYMMETRIC_KEY"`
	AccessTokenDuration time.Duration `mapstructure:"ACCESS_TOKEN_DURATION"`
}

// LoadConfig loads the configuration from the environment variables
func LoadConfig(path string) (config Config, err error) {
	viper.AddConfigPath(path)
	viper.SetConfigName("app")
	viper.SetConfigType("env")

	viper.AutomaticEnv()
	viper.BindEnv("DB_DRIVER")
	viper.BindEnv("DB_SOURCE")
	viper.BindEnv("SERVER_ADDRESS")
	viper.BindEnv("TOKEN_SYMMETRIC_KEY")
	viper.BindEnv("ACCESS_TOKEN_DURATION")

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
	return
}
