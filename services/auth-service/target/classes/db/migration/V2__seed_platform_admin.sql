-- V2__seed_platform_admin.sql
-- Seed a default Platform Admin user

INSERT INTO users (full_name, email, password_hash, user_name, role, is_active, created_at)
VALUES ('Platform Admin', 'platform_admin@flowboard.com', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZMgJ5yT.Y/7p13Sj493K2v12V8Sg.', 'platform_admin', 'PLATFORM_ADMIN', 1, CURRENT_DATE);
