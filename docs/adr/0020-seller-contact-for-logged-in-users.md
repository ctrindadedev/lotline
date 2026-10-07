# 20. Seller contact only for logged-in users

- **Status:** Accepted
- **Date:** 2026-10-07

## Context

Every plot is public to read (ADR 0018), including the seller's contact. A public contact on every listing is easy to harvest in bulk through the viewport and radius endpoints.

## Decision

- Plot responses include `properties.contact` only when the request has a logged-in user. For visitors the field is left out of the JSON (`@JsonInclude(NON_NULL)`), not sent as `null` or masked.
- The rule applies wherever a plot is returned: by id, in a viewport, in a radius search. It lives in the one place that builds plot responses (`PlotController.toFeature`), next to `ownedByMe`.
- The popup shows a link to the login page in place of the contact, which brings the visitor back to the map afterwards. Logging in refetches the plots, so the contact appears without a reload.

## Consequences

- Reading a plot stays public; only reaching the seller needs an account, which is a common marketplace pattern.
- An account is cheap to create, so this slows bulk harvesting but does not stop it. Rate limiting is out of scope for the MVP.
- Plot responses differ for visitors and users, like `ownedByMe` already does (ADR 0019).
