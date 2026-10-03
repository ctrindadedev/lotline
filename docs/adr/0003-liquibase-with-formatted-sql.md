# 3. Database migrations with Liquibase formatted SQL

- **Status:** Accepted
- **Date:** 2026-10-03

## Context

The schema relies on PostGIS-specific SQL: the `postgis` extension, `geometry(Polygon, 4326)` columns, GiST indexes and constraints such as `ST_IsValid`. It must be created the same way everywhere: the developer's database, the Testcontainers database and the docker compose stack. Hibernate is set to `ddl-auto: validate`, so it checks the schema but never creates it.

## Decision

Liquibase runs on application startup and applies versioned changesets.

- A YAML master changelog (`db/changelog/db.changelog-master.yaml`) lists the files explicitly, so the order is visible in one place.
- Each file is **formatted SQL** (`--liquibase formatted sql`): plain PostgreSQL with `--changeset` and `--rollback` comments.
- Applied changesets are never edited. Every schema change is a new changeset, added by the issue that needs it.

## Alternatives considered

- **Flyway:** equally suitable and slightly simpler, with plain SQL files named by version. Liquibase was chosen because changesets carry an explicit rollback and an ID independent of the file name. Liquibase also fails fast with a checksum error when an applied changeset is edited. Either tool would have served.
- **Liquibase XML or YAML changesets:** their abstraction over databases buys nothing here. The schema is PostgreSQL-only by design, and the spatial parts would need raw SQL blocks anyway. SQL keeps the migration readable as the DDL it actually runs.
- **Hibernate `ddl-auto: update`:** it cannot express extensions, spatial indexes or check constraints reliably, and it gives no history or review of schema changes.

## Consequences

- The same changesets build the schema in tests and in production, so integration tests exercise the real DDL.
- Editing an already-applied changeset breaks startup with a checksum error. This is intended: fixes go in a new changeset.
- Reviewers read schema changes as SQL in the pull request that introduces them.
