const bcrypt = require("bcryptjs");
const envConfig = require("../config/env");

class PasswordUtil {
    /**
     * Hash a plain text password
     * @param {string} password - Plain text password
     * @returns {Promise<string>} Hashed password
     */
    async hash(password) {
        return await bcrypt.hash(password, envConfig.bcrypt.saltRounds);
    }

    /**
     * Compare plain text password with hashed password
     * @param {string} password - Plain text password
     * @param {string} hashedPassword - Hashed password from database
     * @returns {Promise<boolean>} True if passwords match
     */
    async compare(password, hashedPassword) {
        return await bcrypt.compare(password, hashedPassword);
    }

    /**
     * Validate password strength
     * @param {string} password - Password to validate
     * @returns {Object} Validation result with isValid and errors
     */
    validateStrength(password) {
        const errors = [];

        if (password.length < 8) {
            errors.push("Password must be at least 8 characters long");
        }

        if (!/[A-Z]/.test(password)) {
            errors.push("Password must contain at least one uppercase letter");
        }

        if (!/[a-z]/.test(password)) {
            errors.push("Password must contain at least one lowercase letter");
        }

        if (!/[0-9]/.test(password)) {
            errors.push("Password must contain at least one number");
        }

        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            errors.push("Password must contain at least one special character");
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }
}

module.exports = new PasswordUtil();
