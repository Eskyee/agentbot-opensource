CREATE TABLE "basefm_relay_destinations" (
  "id" SERIAL NOT NULL,
  "key" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "required" BOOLEAN NOT NULL DEFAULT false,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "viewer_url" TEXT,
  "probe_url" TEXT,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "last_healthy_at" TIMESTAMP(3),
  "last_error_at" TIMESTAMP(3),
  "last_error_message" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "basefm_relay_destinations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "basefm_relay_destinations_key_key" ON "basefm_relay_destinations"("key");
CREATE INDEX "idx_basefm_relays_enabled" ON "basefm_relay_destinations"("enabled");
CREATE INDEX "idx_basefm_relays_status" ON "basefm_relay_destinations"("status");
