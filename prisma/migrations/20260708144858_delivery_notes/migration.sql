/*
  Warnings:

  - Added the required column `deliveryNoteId` to the `ConsignmentPlacement` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ConsignmentPlacement" ADD COLUMN     "deliveryNoteId" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "DeliveryNote" (
    "id" SERIAL NOT NULL,
    "dnNumber" TEXT NOT NULL,
    "customerId" INTEGER NOT NULL,
    "locationId" INTEGER NOT NULL,
    "deliveredAt" DATE NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeliveryNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DeliveryNote_dnNumber_key" ON "DeliveryNote"("dnNumber");

-- AddForeignKey
ALTER TABLE "DeliveryNote" ADD CONSTRAINT "DeliveryNote_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryNote" ADD CONSTRAINT "DeliveryNote_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsignmentPlacement" ADD CONSTRAINT "ConsignmentPlacement_deliveryNoteId_fkey" FOREIGN KEY ("deliveryNoteId") REFERENCES "DeliveryNote"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
