import prisma from "./db/prisma.js";
import type { Manifest } from "./manifest.js";

export const ingestRawData = async (
  batch: Manifest["batches"][number],
  sourceHash: string,
  records: object[],
) =>
  prisma.$transaction(async (tx) => {
    const existing = await tx.ingestion.findUnique({
      where: {
        tenantId_sourceId_sourceHash: {
          tenantId: batch.tenant,
          sourceId: batch.source,
          sourceHash,
        },
      },
    });

    if (existing) return existing;

    const ingestion = await tx.ingestion.create({
      data: { tenantId: batch.tenant, sourceId: batch.source, sourceHash },
    });

    await tx.rawData.createMany({
      data: records.map((payload) => ({ payload, ingestionId: ingestion.id })),
    });

    return tx.ingestion.update({
      where: { id: ingestion.id },
      data: { status: "COMPLETED", completedAt: new Date() },
    });
  });
