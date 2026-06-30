import { defineSchedule } from 'eve/schedules'

// Native eve schedule (file-defined cron, runs durably without a backend row).
// Fire-and-forget: the framework runs the agent on this prompt and discards
// the output. Uses the real get_agent_status and query_metrics tools.
export default defineSchedule({
  cron: '0 9 * * 1-5', // 09:00 UTC, Mon–Fri
  markdown:
    'Produce a short operations summary: list agents and their status via get_agent_status, then pull the metrics summary via query_metrics. Flag anything not active or any errors.',
})
