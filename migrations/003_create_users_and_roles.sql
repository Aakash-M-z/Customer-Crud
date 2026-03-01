-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role_id INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT,
    INDEX idx_email (email),
    INDEX idx_username (username),
    INDEX idx_role_id (role_id)
);

-- Create refresh tokens table
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token VARCHAR(500) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_token (token),
    INDEX idx_user_id (user_id),
    INDEX idx_expires_at (expires_at)
);

-- Insert default roles
INSERT INTO roles (name, description) VALUES
('admin', 'Full system access with all permissions'),
('manager', 'Can manage submissions and view reports'),
('user', 'Can create and view own submissions'),
('viewer', 'Read-only access to submissions')
ON DUPLICATE KEY UPDATE description = VALUES(description);

-- Create default admin user (password: Admin@123)
-- Password hash for 'Admin@123' using bcrypt
INSERT INTO users (username, email, password_hash, role_id) VALUES
('admin', 'admin@example.com', '$2a$10$UU22T5WklB5zNQeskuxUP.KCxmd7HtcC0YGNxk7QZbKX2gAsXZOFK', 1)
ON DUPLICATE KEY UPDATE email = VALUES(email);
