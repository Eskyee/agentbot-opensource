-- Index for Stripe webhook hot path. Without it, every
-- invoice.payment_succeeded / invoice.payment_failed / customer.subscription.deleted
-- triggered a sequential scan of "User" to find the row matching
-- `stripeCustomerId`, since only `email`, `vaultId`, and `referralCode` were
-- indexed on the model.
CREATE INDEX IF NOT EXISTS "User_stripeCustomerId_idx" ON "User"("stripeCustomerId");
