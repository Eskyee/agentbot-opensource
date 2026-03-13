# 🍎 MacBook/Mac Mini - Complete Flawless Workflow

**Everything you need to work locally, test, and deploy to production**

---

## 📋 Prerequisites (One-Time Setup)

### 1. Install Docker Desktop for Mac
```bash
# Download and install from:
# https://www.docker.com/products/docker-desktop

# OR use Homebrew:
brew install --cask docker

# Verify installation
docker --version
docker-compose --version
```

### 2. Install VS Code
```bash
# From: https://code.visualstudio.com
# OR:
brew install --cask visual-studio-code
```

### 3. Clone Repository
```bash
git clone https://github.com/Eskyee/agentbot.git
cd agentbot
```

### 4. Verify Git Config
```bash
git config --global user.name "Your Name"
git config --global user.email "your@email.com"
git config --list  # Verify it's set
```

---

## 🚀 Complete Daily Workflow

### **MORNING: Start Everything**

```bash
# 1. Navigate to project
cd ~/path/to/agentbot

# 2. Make sure Docker is running
# (Should see Docker icon in menu bar)

# 3. Create .env file from template (first time only)
cp .env.example .env

# 4. Start all services
docker-compose up -d

# 5. Verify everything is running
docker-compose ps

# You should see:
# NAME                COMMAND             STATUS
# agentbot-postgres   postgres            Up (healthy)
# agentbot-redis      redis-server        Up (healthy)
# agentbot-ollama     ollama              Up
# agentbot-api        npm run dev         Up
# agentbot-worker     npm run dev         Up
# agentbot-frontend   npm run dev         Up

# 6. Open VS Code workspace
code agentbot.code-workspace

# 7. Install recommended extensions when prompted
# Click "Install All"
```

### **DURING WORK: Edit Code**

```
1. Edit files in VS Code
2. Save (Cmd+S) - Auto-formats with Prettier
3. Watch for Docker rebuild in terminal
4. Refresh browser (Cmd+R) to see changes
5. Set breakpoints if debugging needed
   - Click line number in VS Code
   - Press F5 to start debugger
```

### **TESTING: Verify Everything Works**

```bash
# In VS Code terminal or Mac terminal:

# Test API health
curl http://localhost:3001/health | jq .

# Test MCP endpoint
curl http://localhost:3001/api/render-mcp/health | jq .

# Test AI models
curl http://localhost:3001/api/ai/models | jq '.count'

# View logs in real-time
docker-compose logs -f api

# Test specific service
docker-compose logs -f postgres  # or redis, ollama, worker
```

### **BEFORE COMMITTING: Final Checks**

```bash
# 1. Check for errors in logs
docker-compose logs api | grep -i "error"

# 2. Run backend tests
docker-compose exec api npm test

# 3. Build to catch TypeScript errors
docker-compose exec api npm run build

# 4. Check Git status
git status

# 5. Review changes
git diff

# Expected: No errors, clean diff, ready to commit
```

### **COMMIT & PUSH: Deploy to Production**

```bash
# 1. Stage all changes
git add .

# 2. Commit with clear message
git commit -m "feat: Add new feature description"

# 3. Push to GitHub (Render auto-deploys)
git push origin main

# 4. Monitor Render deployment
# Open: https://dashboard.render.com
# Watch for: Status changes from "Deploying" → "Live"

# 5. Verify production
curl https://agentbot-api.onrender.com/health
curl https://agentbot-api.onrender.com/api/render-mcp/health

# 6. If anything fails
# Check logs: https://dashboard.render.com/agentbot-api → Logs tab
```

### **EVENING: Stop Services**

```bash
# Stop but keep data
docker-compose down

# OR stop and clean everything (reset)
docker-compose down -v

# Verify stopped
docker-compose ps
# (Should show "No containers")
```

---

## 📍 Local Service URLs

| Service | URL | Status Check |
|---------|-----|--------------|
| **Frontend** | http://localhost:3000 | Browser: App loads |
| **API** | http://localhost:3001 | `curl localhost:3001/health` |
| **MCP Gateway** | http://localhost:3001/api/render-mcp/info | Browser: JSON returned |
| **Database** | localhost:5432 | VS Code PostgreSQL extension |
| **Redis** | localhost:6379 | VS Code Redis extension |
| **Ollama** | http://localhost:11434 | `curl localhost:11434/api/tags` |

---

## 🎯 Common Scenarios

### **Scenario 1: Code Changes Not Showing**

```bash
# 1. Check if Docker is still running
docker-compose ps

# 2. If not running, restart
docker-compose up -d

# 3. Check if hot-reload picked up changes
docker-compose logs api | tail -20

# 4. If still stuck, hard restart
docker-compose down
docker-compose up -d

# 5. Clear browser cache
Cmd+Shift+Delete in Chrome
or Cmd+Option+E in Safari
```

### **Scenario 2: Port Already in Use**

```bash
# Find what's using port 3001
lsof -i :3001

# Kill the process
kill -9 <PID>

# Or restart Docker services
docker-compose restart api

# Verify port is free
lsof -i :3001  # Should return nothing
```

### **Scenario 3: Database Connection Error**

```bash
# Check if postgres is healthy
docker-compose ps postgres

# View postgres logs
docker-compose logs postgres

# Restart database
docker-compose restart postgres

# Verify connection
docker-compose exec postgres psql -U agentbot -d agentbot_db -c "SELECT 1"
```

### **Scenario 4: Need Fresh Start**

```bash
# Stop everything and remove all data
docker-compose down -v

# Rebuild images
docker-compose build --no-cache

# Start fresh
docker-compose up -d

# Wait 2-3 minutes for services to be healthy
docker-compose ps
```

### **Scenario 5: Want to See Real-Time Logs**

```bash
# Stream all service logs
docker-compose logs -f

# Stream specific service
docker-compose logs -f api
docker-compose logs -f postgres
docker-compose logs -f redis

# Show last 50 lines and follow
docker-compose logs -f --tail=50 api

# Exit: Ctrl+C
```

---

## 🔧 VS Code Tips for Mac

### **Keyboard Shortcuts**

| Action | Mac Shortcut |
|--------|--------------|
| Command Palette | Cmd+Shift+P |
| Quick Fix | Cmd+. |
| Format Code | Shift+Option+F |
| Toggle Terminal | Ctrl+` |
| Go to File | Cmd+P |
| Search in Files | Cmd+Shift+F |
| Git Commit | Ctrl+Shift+G |
| Run Task | Cmd+Shift+B |
| Debug | F5 |
| Set Breakpoint | Click line number |

### **Debugging Workflow**

```
1. Click Debug icon in left sidebar (or Cmd+Shift+D)
2. Click "Backend - Debug npm start"
3. Click green play button or press F5
4. Server starts in debug mode
5. Click line number to set breakpoint
6. Refresh browser or trigger endpoint
7. Code pauses at breakpoint
8. Inspect variables in Debug panel
9. Press F5 to continue, F10 to step over, F11 to step into
10. Close debug session with Shift+F5
```

### **Running Tasks**

```bash
# Press Cmd+Shift+B to open Tasks menu
# Select from:
- Docker: Up (Full Stack)       # Start all services
- Docker: Down                  # Stop all services
- Docker: Logs (API)            # Stream API logs
- Backend: Build                # npm run build
- Backend: Test                 # npm run test
- Verify Endpoints              # Run test script
```

---

## 📝 Git Workflow (Mac Quick Guide)

### **Basic Workflow**

```bash
# 1. Check what changed
git status

# 2. View detailed changes
git diff

# 3. Stage specific files
git add src/index.ts
git add agentbot-backend/

# 4. Stage everything
git add .

# 5. Commit with message
git commit -m "feat: Add new feature"

# 6. Push to GitHub (Render auto-deploys)
git push origin main

# 7. Check git log
git log --oneline -5
```

### **Undo Changes**

```bash
# Discard changes in working directory
git checkout -- src/index.ts

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Undo last commit (discard changes)
git reset --hard HEAD~1

# See what was undone
git reflog
```

---

## 🎓 Complete Example: Adding a Feature

### **Step 1: Create Feature Branch (Optional)**
```bash
git checkout -b feature/add-new-endpoint
```

### **Step 2: Make Changes**
```
1. Open VS Code: code agentbot.code-workspace
2. Navigate to agentbot-backend/src/routes/
3. Edit render-mcp.ts
4. Add new endpoint
5. Save file (Cmd+S)
6. Docker rebuilds automatically
7. Test in browser: http://localhost:3001/api/render-mcp/new-endpoint
```

### **Step 3: Test Everything**
```bash
# 1. Run tests
docker-compose exec api npm test

# 2. Check build
docker-compose exec api npm run build

# 3. Verify logs
docker-compose logs -f api | grep -i error
```

### **Step 4: Commit**
```bash
# 1. Review changes
git diff

# 2. Stage all
git add .

# 3. Commit
git commit -m "feat: Add new MCP endpoint for getting user data

- Added GET /api/render-mcp/user-data endpoint
- Validates API key before responding
- Returns JSON with user information
- Tested locally, all tests passing"

# 4. Push
git push origin main
```

### **Step 5: Monitor Render**
```
1. Open https://dashboard.render.com
2. Click agentbot-api service
3. Watch for deployment (takes 3-5 minutes)
4. When status = "Live", test production:
   curl https://agentbot-api.onrender.com/api/render-mcp/user-data
```

---

## 🐛 Troubleshooting Guide (Mac-Specific)

### **Problem: Docker Desktop Not Starting**

```bash
# 1. Check if running
ps aux | grep docker

# 2. If not running, launch manually
open /Applications/Docker.app

# 3. Wait 30 seconds for Docker daemon
sleep 30

# 4. Verify it's running
docker ps
```

### **Problem: Cannot Connect to Docker Socket**

```bash
# Restart Docker daemon
killall Docker
sleep 2
open /Applications/Docker.app

# OR restart computer (safest)
sudo shutdown -r now
```

### **Problem: "Permission denied" Error**

```bash
# Add user to docker group (one-time setup)
sudo dseditgroup -o edit -a $USER -t user docker

# Restart Docker
killall Docker
open /Applications/Docker.app

# Verify
docker ps
```

### **Problem: Disk Space Full**

```bash
# Check Docker disk usage
docker system df

# Clean up unused containers, images, volumes
docker system prune -a --volumes

# Or just dangling images
docker image prune -a
```

### **Problem: Cannot Reach localhost:3001**

```bash
# 1. Verify services running
docker-compose ps

# 2. Check if API is healthy
docker-compose logs api | tail -20

# 3. Check port
lsof -i :3001

# 4. If not listening, restart
docker-compose restart api

# 5. Verify again
curl http://localhost:3001/health
```

---

## 📊 Quick Reference: Essential Commands

```bash
# Docker
docker-compose up -d              # Start all services
docker-compose down               # Stop all services
docker-compose ps                 # Show status
docker-compose logs -f            # Stream logs
docker-compose logs -f api        # Stream API logs only
docker-compose restart api        # Restart one service
docker-compose exec api npm test  # Run command in container

# Git
git status                        # Show changes
git add .                         # Stage all
git commit -m "message"           # Commit
git push origin main              # Push & deploy
git log --oneline -5              # Show recent commits

# Verification
curl http://localhost:3001/health # Test API
curl http://localhost:3001/api/render-mcp/health  # Test MCP
curl http://localhost:3001/api/ai/models          # Test AI

# Browser
http://localhost:3000             # Frontend
http://localhost:3001/api/render-mcp/info         # API Info
https://agentbot-api.onrender.com/health           # Production
```

---

## ✅ Pre-Commit Checklist

Before pushing to GitHub:

```bash
# 1. Code quality
[ ] No TypeScript errors: docker-compose exec api npm run build
[ ] Tests passing: docker-compose exec api npm test
[ ] No console errors: docker-compose logs api | grep -i error

# 2. Git clean
[ ] git status (working directory clean)
[ ] git diff (review all changes)

# 3. Functionality
[ ] Tested locally: curl http://localhost:3001/health
[ ] Browser works: http://localhost:3000
[ ] No regressions: all previous features still work

# 4. Ready to push
[ ] git add .
[ ] git commit -m "clear message"
[ ] git push origin main
```

---

## 🎯 Daily Routine (Copy & Paste)

### **Morning:**
```bash
cd agentbot
docker-compose up -d
docker-compose ps  # Wait for all healthy
code agentbot.code-workspace
```

### **Throughout Day:**
- Edit code → Save → Refresh browser
- Test: `curl http://localhost:3001/health`
- Debug: Set breakpoints, press F5

### **Before Leaving:**
```bash
# Review changes
git status
git diff

# Commit if done
git add .
git commit -m "feat: description"
git push origin main

# Monitor Render
open https://dashboard.render.com

# Stop services
docker-compose down
```

---

## 🚀 Your Flawless Mac Mini Workflow

**IN ONE SCRIPT:**

```bash
#!/bin/bash

# Save as: ~/start-agentbot.sh
# Run: bash ~/start-agentbot.sh

cd ~/path/to/agentbot

echo "🍎 Starting AgentBot on Mac Mini..."
echo ""

# Start Docker services
echo "📦 Starting Docker services..."
docker-compose up -d

# Wait for services
echo "⏳ Waiting for services to be healthy..."
sleep 3

# Check status
echo ""
echo "✅ Service Status:"
docker-compose ps

# Open VS Code
echo ""
echo "📝 Opening VS Code..."
code agentbot.code-workspace

# Test endpoints
echo ""
echo "🧪 Testing endpoints..."
sleep 2
curl http://localhost:3001/health | jq .
echo ""
curl http://localhost:3001/api/render-mcp/health | jq .

echo ""
echo "✨ Ready to code!"
echo "Frontend: http://localhost:3000"
echo "API: http://localhost:3001"
echo ""
echo "When done: docker-compose down"
```

---

## ⚡ Make It Even Faster: Aliases

Add to `~/.zshrc` (or `~/.bash_profile`):

```bash
# AGentBot aliases
alias astart='cd ~/path/to/agentbot && docker-compose up -d'
alias astop='cd ~/path/to/agentbot && docker-compose down'
alias alogs='cd ~/path/to/agentbot && docker-compose logs -f api'
alias acode='cd ~/path/to/agentbot && code agentbot.code-workspace'
alias atest='cd ~/path/to/agentbot && docker-compose exec api npm test'
alias abuild='cd ~/path/to/agentbot && docker-compose exec api npm run build'
alias ahealth='curl http://localhost:3001/health | jq .'
```

Then just use:
```bash
astart    # Start everything
acode     # Open VS Code
alogs     # View logs
astop     # Stop everything
atest     # Run tests
```

---

## 🎓 You're Ready!

Your complete Mac Mini development workflow is now:

1. **Morning:** `astart && acode`
2. **Work:** Edit code → save → refresh browser
3. **Test:** `atest` (or curl commands)
4. **Deploy:** `git add . && git commit -m "..." && git push`
5. **Evening:** `astop`

That's it. Flawless. Repeatable. Production-ready.

Now go build something amazing! 🚀

