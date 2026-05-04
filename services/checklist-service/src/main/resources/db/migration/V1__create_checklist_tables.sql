CREATE TABLE IF NOT EXISTS labels (
    label_id   BIGINT       NOT NULL AUTO_INCREMENT,
    board_id   BIGINT       NOT NULL,
    name       VARCHAR(100) NOT NULL,
    color      VARCHAR(50)  NOT NULL,
    created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (label_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS card_labels (
    id       BIGINT NOT NULL AUTO_INCREMENT,
    card_id  BIGINT NOT NULL,
    label_id BIGINT NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_card_label (card_id, label_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS checklists (
    checklist_id BIGINT       NOT NULL AUTO_INCREMENT,
    card_id      BIGINT       NOT NULL,
    title        VARCHAR(255) NOT NULL,
    position     INT          NOT NULL DEFAULT 0,
    created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (checklist_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS checklist_items (
    item_id      BIGINT       NOT NULL AUTO_INCREMENT,
    checklist_id BIGINT       NOT NULL,
    text         VARCHAR(500) NOT NULL,
    is_completed TINYINT(1)   NOT NULL DEFAULT 0,
    assignee_id  BIGINT,
    due_date     DATE,
    PRIMARY KEY (item_id),
    CONSTRAINT fk_ci_checklist FOREIGN KEY (checklist_id) REFERENCES checklists(checklist_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
