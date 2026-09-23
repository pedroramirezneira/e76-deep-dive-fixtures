import { readFileSync } from "fs";
import { manifestSchema } from "./manifest.js";
import path from "path";
import { createHash } from "crypto";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";
import { csvParse } from "./csv-parse.js";
import { ndjsonParse } from "./ndjson-parse.js";
import { createIngestion, getIngestion, ingestRawData } from "./ingestion.js";
import manifest from "../manifest.json" with { type: "json" };
import config from "../config.json" with { type: "json" };
import { configSchema } from "./config.js";
import { transformIngestion } from "./transform.js";

const manifestParsed = manifestSchema.safeParse(manifest);
const configParsed = configSchema.safeParse(config);

if (manifestParsed.error) {
  throw new Error(`Invalid manifest: ${manifestParsed.error}`);
}

if (configParsed.error) {
  throw new Error(`Invalid config: ${configParsed.error}`);
}

for (const batch of manifestParsed.data.batches) {
  try {
    const file = readFileSync(path.join("./", batch.path));
    const sourceHash = createHash("sha256").update(file).digest("hex");
    let records: object[];

    switch (batch.source) {
      case "orders":
      case "ad_spend":
      case "refunds": {
        records = csvParse(file);
        break;
      }
      case "email_events": {
        records = ndjsonParse(file);
        break;
      }
    }

    let ingestion;
    try {
      ingestion = await createIngestion(batch, sourceHash);
      await ingestRawData(ingestion.id, records);
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        ingestion = await getIngestion(batch.tenant, batch.source, sourceHash);
      } else {
        throw error;
      }
    }
    await transformIngestion(ingestion.id);
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      console.error(
        `Missing file for ${batch.tenant}/${batch.source}: ${batch.path}`,
      );
      continue;
    }
    throw error;
  }
}
