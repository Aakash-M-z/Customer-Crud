const pool = require("../../config/db");

class AuthRepository {
    /**
     * Find user by email
     */
    async findByEmail(email) {
        const [rows] = await pool.query(
            `SELECT u.*, r.name as role_name 
             FROM users u 
             JOIN roles r ON u.role_id = r.id 
             WHERE u.email = ?`,
            [email]
        );
        return rows[0];
    }

    /**
     * Find user by username
     */
    async findByUsername(username) {
        const [rows] = await pool.query(
            `SELECT u.*, r.name as role_name 
             FROM users u 
             JOIN roles r ON u.role_id = r.id 
             WHERE u.username = ?`,
            [username]
        );
        return rows[0];
    }

    /**
     * Find user by ID
     */
    async findById(id) {
        const [rows] = await pool.query(
            `SELECT u.*, r.name as role_name 
             FROM users u 
             JOIN roles r ON u.role_id = r.id 
             WHERE u.id = ?`,
            [id]
        );
        return rows[0];
    }

    /**
     * Create new user
     */
    async create(userData) {
        const { username, email, password_hash, role_id } = userData;
        const [result] = await pool.query(
            "INSERT INTO users (username, email, password_hash, role_id) VALUES (?, ?, ?, ?)",
            [username, email, password_hash, role_id]
        );
        return this.findById(result.insertId);
    }

    /**
     * Update last login timestamp
     */
    async updateLastLogin(userId) {
        await pool.query(
            "UPDATE users SET last_login = NOW() WHERE id = ?",
            [userId]
        );
    }

    /**
     * Store refresh token
     */
    async storeRefreshToken(userId, token, expiresAt) {
        await pool.query(
            "INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)",
            [userId, token, expiresAt]
        );
    }

    /**
     * Find refresh token
     */
    async findRefreshToken(token) {
        const [rows] = await pool.query(
            "SELECT * FROM refresh_tokens WHERE token = ? AND expires_at > NOW()",
            [token]
        );
        return rows[0];
    }

    /**
     * Delete refresh token
     */
    async deleteRefreshToken(token) {
        await pool.query(
            "DELETE FROM refresh_tokens WHERE token = ?",
            [token]
        );
    }

    /**
     * Delete all refresh tokens for a user
     */
    async deleteAllUserTokens(userId) {
        await pool.query(
            "DELETE FROM refresh_tokens WHERE user_id = ?",
            [userId]
        );
    }

    /**
     * Clean expired tokens
     */
    async cleanExpiredTokens() {
        await pool.query(
            "DELETE FROM refresh_tokens WHERE expires_at < NOW()"
        );
    }

    /**
     * Get role by name
     */
    async getRoleByName(roleName) {
        const [rows] = await pool.query(
            "SELECT * FROM roles WHERE name = ?",
            [roleName]
        );
        return rows[0];
    }

    /**
     * Get all roles
     */
    async getAllRoles() {
        const [rows] = await pool.query("SELECT * FROM roles ORDER BY id");
        return rows;
    }
}

module.exports = new AuthRepository();
