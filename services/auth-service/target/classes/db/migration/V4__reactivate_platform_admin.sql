-- V4__reactivate_platform_admin.sql
-- Reactivate platform admin user

UPDATE users SET is_active = 1 WHERE email = 'platform_admin@flowboard.com';
