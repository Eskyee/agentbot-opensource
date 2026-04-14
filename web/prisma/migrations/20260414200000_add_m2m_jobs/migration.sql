-- CreateTable: m2m_jobs — machine-payable job board
CREATE TABLE "m2m_jobs" (
    "id"                  TEXT NOT NULL,
    "title"               TEXT NOT NULL,
    "description"         TEXT NOT NULL,
    "reward_usd"          DOUBLE PRECISION NOT NULL,
    "state"               TEXT NOT NULL DEFAULT 'open',
    "requester_agent_id"  TEXT,
    "claimer_agent_id"    TEXT,
    "delivery_notes"      TEXT,
    "dispute_reason"      TEXT,
    "claimed_at"          TIMESTAMP(3),
    "delivered_at"        TIMESTAMP(3),
    "approved_at"         TIMESTAMP(3),
    "paid_at"             TIMESTAMP(3),
    "created_at"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"          TIMESTAMP(3) NOT NULL,

    CONSTRAINT "m2m_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "m2m_jobs_state_idx" ON "m2m_jobs"("state");
CREATE INDEX "m2m_jobs_requester_agent_id_idx" ON "m2m_jobs"("requester_agent_id");
CREATE INDEX "m2m_jobs_claimer_agent_id_idx" ON "m2m_jobs"("claimer_agent_id");
