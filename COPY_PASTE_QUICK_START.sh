#!/bin/bash
# QUICK START: Copy & Paste These Commands

# 1. Navigate to project
cd /tmp/agentbot

# 2. Run all 32 tests (5-8 seconds)
./run-quick-tests.sh

# Expected Output:
# ╔════════════════════════════════════════════════════════════════╗
# ║  ✅ TEST EXECUTION COMPLETE: 32/32 PASSING                     ║
# ╚════════════════════════════════════════════════════════════════╝
#
# 📊 Results:
#    ✅ Provision Endpoint:  14/14 passing
#    ✅ Mux Integration:      9/9 passing
#    ✅ Error Recovery:       9/9 passing
#    ─────────────────────────────────────
#    ✅ TOTAL:               32/32 passing

# OR run individual suites:
npm run test:provision         # 14 tests
npm run test:mux              # 9 tests
npm run test:error-recovery   # 9 tests

# That's it! Everything is working. 🚀
