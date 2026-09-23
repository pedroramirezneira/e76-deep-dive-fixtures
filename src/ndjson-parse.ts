export const ndjsonParse = (file: Buffer): object[] =>
  file
    .toString("utf-8")
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0)
    .map((line) => JSON.parse(line));
