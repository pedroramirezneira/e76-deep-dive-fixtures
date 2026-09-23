import { readFileSync } from "fs";
import { manifestSchema } from "./manifest.js";
import path from "path";
import { createHash } from "crypto";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";
import { csvParse } from "./csv-parse.js";
import { ndjsonParse } from "./ndjson-parse.js";
import { createIngestion, ingestRawData } from "./ingestion.js";

const MANIFEST_PATH = "./manifest.json";

const file = readFileSync(MANIFEST_PATH, "utf-8");
const json = JSON.parse(file);
const parsed = manifestSchema.safeParse(json);

if (parsed.error) {
  throw new Error("Invalid manifest");
}

for (const batch of parsed.data.batches) {
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

    const ingestion = await createIngestion(batch, sourceHash);
    await ingestRawData(ingestion.id, records);
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      console.error(
        `Missing file for ${batch.tenant}/${batch.source}: ${batch.path}`,
      );
      continue;
    }
    if (
      error instanceof PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      continue;
    }
    throw error;
  }
}
