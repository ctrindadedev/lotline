# 21. Plot status and reservation

- **Status:** Accepted
- **Date:** 2026-10-07

## Context

A buyer needs a way to claim a plot before the sale, and the map has to show which plots are still for sale. A plot moves through `AVAILABLE → RESERVED → SOLD`, and the rules depend on who asks: the seller (owner, ADR 0019), the buyer, or anyone else. Two buyers can try to reserve the same plot at the same moment.

## Decision

- `plots.status` (`AVAILABLE`, `RESERVED`, `SOLD`, checked in the database) and `plots.buyer_id`, a nullable foreign key to `users`. A check constraint keeps them consistent: a buyer exactly when the plot is not available. Existing plots start `AVAILABLE`.
- **The transitions live on the `Plot` entity** (`reserve`, `release`, `sell`), which throws the module's semantic exceptions (ADR 0006). Services load, call one method, save; the rules are unit-tested without Spring or a database.

  | From | To | Who | Endpoint |
  |---|---|---|---|
  | `AVAILABLE` | `RESERVED` | any logged-in user except the seller | `POST /api/v1/plots/{id}/reservation` |
  | `RESERVED` | `AVAILABLE` | the seller or the buyer | `DELETE /api/v1/plots/{id}/reservation` |
  | `RESERVED` | `SOLD` | the seller | `POST /api/v1/plots/{id}/sale` |

  `SOLD` is final. A transition that the status does not allow is `409`; a user who may not make it is `403`; the seller reserving their own plot is `403`.
- **Plots without a seller cannot be reserved** (`409`). The sample plots have no owner (ADR 0019): once reserved, nobody could sell or release them. Responses carry `reservable` so the UI does not offer the action.
- **Reserved and sold plots are frozen:** editing or deleting them is `409`. A buyer's reservation should not change under them, and a sold plot is a record.
- **Concurrency with a row lock.** Every change to an existing plot (edit, delete, the three transitions) loads it with `SELECT … FOR UPDATE` (`PESSIMISTIC_WRITE`). Two buyers reserving at once run one after the other: the second sees `RESERVED` and gets `409`. An edit racing a delete now gets `404` instead of an error, because the locked read finds no row.
- Responses carry `status`, `reservable` and `reservedByMe` (the user asking is the buyer); the buyer's id is not exposed. The map colours plots by status, and the popup offers only the actions the user asking can take.

## Alternatives considered

- **Only the seller changes the status:** simpler, but it is a status field, not a reservation; no buyer, no rule between users.
- **A generic `PATCH /plots/{id}` with the new status:** one endpoint for everything, but each transition has a different actor, so the authorization would be a table inside one handler. One endpoint per action reads as the use case.
- **Optimistic locking (`@Version`):** no waiting, but the loser gets a version error to translate and retry, and the plot table gets a version column for one rule. The row lock gives the domain error ("already reserved") directly, and a reservation is short.
- **A conditional `UPDATE … WHERE status = 'AVAILABLE'`:** atomic and lock-free, but the rule moves into SQL and the entity stops being the place that knows the transitions.
- **A state-machine library (Spring Statemachine):** three states and three transitions do not need one.

## Consequences

- Nobody is notified of a reservation; the seller sees it on the plot. Contacting the buyer happens outside the app.
- A reservation does not expire. A stale one is released by the seller.
- The row lock serializes changes to one plot only; changes to different plots and registrations (ADR 0009) are unaffected.
