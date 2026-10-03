# 6. Errors: semantic base exceptions, mapped to HTTP in one place

- **Status:** Accepted
- **Date:** 2026-10-03

## Context

The API reports errors as RFC 9457 `ProblemDetail` with a fixed mapping:

- 400 for invalid fields;
- 404 for not found;
- 409 for a plot overlapping an existing one;
- 422 for an invalid geometry.

Errors are raised in several layers of each module. The GeoJSON mapper (`web`) and plot validation (`service`) both reject geometries. More modules (`identity`) will add their own errors. The mapping must live in one place, must not change every time a module adds an exception, and must not make business code depend on HTTP.

## Decision

- The `shared` module's public API holds a few **semantic base exceptions**: `UnprocessableException` (well-formed input that breaks a business rule), plus `NotFoundException` and `ConflictException` when the first use of each lands. They describe what went wrong, never an HTTP status.
- Each module declares its own exceptions in its `exception` subpackage, extending one base: `plot.exception.InvalidGeometryException extends UnprocessableException`, and later `PlotNotFoundException` and `PlotOverlapException`. Both `web` and `service` can throw them.
- A single `@RestControllerAdvice` in `shared.web` maps each base to a status and a `ProblemDetail`:
  - `UnprocessableException` → 422;
  - `ConflictException` → 409;
  - `NotFoundException` → 404;
  - Bean Validation failures → 400 with the invalid fields;
  - anything else → 500 with a generic message, logged, never leaking internals.
- Dependencies point one way: modules depend on `shared`, and `shared` never knows the module exceptions. Spring Modulith verifies this.

## Alternatives considered

- **One handler per module:** each module repeats the same `ProblemDetail` building and the mapping can drift between modules.
- **A global handler listing every concrete exception:** `shared` would depend on every module, a cycle that Modulith rejects. It would also need editing for each new exception.
- **Exceptions carrying an `HttpStatus` (or `ResponseStatusException`):** simple, but it puts HTTP into business code that also runs outside a request.
- **Exceptions in each module's `service` package:** it works for the dependency direction, but readers look for errors in an `exception` package, and the mapper in `web` throwing a "service" type reads oddly.

## Consequences

- A new module gets correct error responses by extending the right base, with no change to the handler (open/closed).
- Business code stays free of HTTP types and is testable without a web context.
- The base set stays small on purpose. A new base is only added for a new kind of outcome, not for a new module.
