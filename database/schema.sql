-- ============================================================
-- AI-Native Mini CRM - Complete MySQL Schema
-- ============================================================

CREATE DATABASE IF NOT EXISTS ai_crm;
USE ai_crm;

-- ============================================================
-- USERS  (authentication)
-- ============================================================
CREATE TABLE users (
  user_id       VARCHAR(36)  NOT NULL DEFAULT (UUID()),
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('admin','manager','viewer') NOT NULL DEFAULT 'manager',
  avatar        VARCHAR(255),
  is_active     TINYINT(1)   NOT NULL DEFAULT 1,
  last_login_at DATETIME,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  INDEX idx_email (email),
  INDEX idx_role  (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Default admin  (password: Admin@123)
-- bcrypt hash of "Admin@123" with saltRounds=10
INSERT INTO users (user_id, name, email, password_hash, role) VALUES
('u001','Admin User','admin@crmhq.com',
 '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWq',
 'admin');

-- ============================================================
-- REFRESH TOKENS
-- ============================================================
CREATE TABLE refresh_tokens (
  id         BIGINT      NOT NULL AUTO_INCREMENT,
  user_id    VARCHAR(36) NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  expires_at DATETIME    NOT NULL,
  created_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_user_id   (user_id),
  INDEX idx_token_hash(token_hash),
  CONSTRAINT fk_rt_user FOREIGN KEY (user_id)
    REFERENCES users (user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- CUSTOMERS
-- ============================================================
CREATE TABLE customers (
  customer_id   VARCHAR(36)  NOT NULL DEFAULT (UUID()),
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,
  phone         VARCHAR(20),
  city          VARCHAR(80),
  total_spent   DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  order_count   INT          NOT NULL DEFAULT 0,
  last_order_at DATETIME,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (customer_id),
  INDEX idx_email (email),
  INDEX idx_city (city),
  INDEX idx_total_spent (total_spent),
  INDEX idx_last_order_at (last_order_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- ORDERS
-- ============================================================
CREATE TABLE orders (
  order_id      VARCHAR(36)  NOT NULL DEFAULT (UUID()),
  customer_id   VARCHAR(36)  NOT NULL,
  product_name  VARCHAR(200) NOT NULL,
  category      VARCHAR(80),
  amount        DECIMAL(10,2) NOT NULL,
  order_date    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (order_id),
  INDEX idx_customer_id (customer_id),
  INDEX idx_order_date (order_date),
  INDEX idx_category (category),
  CONSTRAINT fk_orders_customer FOREIGN KEY (customer_id)
    REFERENCES customers (customer_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- SEGMENTS
-- ============================================================
CREATE TABLE segments (
  segment_id    VARCHAR(36)  NOT NULL DEFAULT (UUID()),
  name          VARCHAR(120) NOT NULL,
  description   TEXT,
  conditions    JSON         NOT NULL,
  sql_condition TEXT,
  ai_generated  TINYINT(1)   NOT NULL DEFAULT 0,
  customer_count INT         NOT NULL DEFAULT 0,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (segment_id),
  INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- CAMPAIGNS
-- ============================================================
CREATE TABLE campaigns (
  campaign_id   VARCHAR(36)  NOT NULL DEFAULT (UUID()),
  name          VARCHAR(150) NOT NULL,
  segment_id    VARCHAR(36)  NOT NULL,
  channel       ENUM('WhatsApp','SMS','Email','RCS') NOT NULL DEFAULT 'WhatsApp',
  message       TEXT         NOT NULL,
  status        ENUM('draft','sending','sent','completed','failed') NOT NULL DEFAULT 'draft',
  ai_generated  TINYINT(1)   NOT NULL DEFAULT 0,
  -- aggregate stats (updated by receipts)
  stat_sent      INT NOT NULL DEFAULT 0,
  stat_delivered INT NOT NULL DEFAULT 0,
  stat_failed    INT NOT NULL DEFAULT 0,
  stat_opened    INT NOT NULL DEFAULT 0,
  stat_read      INT NOT NULL DEFAULT 0,
  stat_clicked   INT NOT NULL DEFAULT 0,
  stat_converted INT NOT NULL DEFAULT 0,
  scheduled_at  DATETIME,
  sent_at       DATETIME,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (campaign_id),
  INDEX idx_segment_id (segment_id),
  INDEX idx_status (status),
  INDEX idx_channel (channel),
  CONSTRAINT fk_campaigns_segment FOREIGN KEY (segment_id)
    REFERENCES segments (segment_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- CAMPAIGN RECIPIENTS
-- ============================================================
CREATE TABLE campaign_recipients (
  id            BIGINT       NOT NULL AUTO_INCREMENT,
  campaign_id   VARCHAR(36)  NOT NULL,
  customer_id   VARCHAR(36)  NOT NULL,
  status        ENUM('pending','sent','delivered','failed','opened','read','clicked','converted')
                             NOT NULL DEFAULT 'pending',
  sent_at       DATETIME,
  delivered_at  DATETIME,
  opened_at     DATETIME,
  read_at       DATETIME,
  clicked_at    DATETIME,
  converted_at  DATETIME,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_campaign_customer (campaign_id, customer_id),
  INDEX idx_campaign_id (campaign_id),
  INDEX idx_customer_id (customer_id),
  INDEX idx_status (status),
  CONSTRAINT fk_cr_campaign FOREIGN KEY (campaign_id)
    REFERENCES campaigns (campaign_id) ON DELETE CASCADE,
  CONSTRAINT fk_cr_customer FOREIGN KEY (customer_id)
    REFERENCES customers (customer_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- COMMUNICATION LOGS
-- ============================================================
CREATE TABLE communication_logs (
  log_id        BIGINT       NOT NULL AUTO_INCREMENT,
  campaign_id   VARCHAR(36)  NOT NULL,
  customer_id   VARCHAR(36)  NOT NULL,
  channel       VARCHAR(20)  NOT NULL,
  event_type    VARCHAR(40)  NOT NULL,
  payload       JSON,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (log_id),
  INDEX idx_campaign_id (campaign_id),
  INDEX idx_customer_id (customer_id),
  INDEX idx_event_type (event_type),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- SAMPLE DATA
-- ============================================================
INSERT INTO customers (customer_id, name, email, phone, city, total_spent, order_count, last_order_at) VALUES
('c001','Aasha Mehta','aasha@example.com','9876543210','Mumbai',12500.00,8,'2024-03-10 10:00:00'),
('c002','Rohan Sharma','rohan@example.com','9876543211','Delhi',3200.00,2,'2024-01-05 14:30:00'),
('c003','Priya Nair','priya@example.com','9876543212','Bangalore',7800.00,5,'2024-04-01 09:15:00'),
('c004','Kunal Bose','kunal@example.com','9876543213','Kolkata',500.00,1,'2023-11-20 16:00:00'),
('c005','Divya Patel','divya@example.com','9876543214','Ahmedabad',22000.00,15,'2024-04-10 11:45:00'),
('c006','Arjun Reddy','arjun@example.com','9876543215','Hyderabad',9100.00,6,'2024-02-28 08:00:00'),
('c007','Sneha Joshi','sneha@example.com','9876543216','Pune',4600.00,3,'2024-03-22 13:30:00'),
('c008','Vikram Singh','vikram@example.com','9876543217','Jaipur',1100.00,1,'2023-12-15 15:00:00');

INSERT INTO orders (order_id, customer_id, product_name, category, amount, order_date) VALUES
('o001','c001','Moisturizer SPF50','Beauty',1200.00,'2024-03-10 10:00:00'),
('o002','c001','Lipstick Set','Beauty',800.00,'2024-02-15 11:00:00'),
('o003','c002','Running Shoes','Sports',3200.00,'2024-01-05 14:30:00'),
('o004','c003','Yoga Mat','Sports',1500.00,'2024-04-01 09:15:00'),
('o005','c003','Protein Powder','Health',2200.00,'2024-03-10 10:00:00'),
('o006','c005','Saree','Clothing',5000.00,'2024-04-10 11:45:00'),
('o007','c005','Kurti Pack','Clothing',3500.00,'2024-03-25 12:00:00'),
('o008','c006','Face Serum','Beauty',2100.00,'2024-02-28 08:00:00'),
('o009','c007','Sneakers','Sports',4600.00,'2024-03-22 13:30:00'),
('o010','c008','Cap','Clothing',1100.00,'2023-12-15 15:00:00');

INSERT INTO segments (segment_id, name, description, conditions, sql_condition, customer_count) VALUES
('s001','High Value Customers','Customers who spent more than ₹5000',
 '{"total_spent":{"gt":5000}}',
 'total_spent > 5000', 3),
('s002','Inactive 60 Days','Customers with no orders in last 60 days',
 '{"last_order_at":{"days_ago":60}}',
 'last_order_at < DATE_SUB(NOW(), INTERVAL 60 DAY)', 3),
('s003','Frequent Buyers','Customers with 5 or more orders',
 '{"order_count":{"gte":5}}',
 'order_count >= 5', 3);
