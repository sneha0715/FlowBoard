CREATE TABLE IF NOT EXISTS task_lists (
    list_id     BIGINT       NOT NULL AUTO_INCREMENT,
    board_id    BIGINT       NOT NULL,
    name        VARCHAR(255) NOT NULL,
    position    INT          NOT NULL DEFAULT 0,
    color       VARCHAR(50),
    is_archived TINYINT(1)   NOT NULL DEFAULT 0,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (list_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
