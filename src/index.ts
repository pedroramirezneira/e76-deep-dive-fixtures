import { readFileSync } from "fs";
import { manifestSchema } from "./manifest.js";
import path from "path";
import { createHash } from "crypto";
import { csvParse } from "./csv-parse.js";
import { ndjsonParse } from "./ndjson-parse.js";
import { ingestRawData } from "./ingestion.js";
import manifest from "../manifest.json" with { type: "json" };
import config from "../config.json" with { type: "json" };
import { configSchema } from "./config.js";
import { transformIngestion } from "./transform.js";
import prisma from "./db/prisma.js";

async function main() {
  const manifestParsed = manifestSchema.parse(manifest);
  configSchema.parse(config);
  let processed = 0;
  let missing = 0;
  let failed = 0;

  for (const batch of manifestParsed.batches) {
    try {
      const file = readFileSync(path.join("./", batch.path));
      const sourceHash = createHash("sha256").update(file).digest("hex");
      const records =
        batch.source === "email_events" ? ndjsonParse(file) : csvParse(file);
      const ingestion = await ingestRawData(batch, sourceHash, records);
      await transformIngestion(ingestion.id);
      processed++;
    } catch (error) {
      if (
        error instanceof Error &&
        "code" in error &&
        error.code === "ENOENT"
      ) {
        console.warn(
          `Missing file for ${batch.tenant}/${batch.source}: ${batch.path}`,
        );
        missing++;
      } else {
        console.error(
          `Batch failed for ${batch.tenant}/${batch.source}: ${batch.path}`,
          error instanceof Error ? error.message : error,
        );
        failed++;
      }
    }
  }

  console.log(
    `Batches: ${processed} processed, ${missing} missing, ${failed} failed.`,
  );
  if (failed > 0) process.exitCode = 1;
}

try {
  await main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
