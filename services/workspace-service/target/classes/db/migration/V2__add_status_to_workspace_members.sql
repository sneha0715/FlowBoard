-- V2__add_status_to_workspace_members.sql
ALTER TABLE workspace_members ADD COLUMN status VARCHAR(20) DEFAULT 'ACCEPTED';

-- Update existing rows to ensure they are not null
UPDATE workspace_members SET status = 'ACCEPTED' WHERE status IS NULL;

-- Now make it NOT NULL
ALTER TABLE workspace_members MODIFY COLUMN status VARCHAR(20) NOT NULL DEFAULT 'ACCEPTED';
