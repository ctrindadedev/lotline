# Lotline

Map-based marketplace for land plots: sellers draw a plot's exact boundary on an interactive map and list it; buyers draw a circle on the map to find plots inside that area.

## What it is

<!-- Purpose of the application and the main user flows (register a plot, search by circle, view details). -->

## How it works

<!-- Architecture overview, data flow between map, API and database, and the main technical solutions. -->

### Architecture decisions

<!-- Links to docs/adr/. -->

## Running with Docker

<!-- Step-by-step: prerequisites, .env, docker compose up, URLs. -->

> **Apple Silicon:** the `postgis/postgis` image is published for amd64 only. The `db` service sets `platform: linux/amd64`, so it runs under emulation (slower start, same behavior).

## Running without Docker

<!-- Local development: database, backend, frontend. -->

## Running the tests

<!-- Backend and frontend test commands, and where to find the coverage reports (>= 80%). -->

### Coverage exclusions

<!-- Every file excluded from coverage, with the reason. -->
