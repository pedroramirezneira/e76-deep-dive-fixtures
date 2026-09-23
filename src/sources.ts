import z from "zod";
import { EmailEventType } from "./generated/prisma/enums.js";

const requiredString = z
  .string()
  .refine((value) => value.trim().length > 0, "Must not be blank");
const timestamp = z.iso.datetime({ offset: true }).pipe(z.coerce.date());
const date = z.iso.date().pipe(z.coerce.date());
const money = z
  .union([z.string(), z.number()])
  .transform(String)
  .pipe(
    z
      .string()
      .regex(
        /^-?\d{1,10}(\.\d{1,2})?$/,
        "Expected a decimal with at most 10 integer and 2 fractional digits",
      ),
  );
const currency = z
  .string()
  .regex(/^[A-Z]{3}$/, "Expected a three-letter uppercase currency code");

export const orderSchema = z.object({
  orderId: requiredString,
  orderCreatedAt: timestamp,
  channel: requiredString,
  gross: money,
  currency,
  customerEmail: requiredString,
});

export const emailEventSchema = z.object({
  eventId: requiredString,
  type: z.enum(EmailEventType),
  email: requiredString,
  campaignId: requiredString,
  occurredAt: timestamp,
});

export const adSpendSchema = z.object({
  date,
  campaignId: requiredString,
  platform: requiredString,
  spend: money,
});

export const refundSchema = z.object({
  refundId: requiredString,
  refundedAt: timestamp,
  orderId: requiredString,
  amount: money,
  currency,
});

export const sourceSchema = z.enum([
  "orders",
  "email_events",
  "ad_spend",
  "refunds",
]);

export type Source = z.infer<typeof sourceSchema>;
