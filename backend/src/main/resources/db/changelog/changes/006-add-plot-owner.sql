--liquibase formatted sql

--changeset ctrindadedev:add-plot-owner
-- Nullable: plots listed before accounts existed (and the sample plots) have no owner.
ALTER TABLE plots ADD COLUMN owner_id UUID CONSTRAINT plots_owner_fk REFERENCES users (id);
--rollback ALTER TABLE plots DROP COLUMN owner_id;
