--liquibase formatted sql

--changeset ctrindadedev:index-plots-boundary-geography
-- Radius search measures in metres on geography; the geometry index from 002 cannot serve it.
CREATE INDEX plots_boundary_geography_idx ON plots USING GIST ((boundary::geography));
--rollback DROP INDEX plots_boundary_geography_idx;
