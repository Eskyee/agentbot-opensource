#!/bin/bash
# Run only the unit and integration tests (skip 72-hour load test)

cd "$(dirname "$0")"

echo "🧪 Running quick test suite (32 tests, ~3.5 seconds)"
echo "=============================================="

npm run test:provision && \
npm run test:mux && \
npm run test:error-recovery

echo ""
echo "✅ All quick tests complete!"
echo "=============================================="
