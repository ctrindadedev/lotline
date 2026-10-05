# 9. Serialize plot registration with a transaction-scoped advisory lock

- **Status:** Accepted
- **Date:** 2026-10-05

## Context

Registering a plot is check-then-insert (ADR 0008). It first asks PostGIS whether the new boundary overlaps a stored plot, then inserts it. Two overlapping registrations arriving together can both pass the check: neither sees the other's row, because neither has committed yet. Both are stored, and the overlap rule is broken.

Row locks cannot prevent this. The row that would conflict does not exist yet, so there is nothing to `SELECT ... FOR UPDATE`.

## Decision

`PlotService.create` takes a PostgreSQL advisory lock inside its transaction: `pg_advisory_xact_lock(hashtext('plot-registration'))`. The order is:

1. validate the geometry (ADR 0007). This step needs no lock;
2. take the lock;
3. run the overlap query;
4. insert the plot.

The lock is released automatically when the transaction commits or rolls back. A second registration waits at step 2. When it continues, the first plot is already committed, so its overlap query sees it and the request gets 409.

The lock must come **before** the overlap query. Taken after it, the second registration would already have checked against a table without the first plot.

## Alternatives considered

- **`SELECT ... FOR UPDATE` on the overlapping rows:** the conflicting row is the one being inserted concurrently, so it does not exist yet (a phantom). There is nothing to lock.
- **A lock in Java (`synchronized`, `ReentrantLock`):** it only serializes threads within one JVM, so two API instances would each take their own lock and the race would come back. It also releases too early. `@Transactional` commits after the method returns, but the Java lock is released when the method returns, so the next caller can run its check before the previous insert is visible.
- **A distributed lock (e.g. Redis):** it works across instances, but it adds infrastructure only for this. It is also a different system from the database, so the code would have to make sure the lock is released only after the commit.
- **`SERIALIZABLE` isolation:** PostgreSQL detects the conflict, but it does so by aborting one transaction with a serialization failure (SQLSTATE 40001). The service would then need retry logic, and every other query in the transaction would pay for predicate locking.
- **`EXCLUDE USING gist (boundary WITH &&)` constraint:** atomic and enforced by the database, but `&&` compares bounding boxes, so it would reject neighbours. It also cannot express the 1 m² tolerance. An exclusion constraint only accepts commutative index operators, and `ST_Relate` with an area threshold is not one.
- **`LOCK TABLE plots`:** also serializes registrations, but it blocks every other writer on the table, such as the reservation updates planned for plots.
- **One lock per map region (e.g. a grid cell):** registrations far apart would run in parallel. A plot that crosses cell borders needs several locks, which must be taken in a fixed order to avoid deadlocks. This is more code for throughput the MVP does not need.

## Consequences

- Plot registrations run one at a time. Each one holds the lock for an overlap query and an insert, a few milliseconds, which is fine at this scale. Other reads and writes are not blocked.
- **The fix relies on READ COMMITTED**, PostgreSQL's default isolation level, which takes a new snapshot for each statement. That is why the overlap query run after the lock sees the other registration's commit. Under REPEATABLE READ the snapshot is fixed at the transaction's first statement, the area query of the validation, which runs before the lock. The race would come back without any error.
- The lock key is shared by every application instance that uses the same database, so it still works with several API containers.
- A test starts two overlapping registrations through the API. It holds the first one's commit and waits until the second is seen blocked on the lock in `pg_locks`. Then it asserts exactly one 201 and one 409. Removing the lock, or moving it after the overlap query, makes the test fail.
