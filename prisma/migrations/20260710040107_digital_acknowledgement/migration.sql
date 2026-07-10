-- Digital acknowledgement (D20): who delivered, who acknowledged, finger
-- signature, and a read-only share token per delivery note; signature on
-- signed-off reconciliations. shareToken backfills existing rows.
ALTER TABLE "DeliveryNote" ADD COLUMN "deliveredBy" TEXT;
ALTER TABLE "DeliveryNote" ADD COLUMN "ackName" TEXT;
ALTER TABLE "DeliveryNote" ADD COLUMN "ackSignature" TEXT;
ALTER TABLE "DeliveryNote" ADD COLUMN "ackAt" TIMESTAMP(3);
ALTER TABLE "DeliveryNote" ADD COLUMN "shareToken" TEXT;
UPDATE "DeliveryNote" SET "shareToken" = gen_random_uuid()::text WHERE "shareToken" IS NULL;
ALTER TABLE "DeliveryNote" ALTER COLUMN "shareToken" SET NOT NULL;
CREATE UNIQUE INDEX "DeliveryNote_shareToken_key" ON "DeliveryNote"("shareToken");

ALTER TABLE "Reconciliation" ADD COLUMN "ackSignature" TEXT;
ALTER TABLE "Reconciliation" ADD COLUMN "ackAt" TIMESTAMP(3);
