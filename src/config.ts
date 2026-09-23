import z from "zod";

const transformationSchema = z.enum(["uppercase", "lowercase"]);

const orderFieldSchema = z.enum([
  "orderId",
  "orderCreatedAt",
  "channel",
  "gross",
  "currency",
  "customerEmail",
]);

const emailEventFieldSchema = z.enum([
  "eventId",
  "type",
  "email",
  "campaignId",
  "occurredAt",
]);

const adSpendFieldSchema = z.enum(["date", "campaignId", "platform", "spend"]);

const refundFieldSchema = z.enum([
  "refundId",
  "refundedAt",
  "orderId",
  "amount",
  "currency",
]);

const orderConfigSchema = z.object({
  mappings: z.record(z.string(), orderFieldSchema),
  transformations: z
    .partialRecord(orderFieldSchema, transformationSchema)
    .optional(),
});

const emailEventConfigSchema = z.object({
  mappings: z.record(z.string(), emailEventFieldSchema),
  transformations: z
    .partialRecord(emailEventFieldSchema, transformationSchema)
    .optional(),
});

const adSpendConfigSchema = z.object({
  mappings: z.record(z.string(), adSpendFieldSchema),
  transformations: z
    .partialRecord(adSpendFieldSchema, transformationSchema)
    .optional(),
});

const refundConfigSchema = z.object({
  mappings: z.record(z.string(), refundFieldSchema),
  transformations: z
    .partialRecord(refundFieldSchema, transformationSchema)
    .optional(),
});

const tenantConfigSchema = z.object({
  orders: orderConfigSchema,
  email_events: emailEventConfigSchema,
  ad_spend: adSpendConfigSchema,
  refunds: refundConfigSchema,
});

export const configSchema = z.record(z.string(), tenantConfigSchema);

export type Config = z.infer<typeof configSchema>;
