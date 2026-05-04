CREATE TABLE IF NOT EXISTS comments (
    comment_id        BIGINT   NOT NULL AUTO_INCREMENT,
    card_id           BIGINT   NOT NULL,
    author_id         BIGINT   NOT NULL,
    content           TEXT     NOT NULL,
    parent_comment_id BIGINT,
    is_deleted        TINYINT(1) NOT NULL DEFAULT 0,
    created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (comment_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS attachments (
    attachment_id BIGINT        NOT NULL AUTO_INCREMENT,
    card_id       BIGINT        NOT NULL,
    uploader_id   BIGINT        NOT NULL,
    file_name     VARCHAR(255)  NOT NULL,
    file_url      VARCHAR(1024) NOT NULL,
    file_type     VARCHAR(100)  NOT NULL,
    size_kb       DOUBLE        NOT NULL DEFAULT 0,
    uploaded_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (attachment_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
