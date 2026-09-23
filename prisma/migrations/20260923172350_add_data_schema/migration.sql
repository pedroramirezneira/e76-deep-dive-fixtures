-- CreateEnum
CREATE TYPE "IngestionStatus" AS ENUM ('PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "EmailEventType" AS ENUM ('OPEN', 'CLICK', 'DELIVERED', 'UNSUBSCRIBE');

-- CreateTable
CREATE TABLE "Ingestion" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "sourceHash" TEXT NOT NULL,
    "status" "IngestionStatus" NOT NULL DEFAULT 'PROCESSING',
    "error" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMPTZ(3),

    CONSTRAINT "Ingestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RawData" (
    "id" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "ingestionId" TEXT NOT NULL,

    CONSTRAINT "RawData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "orderCreatedAt" TIMESTAMPTZ(3) NOT NULL,
    "channel" TEXT NOT NULL,
    "gross" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailEvent" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "type" "EmailEventType" NOT NULL,
    "email" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "occurredAt" TIMESTAMPTZ(3) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdSpend" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "campaignId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "spend" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdSpend_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Refund" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "refundId" TEXT NOT NULL,
    "refundedAt" TIMESTAMPTZ(3) NOT NULL,
    "orderId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Refund_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Ingestion_tenantId_sourceId_idx" ON "Ingestion"("tenantId", "sourceId");

-- CreateIndex
CREATE UNIQUE INDEX "Ingestion_tenantId_sourceId_sourceHash_key" ON "Ingestion"("tenantId", "sourceId", "sourceHash");

-- CreateIndex
CREATE INDEX "RawData_ingestionId_idx" ON "RawData"("ingestionId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_tenantId_orderId_key" ON "Order"("tenantId", "orderId");

-- CreateIndex
CREATE INDEX "EmailEvent_tenantId_occurredAt_idx" ON "EmailEvent"("tenantId", "occurredAt");

-- CreateIndex
CREATE UNIQUE INDEX "EmailEvent_tenantId_eventId_key" ON "EmailEvent"("tenantId", "eventId");

-- CreateIndex
CREATE UNIQUE INDEX "AdSpend_tenantId_date_campaignId_key" ON "AdSpend"("tenantId", "date", "campaignId");

-- CreateIndex
CREATE UNIQUE INDEX "Refund_tenantId_refundId_key" ON "Refund"("tenantId", "refundId");

-- AddForeignKey
ALTER TABLE "RawData" ADD CONSTRAINT "RawData_ingestionId_fkey" FOREIGN KEY ("ingestionId") REFERENCES "Ingestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_tenantId_orderId_fkey" FOREIGN KEY ("tenantId", "orderId") REFERENCES "Order"("tenantId", "orderId") ON DELETE RESTRICT ON UPDATE CASCADE;
