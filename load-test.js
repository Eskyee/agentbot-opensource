import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter, Gauge } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const duration = new Trend('duration');
const provisioned = new Counter('provisioned_streams');
const activeStreams = new Gauge('active_streams');

// Load test configuration
export const options = {
  stages: [
    { duration: '30s', target: 1 },   // 1 agent
    { duration: '30s', target: 2 },   // 2 agents
    { duration: '30s', target: 3 },   // 3 agents
    { duration: '30s', target: 4 },   // 4 agents
    { duration: '60s', target: 5 },   // 5 agents (steady state for 1 min)
    { duration: '30s', target: 0 },   // ramp down
  ],
  thresholds: {
    'http_req_duration': ['p(95)<500', 'p(99)<1000'],
    'http_req_failed': ['rate<0.1'],
    'errors': ['rate<0.05'],
  },
};

const API_URL = __ENV.API_URL || 'http://localhost:3001';
const MUX_TOKEN_ID = __ENV.MUX_TOKEN_ID;
const MUX_TOKEN_SECRET = __ENV.MUX_TOKEN_SECRET;

export default function () {
  const agent_id = `agent-${__VU}-${Date.now()}`;
  const timestamp = Date.now();

  // Test 1: Health check
  group('Health Check', () => {
    const res = http.get(`${API_URL}/health`);
    check(res, {
      'status is 200': (r) => r.status === 200,
      'response time < 100ms': (r) => r.timings.duration < 100,
    }) || errorRate.add(1);
    duration.add(res.timings.duration, { endpoint: 'health' });
  });

  // Test 2: Provision stream
  group('Provision Stream', () => {
    const payload = JSON.stringify({
      agent_id,
      stream_name: `basefm-${agent_id}`,
      mux_token_id: MUX_TOKEN_ID,
      mux_token_secret: MUX_TOKEN_SECRET,
    });

    const res = http.post(`${API_URL}/api/provision`, payload, {
      headers: { 'Content-Type': 'application/json' },
    });

    const success = check(res, {
      'provision status is 200-201': (r) => r.status === 200 || r.status === 201,
      'response time < 500ms': (r) => r.timings.duration < 500,
      'has stream_id': (r) => r.json('stream_id') !== undefined,
    });

    if (success) {
      provisioned.add(1);
      activeStreams.add(1);
    } else {
      errorRate.add(1);
    }
    duration.add(res.timings.duration, { endpoint: 'provision' });
  });

  // Test 3: List streams
  group('List Streams', () => {
    const res = http.get(`${API_URL}/api/basefm/streams`);
    check(res, {
      'status is 200': (r) => r.status === 200,
      'returns array': (r) => Array.isArray(r.json()),
      'response time < 200ms': (r) => r.timings.duration < 200,
    }) || errorRate.add(1);
    duration.add(res.timings.duration, { endpoint: 'list_streams' });
  });

  // Test 4: Get live streams
  group('Get Live Streams', () => {
    const res = http.get(`${API_URL}/api/basefm/live`);
    check(res, {
      'status is 200': (r) => r.status === 200,
      'response time < 200ms': (r) => r.timings.duration < 200,
    }) || errorRate.add(1);
    duration.add(res.timings.duration, { endpoint: 'live' });
  });

  // Test 5: API models
  group('API Models', () => {
    const res = http.get(`${API_URL}/api/ai/models`);
    check(res, {
      'status is 200': (r) => r.status === 200,
      'has models': (r) => r.json('models') !== undefined,
    }) || errorRate.add(1);
    duration.add(res.timings.duration, { endpoint: 'models' });
  });

  // Test 6: Health check on AI endpoint
  group('AI Health', () => {
    const res = http.get(`${API_URL}/api/ai/health`);
    check(res, {
      'status is 200': (r) => r.status === 200,
    }) || errorRate.add(1);
    duration.add(res.timings.duration, { endpoint: 'ai_health' });
  });

  sleep(1);
}
