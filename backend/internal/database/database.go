package database

import (
	"fmt"
	"log"
	"time"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	gormlogger "gorm.io/gorm/logger"
)

type DB struct {
	GORM *gorm.DB
	SQL  interface{ Ping() error }
}

func Connect(dsn string) (*DB, error) {
	var gdb *gorm.DB
	var err error
	for attempt := 1; attempt <= 10; attempt++ {
		// PreferSimpleProtocol: skip server-side prepared statements so
		// schema changes (migrations/ALTER TABLE) never break the cached
		// plan pool ("cached plan must not change result type").
		gdb, err = gorm.Open(postgres.New(postgres.Config{
			DSN:                  dsn,
			PreferSimpleProtocol: true,
		}), &gorm.Config{
			Logger:          gormlogger.Default.LogMode(gormlogger.Warn),
			TranslateError: true,
		})
		if err == nil {
			break
		}
		log.Printf("database connect attempt %d/10 failed: %v", attempt, err)
		time.Sleep(2 * time.Second)
	}
	if err != nil {
		return nil, fmt.Errorf("could not connect to database: %w", err)
	}

	sqlDB, err := gdb.DB()
	if err != nil {
		return nil, err
	}
	sqlDB.SetMaxOpenConns(25)
	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetConnMaxLifetime(30 * time.Minute)

	return &DB{GORM: gdb, SQL: sqlDB}, nil
}

func (d *DB) Ping() error {
	return d.SQL.Ping()
}

func (d *DB) Close() error {
	sqlDB, err := d.GORM.DB()
	if err != nil {
		return err
	}
	return sqlDB.Close()
}
