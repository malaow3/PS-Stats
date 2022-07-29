package config

import (
	"os"

	"github.com/malaow3/trunk"
	log "github.com/sirupsen/logrus"
	"gopkg.in/yaml.v2"
)

type Config struct {
	Username        string `yaml:"username"`
	Password        string `yaml:"password"`
	PSStatsUsername string `yaml:"ps_stats_username"`
	PSStatsPassword string `yaml:"ps_stats_password"`
	Avatar          string `yaml:"avatar"`
	DBPass          string `yaml:"db_pass"`
	DBPath          string `yaml:"db_path"`
}

func ParseConfig() *Config {
	// if the config.yml file is present, use it.
	// otherwise, populate the config object from environment variables.
	// if neither is present, exit.

	// check if the config.yml file is present.
	config := &Config{}
	if _, err := os.Stat("config.yml"); err == nil {
		log.Info("Found config.yml file. Using it.")
		config_data, err := os.ReadFile("config.yml")
		trunk.CheckErr(err)
		err = yaml.Unmarshal(config_data, config)
		trunk.CheckErr(err)
	} else {
		log.Info("No config.yml file found. Using environment variables.")
		config.Username = os.Getenv("USERNAME")
		config.Password = os.Getenv("PASSWORD")

		if config.Username == "" || config.Password == "" {
			log.Fatal("No username or password provided. Please set the following secrets:\nusername=<your pokemon showdown username>\npassword:<your PS account password>.")
		}
	}
	return config
}
