import prisma from "./db/prisma.js";
import {
  adSpendSchema,
  emailEventSchema,
  orderSchema,
  refundSchema,
  sourceSchema,
  type Source,
} from "./sources.js";
import { configSchema } from "./config.js";
import configJson from "../config.json" with { type: "json" };
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";

const config = configSchema.parse(configJson);

export async function transformIngestion(ingestionId: string) {
  const ingestion = await prisma.ingestion.findUniqueOrThrow({
    where: { id: ingestionId },
    include: { rows: true },
  });

  const tenantConfig = config[ingestion.tenantId];

  if (!tenantConfig) {
    throw new Error(`Missing config for tenant ${ingestion.tenantId}`);
  }

  const source = sourceSchema.parse(ingestion.sourceId);
  const sourceConfig = tenantConfig[source];

  for (const row of ingestion.rows) {
    try {
      if (
        row.payload === null ||
        typeof row.payload !== "object" ||
        Array.isArray(row.payload)
      ) {
        throw new Error("Raw payload must be an object");
      }
      const payload = row.payload as Record<string, unknown>;

      const data = mapRecord(payload, sourceConfig.mappings);

      applyTransformations(data, sourceConfig.transformations ?? {});

      await upsertCanonical(ingestion.tenantId, source, data);
    } catch (error) {
      throw new Error(
        `Ingestion ${ingestion.id}, raw row ${row.id}: ${error instanceof Error ? error.message : String(error)}`,
        { cause: error },
      );
    }
  }
}

function mapRecord(
  payload: Record<string, unknown>,
  mappings: Record<string, string>,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(mappings)
      .filter(([sourceField]) => payload[sourceField] !== undefined)
      .map(([sourceField, targetField]) => [targetField, payload[sourceField]]),
  );
}

function applyTransformations(
  data: Record<string, unknown>,
  transformations: Record<string, "uppercase" | "lowercase">,
) {
  for (const [field, transformation] of Object.entries(transformations)) {
    const value = data[field];

    if (typeof value !== "string") {
      continue;
    }

    switch (transformation) {
      case "uppercase":
        data[field] = value.toUpperCase();
        break;

      case "lowercase":
        data[field] = value.toLowerCase();
        break;
    }
  }
}

async function upsertCanonical(
  tenantId: string,
  source: Source,
  data: Record<string, unknown>,
) {
  switch (source) {
    case "orders": {
      const order = orderSchema.parse(data);

      await prisma.order.upsert({
        where: {
          tenantId_orderId: {
            tenantId,
            orderId: order.orderId,
          },
        },
        create: {
          tenantId,
          ...order,
        },
        update: order,
      });

      break;
    }

    case "email_events": {
      const event = emailEventSchema.parse(data);

      await prisma.emailEvent.upsert({
        where: {
          tenantId_eventId: {
            tenantId,
            eventId: event.eventId,
          },
        },
        create: {
          tenantId,
          ...event,
        },
        update: event,
      });

      break;
    }

    case "ad_spend": {
      const spend = adSpendSchema.parse(data);

      await prisma.adSpend.upsert({
        where: {
          tenantId_date_campaignId: {
            tenantId,
            date: spend.date,
            campaignId: spend.campaignId,
          },
        },
        create: {
          tenantId,
          ...spend,
        },
        update: spend,
      });

      break;
    }

    case "refunds": {
      const refund = refundSchema.parse(data);

      try {
        await prisma.refund.upsert({
          where: {
            tenantId_refundId: {
              tenantId,
              refundId: refund.refundId,
            },
          },
          create: {
            tenantId,
            ...refund,
          },
          update: refund,
        });
      } catch (error) {
        if (
          error instanceof PrismaClientKnownRequestError &&
          error.code === "P2003"
        ) {
          console.warn(
            `Orphan refund skipped for ${tenantId}: ${refund.refundId} references missing order ${refund.orderId}`,
          );

          break;
        }

        throw error;
      }

      break;
    }
  }
}
