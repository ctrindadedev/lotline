# Lotline

Map-based marketplace for land plots: sellers draw a plot's exact boundary on an interactive map and list it; buyers draw a circle on the map to find plots inside that area.

## What it is

A web app where land is listed by its real shape rather than by an address.

- **List a plot.** Draw its boundary on the map, vertex by vertex (undo with Ctrl+Z, cancel with Esc). The area is shown live, and vertices close to a neighbour's border snap onto it. Then give a price, a description and a contact. A plot that overlaps another one is refused; sharing a border is fine.
- **Explore.** The map shows the plots in view and reloads them as you pan and zoom, with a summary of the area (plots per status, total area, median price per m²) and a list of cards. Colour the map by status or by price per m² to see where land is cheap or expensive.
- **Search an area.** Press on the map and drag out a circle, as on geojson.io: its radius follows the cursor, in metres, and releasing lists the plots that reach into it, closest first. Narrow the results by price and area.
- **See a plot.** Click it for its price, area, price per m², description, status and listing date. The seller's contact is shown to logged-in users.
- **Accounts.** Browsing is open to everyone. Listing a plot, seeing a contact and reserving need an account (name, email and password).
- **Manage your plots.** The seller can change the price, description and contact, or remove the plot, while it is available.
- **Reserve and sell.** Another user reserves an available plot; the seller confirms the sale or releases the reservation. The map colours plots by status: blue available, amber reserved, grey sold.

The interface is in Brazilian Portuguese; code, API and documentation are in English.

## How it works

```
Browser (React + OpenLayers) ──► nginx ──► Spring Boot API ──► PostgreSQL + PostGIS
          map tiles ◄── OpenStreetMap        /api proxy          spatial rules in SQL
```

- **Frontend:** React 19 + TypeScript, built with Vite. OpenLayers draws on a Web Mercator (EPSG:3857) map; the app converts shapes to WGS 84 longitude/latitude (EPSG:4326) GeoJSON only when talking to the API, and measures lengths and areas geodesically. TanStack Query holds the server state, MUI provides the components. The map's modes (idle, drawing a plot, drawing a search circle, filling in the plot form, showing search results) are an explicit state machine, so only one drawing tool is ever active.
- **Backend:** Java 21, Spring Boot 4, a modular monolith with two modules, `plot` and `identity`, each layered `web → service → persistence`. The module boundaries and the layering are verified by tests (Spring Modulith, ArchUnit). Errors are RFC 9457 `ProblemDetail` responses: `400` invalid fields, `401`/`403` authentication and permissions, `404` not found, `409` overlap or status conflict, `422` invalid geometry.
- **Database:** boundaries are stored as `geometry(Polygon, 4326)` with GiST indexes. The spatial rules run in PostGIS:
  - **Overlap:** two plots overlap when their interiors intersect (`ST_Relate`) and the shared area is above 1 m², so neighbours can share a border drawn by hand. Registrations take a transaction-scoped advisory lock so two overlapping plots submitted at once cannot both pass.
  - **Radius search:** `ST_DWithin` on `geography`, in metres on the Earth's surface, served by an expression index, with price and area (`ST_Area` on `geography`) filters in the same query.
  - **Viewport:** `ST_Intersects` with the visible rectangle, on `geometry`.
  - **Validation:** invalid polygons are rejected with `422`, never repaired. Limits: 500 positions, 100 km².
- **Accounts:** a server-side session in an `HttpOnly` cookie with CSRF protection; nginx serves the app and the API on one origin.
- **Reservations:** `AVAILABLE → RESERVED → SOLD`, with the transitions on the plot entity and a row lock so two buyers cannot reserve the same plot.

### Architecture decisions

The architecture overview, with diagrams of every view, the [design patterns and SOLID principles in use](docs/architecture.md#43-design-patterns-and-solid) and the index of all decision records, is in [docs/architecture.md](docs/architecture.md). Each decision has its own record in [docs/adr/](docs/adr/).

## Running with Docker

Prerequisites: [Docker](https://docs.docker.com/get-docker/) with Compose v2 (Docker Desktop, or Docker Engine with the compose plugin). Nothing else.

```bash
git clone https://github.com/ctrindadedev/lotline.git
cd lotline
docker compose up --build
```

The first build takes a few minutes (it downloads the Gradle and npm dependencies inside the images). When the three services are healthy:

- App: <http://localhost:8080>
- API documentation (Swagger UI): <http://localhost:8080/swagger-ui.html>

The database starts with sample plots around Campinas, where the map opens. They have no seller, so they cannot be reserved: to try reservations, create two accounts, list a plot with one and reserve it with the other.

Stop with `Ctrl+C` or `docker compose down`; `docker compose down -v` also deletes the database volume.

No `.env` file is needed. To change a default, export the variable or put it in a `.env` file next to `docker-compose.yml`:

| Variable                                            | Default   | Purpose                          |
| --------------------------------------------------- | --------- | -------------------------------- |
| `WEB_PORT`                                          | `8080`    | Port of the app on the host      |
| `POSTGRES_PORT`                                     | `5432`    | Port of the database on the host |
| `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` | `lotline` | Database name and credentials    |

> **Apple Silicon:** the `postgis/postgis` image is published for amd64 only. The `db` service sets `platform: linux/amd64`, so it runs under emulation (slower start, same behavior).

## Running without Docker

You need a JDK 21, Node.js 24 (see `frontend/.nvmrc`; 22.12 or later works) and PostgreSQL 17 with PostGIS 3.6.

### 1. Database

Either start only the database container:

```bash
docker compose up -d db
```

or use a native PostgreSQL with PostGIS:

```bash
# Ubuntu / Debian (PostgreSQL apt repository): sudo apt install postgresql-17 postgresql-17-postgis-3
# macOS (Homebrew):                            brew install postgresql@17 postgis
# Windows: the EDB installer, then PostGIS from Stack Builder
sudo -u postgres psql -c "CREATE USER lotline WITH PASSWORD 'lotline';"
sudo -u postgres psql -c "CREATE DATABASE lotline OWNER lotline;"
sudo -u postgres psql -d lotline -c "CREATE EXTENSION postgis;"
```

On macOS with Homebrew your own user is the superuser: drop the `sudo -u postgres` prefix.

The extension is created by a superuser up front because the application's user is not one; the first migration then finds it in place. Liquibase creates the tables when the API starts.

### 2. API

```bash
cd backend
export DB_URL=jdbc:postgresql://localhost:5432/lotline DB_USER=lotline DB_PASSWORD=lotline
export SPRING_LIQUIBASE_CONTEXTS=default,demo   # optional: load the sample plots
./gradlew bootRun                               # gradlew.bat on Windows
```

The API listens on <http://localhost:8080> (Swagger UI at `/swagger-ui.html`).

### 3. Frontend

```bash
cd frontend
npm ci
npm run dev
```

Open <http://localhost:5173>. The Vite dev server proxies `/api` to the API on port 8080, so the browser still sees a single origin. Stop the Docker stack first if it is running: it also uses port 8080.

## Running the tests

```bash
# Backend: formatting, unit and integration tests, coverage gate (needs Docker running)
cd backend
./gradlew check
# report: backend/build/reports/jacoco/test/html/index.html

# Frontend: lint and formatting, type check, tests with coverage gate
cd frontend
npm run lint && npm run typecheck
npm run test:coverage
# report: frontend/coverage/index.html
```

The backend integration tests start a `postgis/postgis` container with Testcontainers, so Docker must be running; there is no in-memory database, because none has PostGIS. One container is shared by the whole suite. The concurrency rules are tested by holding one transaction open while a second request runs.

CI (GitHub Actions) runs both suites on every pull request, plus a job that builds the images, starts the stack with `docker compose` and checks the app and the API through nginx. Each run shows the coverage of both suites as tables in its summary page (Actions → the run → Summary), and the HTML reports are attached to it as artifacts.

### Coverage exclusions

Both sides fail the build below 80%: `./gradlew check` (JaCoCo, line coverage) and `npm run test:coverage` (Vitest v8: lines, statements, functions and branches). The exclusions are kept minimal:

| Side     | Excluded                                | Reason                                                                                                        |
| -------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Backend  | `LotlineApplication`                    | Only the `main` method that starts Spring; the application context itself is booted by the integration tests. |
| Frontend | `src/main.tsx`                          | Only mounts `<App />` into the DOM; `App` is tested directly.                                                 |
| Frontend | `src/test/**`, `*.test.ts(x)`, `*.d.ts` | Test setup, tests and type declarations, not application code.                                                |

## Project layout

```
backend/            Spring Boot API (Gradle): modules plot/, identity/, shared/
frontend/           React + OpenLayers app (Vite): app/, domains/plots, domains/auth, shared/map
docs/architecture.md  Architecture overview and decision index
docs/adr/           Architecture decision records
docker-compose.yml  Full stack: db + api + web
```
