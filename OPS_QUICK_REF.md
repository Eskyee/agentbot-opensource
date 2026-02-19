# OPS Quick Ref (Copy/Paste)

Last updated: 2026-02-19

## 0) Production targets
- Frontend: `https://agentbot.raveculture.xyz`
- Backend: `http://34.71.189.81:3000`
- GCP project: `raveculture-youtube-api`
- VM: `agentbot-api-vm` (`us-central1-a`)

## 1) Fast health checks (local machine)
```bash
curl -sS http://34.71.189.81:3000/health
curl -i -sS -H 'x-api-key: YOUR_SECRET' http://34.71.189.81:3000/instances
curl -i -sS -X POST https://agentbot.raveculture.xyz/api/provision \
  -H 'content-type: application/json' \
  --data '{"userId":"probe-quick","telegramToken":"123:abc","aiProvider":"gemini"}'
```

## 2) Vercel env + deploy
```bash
cd /Users/raveculture/Documents/GitHub/agentbot
npx vercel whoami
npx vercel env ls production

npx vercel env rm BACKEND_API_FALLBACK_URL production --yes || true
printf 'http://34.71.189.81:3000\n' | npx vercel env add BACKEND_API_FALLBACK_URL production

npx vercel env rm BACKEND_API_SECRET production --yes || true
printf 'YOUR_SECRET\n' | npx vercel env add BACKEND_API_SECRET production

npx vercel --prod --yes
```

## 3) GCP network checks (Cloud Shell)
```bash
gcloud auth list
gcloud config set project raveculture-youtube-api

gcloud compute firewall-rules list --filter="name=agentbot-api-3000"
gcloud compute instances add-tags agentbot-api-vm --zone=us-central1-a --tags=agentbot-api

gcloud compute instances describe agentbot-api-vm \
  --zone=us-central1-a \
  --format='get(networkInterfaces[0].accessConfigs[0].natIP,tags.items)'
```

## 4) VM service checks (inside VM)
```bash
gcloud compute ssh agentbot-api-vm --zone=us-central1-a

sudo systemctl status agentbot-api --no-pager -l
sudo journalctl -u agentbot-api -n 200 --no-pager

curl -s http://localhost:3000/health
curl -i -sS -H 'x-api-key: YOUR_SECRET' http://localhost:3000/instances
```

## 5) Restart backend service (inside VM)
```bash
sudo systemctl restart agentbot-api
sudo systemctl status agentbot-api --no-pager -l
```

## 6) Update backend code safely (inside VM)
```bash
cd /opt/agentbot
git pull
cd /opt/agentbot/api
npm install --omit=dev
sudo systemctl restart agentbot-api
curl -s http://localhost:3000/health
```

## 7) Remove probe instances
```bash
curl -i -X DELETE http://34.71.189.81:3000/instances/probe-direct-002 \
  -H 'x-api-key: YOUR_SECRET'

curl -i -X DELETE http://34.71.189.81:3000/instances/7510283b86fe138e \
  -H 'x-api-key: YOUR_SECRET'
```

## 8) Common gotchas
- Run `gcloud` project/firewall commands in Cloud Shell user context, not inside VM.
- `localhost` in Cloud Shell is not the VM.
- `BACKEND_API_SECRET` in Vercel must equal VM `API_SECRET`.
- After Vercel env changes, redeploy.
