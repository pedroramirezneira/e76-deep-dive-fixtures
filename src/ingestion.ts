import prisma from "./db/prisma.js";
import type { Manifest } from "./manifest.js";

export const createIngestion = async (
  batch: Manifest["batches"][number],
  hash: string,
) =>
  await prisma.ingestion.create({
    data: {
      tenantId: batch.tenant,
      sourceId: batch.source,
      sourceHash: hash,
    },
  });

export const ingestRawData = async (ingestionId: string, records: object[]) =>
  await prisma.$transaction(async (tx) => {
    await tx.rawData.createMany({
      data: records.map((record) => ({
        payload: record,
        ingestionId,
      })),
    });

    await tx.ingestion.update({
      where: {
        id: ingestionId,
      },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
      },
    });
  });

export const getIngestion = async (
  tenantId: string,
  sourceId: string,
  sourceHash: string,
) =>
  await prisma.ingestion.findUniqueOrThrow({
    where: {
      tenantId_sourceId_sourceHash: {
        tenantId,
        sourceId,
        sourceHash,
      },
    },
  });
