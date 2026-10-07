--liquibase formatted sql

--changeset ctrindadedev:add-plot-status
ALTER TABLE plots
    ADD COLUMN status VARCHAR(10) NOT NULL DEFAULT 'AVAILABLE'
        CONSTRAINT plots_status_check CHECK (status IN ('AVAILABLE', 'RESERVED', 'SOLD')),
    ADD COLUMN buyer_id UUID CONSTRAINT plots_buyer_fk REFERENCES users (id),
    ADD CONSTRAINT plots_buyer_matches_status CHECK ((status = 'AVAILABLE') = (buyer_id IS NULL));
--rollback ALTER TABLE plots DROP CONSTRAINT plots_buyer_matches_status, DROP COLUMN buyer_id, DROP COLUMN status;
