CREATE TABLE IF NOT EXISTS cards (
    card_id       BIGINT       NOT NULL AUTO_INCREMENT,
    list_id       BIGINT       NOT NULL,
    board_id      BIGINT       NOT NULL,
    title         VARCHAR(255) NOT NULL,
    description   TEXT,
    position      INT          NOT NULL DEFAULT 0,
    priority      VARCHAR(50)  NOT NULL DEFAULT 'MEDIUM',
    status        VARCHAR(50)  NOT NULL DEFAULT 'TODO',
    due_date      DATE,
    start_date    DATE,
    assignee_id   BIGINT,
    created_by_id BIGINT,
    is_archived   TINYINT(1)   NOT NULL DEFAULT 0,
    cover_color   VARCHAR(50),
    created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (card_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
