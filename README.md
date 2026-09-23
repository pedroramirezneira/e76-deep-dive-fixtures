# Multi-tenant ingestion

TypeScript + PostgreSQL + Prisma pipeline for orders, email events, ad spend and refunds from Northwind and Lumen.

Files -> raw storage -> config-based mapping and validation -> canonical tables.

## Run

Requires Node.js 24.11+, npm and Docker, or an existing PostgreSQL database. Run from the repository root:

```sh
npm install
cp .env.example .env

docker compose up -d
npm start
```

For an existing database, skip Docker and set `DATABASE_URL` in `.env`.

`npm start` generates Prisma Client, compiles, applies migrations and runs the pipeline. Docker is started separately. Run the same command again to repeat ingestion and canonicalization.

## Behavior

- SHA-256 identifies repeated files per tenant and source; canonical upserts deduplicate business records.
- Raw ingestion is transactional. Canonical failures preserve raw and do not stop later batches.
- Missing files are reported in the CLI and skipped.
- Refunds without an order remain in raw, are reported and are skipped in canonical storage.

## Add a tenant

Add its batches to `manifest.json` and its column mappings and transformations to `config.json`. List orders before refunds. Existing source formats require no tenant-specific code.

The CLI is basic and there are no automated tests. See [TRADEOFFS.md](TRADEOFFS.md) for decisions and unfinished work.
