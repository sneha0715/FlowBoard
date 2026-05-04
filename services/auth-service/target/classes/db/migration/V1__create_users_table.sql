-- V1__create_users_table.sql
-- FlowBoard auth-service schema

CREATE TABLE IF NOT EXISTS users (
    user_id      INT          NOT NULL AUTO_INCREMENT,
    full_name    VARCHAR(255) NOT NULL,
    email        VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    user_name    VARCHAR(255) NOT NULL UNIQUE,
    role         VARCHAR(50)  NOT NULL DEFAULT 'MEMBER',
    avatar_url   VARCHAR(512),
    provider     VARCHAR(100),
    is_active    TINYINT(1)   NOT NULL DEFAULT 1,
    created_at   DATE         NOT NULL DEFAULT (CURRENT_DATE),
    PRIMARY KEY (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
