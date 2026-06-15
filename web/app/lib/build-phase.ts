export function isStaticBuildPhase() {
  return process.env.NEXT_PHASE === 'phase-production-build'
}
