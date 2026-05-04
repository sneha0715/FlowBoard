CREATE TABLE IF NOT EXISTS notifications (
    notification_id BIGINT        NOT NULL AUTO_INCREMENT,
    recipient_id    BIGINT        NOT NULL,
    actor_id        BIGINT,
    type            VARCHAR(100)  NOT NULL,
    message         VARCHAR(1000) NOT NULL,
    title           VARCHAR(255)  NOT NULL,
    related_id      BIGINT,
    related_type    VARCHAR(100),
    is_read         TINYINT(1)    NOT NULL DEFAULT 0,
    created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (notification_id),
    INDEX idx_notif_recipient (recipient_id),
    INDEX idx_notif_read (recipient_id, is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
