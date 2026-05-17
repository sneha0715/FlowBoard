-- V3__update_platform_admin_password.sql
-- Update platform admin password to 'password'

UPDATE users SET password_hash = '$2a$10$4EuiCVZGXO6sRWJ4KhheIu53Ds80MnjVElFybXpsLGbFXT2TlxK6m' WHERE email = 'platform_admin@flowboard.com';
