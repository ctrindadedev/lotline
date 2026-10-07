--liquibase formatted sql

--changeset ctrindadedev:index-plot-owner-and-buyer
-- PostgreSQL indexes primary and unique keys, never the referencing side of a foreign key.
CREATE INDEX plots_owner_id_idx ON plots (owner_id);
CREATE INDEX plots_buyer_id_idx ON plots (buyer_id);
--rollback DROP INDEX plots_buyer_id_idx; DROP INDEX plots_owner_id_idx;
