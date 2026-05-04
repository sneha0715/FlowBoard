CREATE TABLE IF NOT EXISTS boards (
    board_id       BIGINT       NOT NULL AUTO_INCREMENT,
    workspace_id   BIGINT       NOT NULL,
    name           VARCHAR(255) NOT NULL,
    description    TEXT,
    background     VARCHAR(255),
    visibility     VARCHAR(50)  NOT NULL DEFAULT 'PRIVATE',
    created_by_id  BIGINT       NOT NULL,
    closed         TINYINT(1)   NOT NULL DEFAULT 0,
    created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (board_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS board_members (
    board_member_id BIGINT      NOT NULL AUTO_INCREMENT,
    board_id        BIGINT      NOT NULL,
    user_id         BIGINT      NOT NULL,
    role            VARCHAR(50) NOT NULL DEFAULT 'MEMBER',
    added_at        DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (board_member_id),
    UNIQUE KEY uq_board_user (board_id, user_id),
    CONSTRAINT fk_bm_board FOREIGN KEY (board_id) REFERENCES boards(board_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
