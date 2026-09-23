import { parse } from "csv-parse/sync";

export const csvParse = (file: Buffer): object[] =>
  parse(file, {
    columns: true,
    skip_empty_lines: true,
  });
