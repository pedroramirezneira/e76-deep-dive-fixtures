export const ndjsonParse = (file: Buffer): object[] =>
  file
    .toString("utf-8")
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0)
    .map((line) => {
      const record: unknown = JSON.parse(line);
      if (
        record === null ||
        typeof record !== "object" ||
        Array.isArray(record)
      ) {
        throw new Error("NDJSON records must be objects");
      }
      return record;
    });
