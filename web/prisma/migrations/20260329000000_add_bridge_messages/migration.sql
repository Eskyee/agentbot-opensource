-- CreateTable
CREATE TABLE "bridge_messages" (
    "id" TEXT NOT NULL,
    "sender" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'general',
    "content" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "read_by" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bridge_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_bridge_channel" ON "bridge_messages"("channel");

-- CreateIndex
CREATE INDEX "idx_bridge_sender" ON "bridge_messages"("sender");

-- CreateIndex
CREATE INDEX "idx_bridge_created" ON "bridge_messages"("created_at");
