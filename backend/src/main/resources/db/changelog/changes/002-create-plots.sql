--liquibase formatted sql

--changeset ctrindadedev:create-plots
-- Boundary is stored in WGS 84 lon/lat (SRID 4326); the column type rejects any other shape or SRID.
-- ST_IsValid backs up the application's validation: invalid polygons are rejected, never repaired.
CREATE TABLE plots (
    id          UUID                   PRIMARY KEY,
    boundary    geometry(Polygon, 4326) NOT NULL CONSTRAINT plots_boundary_valid CHECK (ST_IsValid(boundary)),
    price       NUMERIC(14, 2)         NOT NULL CONSTRAINT plots_price_positive CHECK (price > 0),
    description VARCHAR(2000)          NOT NULL,
    contact     VARCHAR(255)           NOT NULL,
    created_at  TIMESTAMPTZ            NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ            NOT NULL DEFAULT now()
);
--rollback DROP TABLE plots;

--changeset ctrindadedev:index-plots-boundary
-- Spatial index for overlap checks and viewport queries: filters by bounding box before exact tests.
CREATE INDEX plots_boundary_idx ON plots USING GIST (boundary);
--rollback DROP INDEX plots_boundary_idx;
