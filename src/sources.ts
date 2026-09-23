import z from "zod";
import { EmailEventType } from "./generated/prisma/enums.js";

export const orderSchema = z.object({
  orderId: z.string(),
  orderCreatedAt: z.coerce.date(),
  channel: z.string(),
  gross: z.coerce.number(),
  currency: z.string(),
  customerEmail: z.string(),
});

export const emailEventSchema = z.object({
  eventId: z.string(),
  type: z.enum(EmailEventType),
  email: z.string(),
  campaignId: z.string(),
  occurredAt: z.coerce.date(),
});

export const adSpendSchema = z.object({
  date: z.coerce.date(),
  campaignId: z.string(),
  platform: z.string(),
  spend: z.coerce.number(),
});

export const refundSchema = z.object({
  refundId: z.string(),
  refundedAt: z.coerce.date(),
  orderId: z.string(),
  amount: z.coerce.number(),
  currency: z.string(),
});

export const sourceSchema = z.enum([
  "orders",
  "email_events",
  "ad_spend",
  "refunds",
]);

export type Source = z.infer<typeof sourceSchema>;
