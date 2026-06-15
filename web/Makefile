.PHONY: up down restart logs health test load-test status dashboard

up:
	@echo "🦞 Starting Agentbot..."
	docker compose up -d
	@echo "⏳ Waiting for services..."
	@sleep 5
	@echo ""
	@echo "✅ Stack is live:"
	@echo "   Web:     http://localhost:3000"
	@echo "   API:     http://localhost:3001/health"
	@echo "   Postgres: localhost:5432"
	@echo "   Redis:    localhost:6379"

down:
	docker compose down

restart:
	docker compose down && docker compose up -d

logs:
	docker compose logs -f --tail=50

health:
	@echo "🔍 Health Check..."
	@curl -s http://localhost:3001/health | python3 -m json.tool 2>/dev/null || echo "❌ Backend down"
	@curl -s http://localhost:3000 > /dev/null && echo "✅ Web: OK" || echo "❌ Web: down"

status:
	@docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep agentbot

test:
	@echo "🧪 Running load test..."
	autocannon -c 10 -d 5 http://localhost:3001/health

load-test:
	@echo "🔥 Stress test (50 concurrent, 10s)..."
	autocannon -c 50 -d 10 http://localhost:3001/health

dashboard:
	@echo "🦞 Opening Control Panel..."
	@open dashboard/index.html 2>/dev/null || xdg-open dashboard/index.html 2>/dev/null || echo "Open: dashboard/index.html"
