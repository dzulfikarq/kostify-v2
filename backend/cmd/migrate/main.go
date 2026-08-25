package main

import (
	"fmt"
	"log"
	"os"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	"github.com/golang-migrate/migrate/v4/source/iofs"

	"kostify/backend/internal/config"
	"kostify/backend/migrations"
)

func main() {
	cfg := config.Load()

	src, err := iofs.New(migrations.FS, ".")
	if err != nil {
		log.Fatalf("read embedded migrations: %v", err)
	}

	m, err := migrate.NewWithSourceInstance("iofs", src, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("init migrate: %v", err)
	}
	defer func() { _, _ = m.Close() }()

	if len(os.Args) < 2 {
		usage()
		os.Exit(2)
	}

	switch os.Args[1] {
	case "up":
		if err := m.Up(); err != nil && err.Error() != "no change" {
			log.Fatalf("migrate up: %v", err)
		}
		fmt.Println("migration up: done")
	case "down":
		if err := m.Steps(-1); err != nil && err.Error() != "no change" {
			log.Fatalf("migrate down: %v", err)
		}
		fmt.Println("migration down (1 step): done")
	case "drop":
		if err := m.Drop(); err != nil {
			log.Fatalf("migrate drop: %v", err)
		}
		fmt.Println("schema dropped")
	case "version":
		v, dirty, err := m.Version()
		if err != nil {
			log.Fatalf("version: %v", err)
		}
		fmt.Printf("version=%d dirty=%v\n", v, dirty)
	default:
		usage()
		os.Exit(2)
	}
}

func usage() {
	fmt.Println("usage: migrate up|down|drop|version")
}
