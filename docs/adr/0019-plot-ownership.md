# 19. Plot ownership

- **Status:** Accepted
- **Date:** 2026-10-07

## Context

With accounts in place (ADR 0018), a plot has to belong to the user who listed it, and only that user may change or remove it. Plots listed before accounts existed (the demo seed) have no owner.

## Decision

- `plots.owner_id` is a nullable foreign key to `users(id)`. The `plot` module stores the id only, with no JPA relation to `identity` (ADR 0002), and reads it through `identity.CurrentUser`.
- Creating a plot records the logged-in user as its owner.
- `PUT /api/v1/plots/{id}` changes price, description and contact; `DELETE /api/v1/plots/{id}` removes the plot (`204`). Both are allowed only for the owner:
  - `401` without a session (ADR 0018);
  - `404` for an unknown plot;
  - `403` for anyone else, through a new semantic base `shared.ForbiddenException` (ADR 0006). A plot without an owner cannot be changed by anyone.
- The boundary is not editable. Changing it would be a new listing, with the overlap check of the create path; keeping it fixed means an update never has to run that check.
- Every plot response carries `ownedByMe`, so the SPA shows "edit" and "delete" without knowing user ids. The owner's id is not exposed.

## Alternatives considered

- **Hiding non-owned plots' actions only in the UI:** the API must refuse anyway; the UI flag is a convenience on top.
- **`404` instead of `403` for someone else's plot:** hides existence, but every plot is public to read, so there is nothing to hide.
- **Exposing `ownerId` in responses:** leaks account ids for no benefit; the client only needs to know whether the plot is its user's.
- **Soft delete:** nothing reads deleted plots in the MVP.

## Consequences

- Seed plots stay unowned and read-only.
- Deleting a user would fail while they own plots; account deletion is not in the MVP.
- `ownedByMe` depends on the session, so plot responses differ per user; nothing caches them outside the browser.
