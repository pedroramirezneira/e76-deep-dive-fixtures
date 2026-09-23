import z from "zod";
import { sourceSchema } from "./sources.js";

export const manifestSchema = z.object({
  generated_for: z.string().min(1),
  batches: z.array(
    z.object({
      tenant: z.string().min(1),
      source: sourceSchema,
      batch: z.int().positive(),
      path: z.string().min(1),
      covers_from: z.iso.date(),
      covers_to: z.iso.date(),
    }),
  ),
});

export type Manifest = z.infer<typeof manifestSchema>;
