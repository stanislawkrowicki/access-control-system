CREATE TABLE logs
(
    id         BIGINT NOT NULL,
    user_id    BIGINT,
    lock_id    VARCHAR(255),
    had_access BOOLEAN,
    message    VARCHAR(255),
    CONSTRAINT pk_logs PRIMARY KEY (id)
);

ALTER TABLE logs
    ADD CONSTRAINT FK_LOGS_ON_LOCK FOREIGN KEY (lock_id) REFERENCES locks (id);

ALTER TABLE logs
    ADD CONSTRAINT FK_LOGS_ON_USER FOREIGN KEY (user_id) REFERENCES users (id);