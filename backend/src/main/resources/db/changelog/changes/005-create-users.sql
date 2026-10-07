--liquibase formatted sql

--changeset ctrindadedev:create-users
-- The application lower-cases emails; the check keeps the unique index meaningful if it ever does not.
CREATE TABLE users (
    id            UUID         PRIMARY KEY,
    name          VARCHAR(100) NOT NULL,
    email         VARCHAR(255) NOT NULL CONSTRAINT users_email_lower_case CHECK (email = lower(email)),
    password_hash VARCHAR(100) NOT NULL,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT users_email_unique UNIQUE (email)
);
--rollback DROP TABLE users;
