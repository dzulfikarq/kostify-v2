# Kostify — root Makefile (run from repo root; uses Docker Compose)

.PHONY: up down build logs ps migrate-up migrate-down migrate-version migrate-drop

up:
	docker compose up -d --build

down:
	docker compose down

build:
	docker compose build

logs:
	docker compose logs -f api frontend

ps:
	docker compose ps

migrate-up:
	docker compose exec api /app/migrate up

migrate-down:
	docker compose exec api /app/migrate down

migrate-version:
	docker compose exec api /app/migrate version

migrate-drop:
	docker compose exec api /app/migrate drop
