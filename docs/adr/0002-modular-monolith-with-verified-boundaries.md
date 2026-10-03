# 2. Modular monolith with verified boundaries

- **Status:** Accepted
- **Date:** 2026-10-03

## Context

The backend has a small number of business areas: plots now, and user identity once login lands. Each one has its own data, rules and HTTP endpoints. Both must stay easy to change on their own, but one deployable is enough for this load and team size. Package conventions only help if something checks them: a single wrong import goes unnoticed in review and erodes the structure over time.

## Decision

The backend is a **modular monolith, packaged by feature**:

- One top-level package per module under `io.github.ctrindadedev.lotline` (`plot`, later `identity`).
- **Only types in a module's base package are its public API.** Subpackages are internal.
- Modules refer to each other **by ID only**. A plot stores an owner ID, never a JPA relation to another module's entity.
- Inside a module, code is layered: `web` (controllers, DTOs) → `service` (use cases, transactions) → `persistence` (entities, repositories).

Two tests in `ArchitectureTests` enforce this. They are plain unit tests, with no Spring context and no database:

- **Spring Modulith** `ApplicationModules.of(...).verify()` fails when a module uses another module's internal type, or when modules form a cycle. Entities live in the internal `persistence` package, so a JPA relation across modules also counts as an internal dependency and fails the build.
- **ArchUnit**, which ships with Modulith: no class in a `web` package depends on a `persistence` package. Controllers go through the service layer and never expose entities.

## Alternatives considered

- **Microservices:** separate deployables, network calls and distributed data for two small modules. The cost is real and there is no matching benefit here.
- **Package by layer** (`controllers/`, `services/`, `repositories/` at the top): one feature ends up spread across the whole tree, and nothing marks what other features may use.
- **Full hexagonal / Clean Architecture** (ports and adapters for every dependency): more types and indirection than a CRUD-plus-spatial-query domain needs. The rule that matters, keeping HTTP and persistence apart, is covered by the layering test.
- **Separate Gradle modules per feature:** the compiler would enforce boundaries, but at the cost of build setup for every module. Modulith gives the same feedback in one test.
- **Conventions without tests:** they cost nothing up front, but violations only surface in review, if at all.

## Consequences

- A forbidden dependency fails `./gradlew check`, locally and in CI, with a message naming the offending type.
- Sharing something across modules is a deliberate act: the type has to move to the providing module's base package.
- Splitting a module out into its own service later is mostly mechanical, because its dependencies are already explicit.
