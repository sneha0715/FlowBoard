CREATE TABLE IF NOT EXISTS workspaces (
    workspace_id  INT          NOT NULL AUTO_INCREMENT,
    name          VARCHAR(255) NOT NULL,
    description   VARCHAR(1000),
    owner_id      INT          NOT NULL,
    visibility    VARCHAR(50),
    logo_url      VARCHAR(512),
    create_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (workspace_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS workspace_members (
    member_id    INT          NOT NULL AUTO_INCREMENT,
    workspace_id INT          NOT NULL,
    user_id      INT          NOT NULL,
    role         VARCHAR(50)  NOT NULL DEFAULT 'MEMBER',
    joined_at    DATE         NOT NULL DEFAULT (CURRENT_DATE),
    PRIMARY KEY (member_id),
    UNIQUE KEY uq_workspace_user (workspace_id, user_id),
    CONSTRAINT fk_wm_workspace FOREIGN KEY (workspace_id) REFERENCES workspaces(workspace_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
