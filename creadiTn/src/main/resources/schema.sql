CREATE TABLE IF NOT EXISTS users (
    id             BIGINT AUTO_INCREMENT PRIMARY KEY,
    name           VARCHAR(100),
    email          VARCHAR(150) UNIQUE NOT NULL,
    password       VARCHAR(255) NOT NULL,
    is_verified    BOOLEAN DEFAULT FALSE,
    kyc_status     ENUM('PENDING','VERIFIED','REJECTED') DEFAULT 'PENDING',
    credit_score   INT DEFAULT 600,
    credit_limit   DECIMAL(10,2) DEFAULT 5000.00,
    fcm_token      VARCHAR(255) NULL,
    created_at     DATETIME DEFAULT NOW(),
    updated_at     DATETIME DEFAULT NOW() ON UPDATE NOW(),
    deleted_at     DATETIME NULL DEFAULT NULL,
    CONSTRAINT chk_credit_score CHECK (credit_score BETWEEN 300 AND 850),
    CONSTRAINT chk_credit_limit CHECK (credit_limit >= 0)
);

CREATE TABLE IF NOT EXISTS verification_tokens (
    id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id    BIGINT NOT NULL,
    token      VARCHAR(255) UNIQUE NOT NULL,
    expires_at DATETIME NOT NULL,
    used       BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT NOW(),
    updated_at DATETIME DEFAULT NOW() ON UPDATE NOW(),
    deleted_at DATETIME NULL DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS cards (
    id                BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id           BIGINT NOT NULL,
    card_token        VARCHAR(255) UNIQUE NOT NULL COMMENT 'UUID generated server-side, real PAN never stored',
    last4             CHAR(4) NOT NULL,
    expiry_encrypted  VARCHAR(500) NOT NULL COMMENT 'AES-256 encrypted',
    is_default        BOOLEAN DEFAULT FALSE,
    created_at        DATETIME DEFAULT NOW(),
    updated_at        DATETIME DEFAULT NOW() ON UPDATE NOW(),
    deleted_at        DATETIME NULL DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS credits (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id             BIGINT NOT NULL,
    total_amount        DECIMAL(10,2) NOT NULL,
    down_payment        DECIMAL(10,2) NOT NULL,
    remaining_amount    DECIMAL(10,2) NOT NULL,
    interest_rate       DECIMAL(5,2) NOT NULL,
    duration            INT NOT NULL,
    monthly_installment DECIMAL(10,2) NOT NULL,
    status              ENUM('ACTIVE','COMPLETED','DEFAULTED') DEFAULT 'ACTIVE',
    idempotency_key     VARCHAR(255) UNIQUE NOT NULL,
    created_at          DATETIME DEFAULT NOW(),
    updated_at          DATETIME DEFAULT NOW() ON UPDATE NOW(),
    deleted_at          DATETIME NULL DEFAULT NULL,
    CONSTRAINT chk_credit_duration      CHECK (duration IN (3,6,9,12)),
    CONSTRAINT chk_credit_interest_rate CHECK (interest_rate IN (0,3,6,12)),
    CONSTRAINT chk_credit_total_amount  CHECK (total_amount > 0)
);

CREATE TABLE IF NOT EXISTS credit_requests (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    total_amount DECIMAL(12,2) NOT NULL,
    down_payment DECIMAL(12,2) NOT NULL,
    financed_amount DECIMAL(12,2) NOT NULL,
    interest_rate DECIMAL(8,4) NOT NULL,
    interest_amount DECIMAL(12,2) NOT NULL,
    total_payable DECIMAL(12,2) NOT NULL,
    number_of_installments INT NOT NULL,
    monthly_amount DECIMAL(12,2) NOT NULL,
    product_name VARCHAR(255) NULL,
    status ENUM('PENDING','APPROVED','REJECTED') NOT NULL,
    created_at DATETIME DEFAULT NOW(),
    CONSTRAINT fk_credit_requests_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS installments (
    id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    credit_id  BIGINT NOT NULL,
    amount     DECIMAL(10,2) NOT NULL,
    due_date   DATE NOT NULL,
    paid_at    DATETIME NULL,
    status     ENUM('PENDING','PAID','LATE','MISSED') DEFAULT 'PENDING',
    created_at DATETIME DEFAULT NOW(),
    updated_at DATETIME DEFAULT NOW() ON UPDATE NOW(),
    deleted_at DATETIME NULL DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS transactions (
    id               BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id          BIGINT NOT NULL,
    installment_id   BIGINT NULL,
    amount           DECIMAL(10,2) NOT NULL,
    type             ENUM('DOWN_PAYMENT','INSTALLMENT_PAYMENT') NOT NULL,
    status           ENUM('SUCCESS','FAILED') NOT NULL,
    idempotency_key  VARCHAR(255) UNIQUE NOT NULL,
    created_at       DATETIME DEFAULT NOW(),
    updated_at       DATETIME DEFAULT NOW() ON UPDATE NOW(),
    deleted_at       DATETIME NULL DEFAULT NULL
);

ALTER TABLE verification_tokens
    ADD CONSTRAINT fk_vt_user
        FOREIGN KEY (user_id) REFERENCES users(id);

ALTER TABLE cards
    ADD CONSTRAINT fk_cards_user
        FOREIGN KEY (user_id) REFERENCES users(id);

ALTER TABLE credits
    ADD CONSTRAINT fk_credits_user
        FOREIGN KEY (user_id) REFERENCES users(id);

ALTER TABLE installments
    ADD CONSTRAINT fk_installments_credit
        FOREIGN KEY (credit_id) REFERENCES credits(id);

ALTER TABLE transactions
    ADD CONSTRAINT fk_tx_user
        FOREIGN KEY (user_id) REFERENCES users(id);

ALTER TABLE transactions
    ADD CONSTRAINT fk_tx_installment
        FOREIGN KEY (installment_id) REFERENCES installments(id);
