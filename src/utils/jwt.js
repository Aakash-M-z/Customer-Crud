const jwt = require("jsonwebtoken");
const envConfig = require("../config/env");

class JWTUtil {
    /**
     * Generate access token
     * @param {Object} payload - User data to encode
     * @returns {string} JWT access token
     */
    generateAccessToken(payload) {
        return jwt.sign(
            payload,
            envConfig.jwt.accessTokenSecret,
            { expiresIn: envConfig.jwt.accessTokenExpiry }
        );
    }

    /**
     * Generate refresh token
     * @param {Object} payload - User data to encode
     * @returns {string} JWT refresh token
     */
    generateRefreshToken(payload) {
        return jwt.sign(
            payload,
            envConfig.jwt.refreshTokenSecret,
            { expiresIn: envConfig.jwt.refreshTokenExpiry }
        );
    }

    /**
     * Verify access token
     * @param {string} token - JWT token to verify
     * @returns {Object} Decoded token payload
     * @throws {Error} If token is invalid or expired
     */
    verifyAccessToken(token) {
        try {
            return jwt.verify(token, envConfig.jwt.accessTokenSecret);
        } catch (error) {
            if (error.name === "TokenExpiredError") {
                throw new Error("Access token expired");
            }
            if (error.name === "JsonWebTokenError") {
                throw new Error("Invalid access token");
            }
            throw error;
        }
    }

    /**
     * Verify refresh token
     * @param {string} token - JWT refresh token to verify
     * @returns {Object} Decoded token payload
     * @throws {Error} If token is invalid or expired
     */
    verifyRefreshToken(token) {
        try {
            return jwt.verify(token, envConfig.jwt.refreshTokenSecret);
        } catch (error) {
            if (error.name === "TokenExpiredError") {
                throw new Error("Refresh token expired");
            }
            if (error.name === "JsonWebTokenError") {
                throw new Error("Invalid refresh token");
            }
            throw error;
        }
    }

    /**
     * Decode token without verification (for debugging)
     * @param {string} token - JWT token to decode
     * @returns {Object} Decoded token payload
     */
    decodeToken(token) {
        return jwt.decode(token);
    }
}

module.exports = new JWTUtil();
