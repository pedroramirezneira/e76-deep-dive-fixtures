# Tradeoffs

## Process and priorities

I started with the manifest. Northwind ad spend used `spend` in batches 1-3 and `cost_usd` in 4-5, so I added configurable mappings. Lumen had the same change and was missing batch 3.

I added transformers for lowercase email types and differences in order-channel casing, including Lumen. Channels stayed as strings. I chose PostgreSQL enums for email types because I considered them stable domain values. Refunds initially looked fine, I did not identify other column changes.

Next I designed the schema, focusing on tenant-scoped unique constraints for deduplication through upserts and a foreign key from refunds to orders. I planned separate CLI commands, but kept a basic entrypoint. Then I built raw ingestion followed by canonical transformation.

The hardest parts were validating configuration, defining the ingestion and validation flows, and choosing the model and constraints. I prioritized those over a complete CLI. I had spent about six hours before review and reserved two more for corrections and documentation, followed by the video.

## Decisions and limitations

- **Reruns:** file hashes prevent duplicate raw ingestion; business keys deduplicate canonical records. Raw writes commit together or roll back. Canonical writes can remain partial after an error, but raw survives and later batches continue.
- **Missing data:** missing files are reported and skipped, not treated as zero. Refunds without orders remain raw and are excluded from canonical results.
- **Later findings:** review identified overlapping Northwind orders, late email events and orphan refunds. Late records keep their original timestamps, so historical queries can change when data arrives.
- **Configuration:** JSON is simple, but onboarding requires editing files. I would have preferred database-managed configuration; it remains unfinished.
- **Execution:** asynchronous but sequential. Controlled concurrency is a possible improvement, with order/refund dependencies respected.
- **Finance:** summaries are reference data. Net does not reconcile from the available information, and EUR records coexist with USD-labeled summaries without an FX source or policy. I did not invent a formula or conversion.

## With another week

I would first test other configurations and failure scenarios, and ask the client how net is calculated, whether adjustments change, and how currencies should be handled.

Automated tests, separate replay/status commands, persistent canonical error tracking and database-managed configuration remain unfinished. Replay still requires the source files, and conflicting exports have no version policy: the last processed value wins.
