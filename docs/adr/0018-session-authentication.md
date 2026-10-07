# 18. Session authentication in an HttpOnly cookie

- **Status:** Accepted
- **Date:** 2026-10-07

## Context

Listing a plot needs an account; browsing, searching and reading a plot's details do not. The only client is the browser, and nginx serves the SPA and the API on the same origin (#33). Two mechanisms were on the table: a server-side session identified by a cookie, or a signed token (JWT) sent in the `Authorization` header.

## Decision

- **Server-side session.** `POST /api/v1/auth/login` (and `register`, which logs the new user in) authenticates with Spring Security's `AuthenticationManager`, changes the session id (session fixation) and stores the security context in the HTTP session. The browser keeps only the `JSESSIONID` cookie: `HttpOnly`, `SameSite=Lax`.
- `POST /api/v1/auth/logout` is Spring Security's logout filter: it invalidates the session and answers `204`. `GET /api/v1/auth/me` returns the user or `401`.
- **Reading is public, every write needs a user.** POST, PUT, PATCH and DELETE under `/api/v1/**` require authentication, except `register` and `login`. The rule lives in one `SecurityFilterChain` in `shared.web` and names no module's routes.
- **CSRF protection** with Spring Security's SPA mode (`csrf.spa()`): a readable `XSRF-TOKEN` cookie, echoed by the frontend in an `X-XSRF-TOKEN` header on every write. `GET /me`, which the SPA calls on start, loads the token so the cookie exists before the first write.
- Passwords are hashed with BCrypt. Emails are trimmed and lower-cased and unique in the database. A password is 8 characters to 72 bytes (BCrypt ignores anything past 72 bytes).
- No roles: every account can do the same things. Later rules are about owning a plot, not about roles.
- Authentication and authorization errors are `401` / `403` `ProblemDetail`s from the same `@RestControllerAdvice` as every other error (ADR 0006): the entry point and access-denied handler delegate to it.
- The `identity` module exposes `CurrentUser` (the logged-in user's id) as its public API. Other modules refer to users by id only (ADR 0002).

## Alternatives considered

- **JWT in the `Authorization` header:** stateless and immune to CSRF, but the token has to be kept where JavaScript can read it (XSS can steal it), and logging out or removing access only takes effect when the token expires unless a denylist brings state back. Refresh tokens add more moving parts.
- **JWT in an HttpOnly cookie:** fixes the XSS exposure but needs CSRF protection again and keeps the revocation problem.
- **Spring Security's form login:** made for HTML forms and redirects; the SPA needs JSON in and out.

## Consequences

- Logout takes effect immediately, and the credential is out of reach of page scripts.
- Same origin means no CORS configuration and a first-party cookie, so `SameSite=Lax` works and third-party cookie blocking does not affect login.
- Sessions live in the API's memory: restarting the API logs everyone out, and several API instances would need shared sessions (Spring Session JDBC on the existing PostgreSQL, or Redis), without changes to the rest of the code.
- Registration answers `409` for a taken email with a generic message ("The account could not be created with these details"), and the interface says only that the account could not be created (amended in #95). The status code still tells an API client that the email is taken; hiding that too needs a confirmation email sent in both cases, which the MVP does not have. Login never distinguishes a wrong password from an unknown email: the interface shows one message, "E-mail ou senha inválidos", for an incomplete form and for wrong credentials alike. Rate limiting login attempts is not in the MVP.
- Production needs HTTPS in front (nginx or a load balancer) and the cookie marked `Secure`, with `X-Forwarded-Proto` passed to the API.
