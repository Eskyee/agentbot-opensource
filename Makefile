.PHONY: help start stop restart logs build clean test

help: ## Show this help message
	@echo "StartClaw Development Commands"
	@echo "==============================="
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

start: ## Start all services
	@echo "🦞 Starting StartClaw..."
	@docker compose up -d
	@echo "✅ Services started. Visit http://localhost:3000"

stop: ## Stop all services
	@echo "🛑 Stopping StartClaw..."
	@docker compose down

restart: ## Restart all services
	@echo "🔄 Restarting StartClaw..."
	@docker compose restart

logs: ## View logs from all services
	@docker compose logs -f

logs-api: ## View API logs
	@docker compose logs -f api

logs-worker: ## View worker logs
	@docker compose logs -f worker

logs-frontend: ## View frontend logs
	@docker compose logs -f frontend

build: ## Rebuild all services
	@echo "🔨 Building all services..."
	@docker compose build

rebuild: ## Rebuild and restart all services
	@echo "🔨 Rebuilding and restarting..."
	@docker compose up -d --build

clean: ## Stop and remove all containers, volumes, and networks
	@echo "🧹 Cleaning up..."
	@docker compose down -v
	@echo "✅ Cleaned up"

test: ## Run tests
	@echo "🧪 Running tests..."
	@cd agentbot-backend && npm test
	@cd agentbot-worker && npm test

ps: ## Show running containers
	@docker compose ps

shell-api: ## Open shell in API container
	@docker compose exec api sh

shell-worker: ## Open shell in worker container
	@docker compose exec worker sh

shell-frontend: ## Open shell in frontend container
	@docker compose exec frontend sh

db-shell: ## Open PostgreSQL shell
	@docker compose exec postgres psql -U startclaw -d startclaw_db

redis-cli: ## Open Redis CLI
	@docker compose exec redis redis-cli

update-openclaw: ## Safely update one OpenClaw instance (usage: make update-openclaw ID=<instance_id>)
	@if [ -z "$(ID)" ]; then echo "Usage: make update-openclaw ID=<instance_id>"; exit 1; fi
	@./infra/scripts/update-openclaw.sh $(ID)

update-openclaw-all: ## Safely update all running OpenClaw instances
	@./infra/scripts/update-openclaw.sh --all

prod-go-live-check: ## Run production DNS/health/route/Stripe checks
	@./infra/scripts/prod-go-live-check.sh

prod-go-live-report: ## Run production checks and save timestamped report
	@./infra/scripts/prod-go-live-report.sh

health: ## Check health of all services
	@echo "🔍 Checking service health..."
	@curl -s http://localhost:3001/health | jq . || echo "API not responding"
	@curl -s http://localhost:3000 > /dev/null && echo "✅ Frontend is healthy" || echo "⚠️  Frontend not responding"

init: ## Initialize environment (first time setup)
	@echo "🎬 Initializing StartClaw..."
	@cp -n .env.local .env 2>/dev/null || echo ".env already exists"
	@docker compose up -d
	@echo "✅ StartClaw initialized. Visit http://localhost:3000"
