--liquibase formatted sql

--changeset ctrindadedev:enable-postgis
CREATE EXTENSION IF NOT EXISTS postgis;
--rollback DROP EXTENSION IF EXISTS postgis;
