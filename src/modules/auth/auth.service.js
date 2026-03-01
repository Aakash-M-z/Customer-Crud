const authRepository = require("./auth.repository");
const passwordUtil = require("../../utils/password");
const jwtUtil = require("../../utils/jwt");
const { AppError } = require("../../middlewares/errorMiddleware");
const envConfig = require("../../config/env");
const pool = require("../../config/db");

class AuthService {
    /**
     * Register new user
     */
    async register(userData) {
        const { username, email, password, role } = userData;

        // Validate password strength
        const passwordValidation = passwordUtil.validateStrength(password);
        if (!passwordValidation.isValid) {
            throw new AppError(passwordValidation.errors.join(", "), 400);
        }

        // Check if user already exists
        const existingUserByEmail = await authRepository.findByEmail(email);
        if (existingUserByEmail) {
            throw new AppError("Email already registered", 409);
        }

        const existingUserByUsername = await authRepository.findByUsername(username);
        if (existingUserByUsername) {
            throw new AppError("Username already taken", 409);
        }

        // Get role ID
        const roleData = await authRepository.getRoleByName(role || "user");
        if (!roleData) {
            throw new AppError("Invalid role specified", 400);
        }

        // Hash password
        const password_hash = await passwordUtil.hash(password);

        // Create user
        const user = await authRepository.create({
            username,
            email,
            password_hash,
            role_id: roleData.id
        });

        // Remove sensitive data
        delete user.password_hash;

        return {
            user,
            message: "User registered successfully"
        };
    }

    /**
     * Login user
     */
    async login(credentials) {
        const { email, password } = credentials;

        // Find user
        const user = await authRepository.findByEmail(email);
        if (!user) {
            throw new AppError("Invalid email or password", 401);
        }

        // Check if user is active
        if (!user.is_active) {
            throw new AppError("Account is deactivated. Please contact administrator", 403);
        }

        // Verify password
        const isPasswordValid = await passwordUtil.compare(password, user.password_hash);
        if (!isPasswordValid) {
            throw new AppError("Invalid email or password", 401);
        }

        // Update last login
        await authRepository.updateLastLogin(user.id);

        // Generate tokens
        const tokenPayload = {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role_name,
            roleId: user.role_id
        };

        const accessToken = jwtUtil.generateAccessToken(tokenPayload);
        const refreshToken = jwtUtil.generateRefreshToken({ id: user.id });

        // Store refresh token
        const refreshTokenExpiry = new Date();
        refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 7); // 7 days
        await authRepository.storeRefreshToken(user.id, refreshToken, refreshTokenExpiry);

        // Remove sensitive data
        delete user.password_hash;

        return {
            user,
            accessToken,
            refreshToken,
            expiresIn: envConfig.jwt.accessTokenExpiry
        };
    }

    /**
     * Refresh access token
     */
    async refreshToken(refreshToken) {
        // Verify refresh token
        let decoded;
        try {
            decoded = jwtUtil.verifyRefreshToken(refreshToken);
        } catch (error) {
            throw new AppError(error.message, 401);
        }

        // Check if token exists in database
        const tokenRecord = await authRepository.findRefreshToken(refreshToken);
        if (!tokenRecord) {
            throw new AppError("Invalid refresh token", 401);
        }

        // Get user
        const user = await authRepository.findById(decoded.id);
        if (!user) {
            throw new AppError("User not found", 404);
        }

        if (!user.is_active) {
            throw new AppError("Account is deactivated", 403);
        }

        // Generate new access token
        const tokenPayload = {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role_name,
            roleId: user.role_id
        };

        const accessToken = jwtUtil.generateAccessToken(tokenPayload);

        return {
            accessToken,
            expiresIn: envConfig.jwt.accessTokenExpiry
        };
    }

    /**
     * Logout user
     */
    async logout(refreshToken) {
        if (refreshToken) {
            await authRepository.deleteRefreshToken(refreshToken);
        }
        return { message: "Logged out successfully" };
    }

    /**
     * Logout from all devices
     */
    async logoutAll(userId) {
        await authRepository.deleteAllUserTokens(userId);
        return { message: "Logged out from all devices successfully" };
    }

    /**
     * Get current user profile
     */
    async getProfile(userId) {
        const user = await authRepository.findById(userId);
        if (!user) {
            throw new AppError("User not found", 404);
        }

        delete user.password_hash;
        return user;
    }

    /**
     * Change password
     */
    async changePassword(userId, oldPassword, newPassword) {
        const user = await authRepository.findById(userId);
        if (!user) {
            throw new AppError("User not found", 404);
        }

        // Verify old password
        const isPasswordValid = await passwordUtil.compare(oldPassword, user.password_hash);
        if (!isPasswordValid) {
            throw new AppError("Current password is incorrect", 401);
        }

        // Validate new password strength
        const passwordValidation = passwordUtil.validateStrength(newPassword);
        if (!passwordValidation.isValid) {
            throw new AppError(passwordValidation.errors.join(", "), 400);
        }

        // Hash new password
        const password_hash = await passwordUtil.hash(newPassword);

        // Update password
        await pool.query(
            "UPDATE users SET password_hash = ? WHERE id = ?",
            [password_hash, userId]
        );

        // Logout from all devices for security
        await authRepository.deleteAllUserTokens(userId);

        return { message: "Password changed successfully. Please login again." };
    }

    /**
     * Get all roles (admin only)
     */
    async getAllRoles() {
        return await authRepository.getAllRoles();
    }
}

module.exports = new AuthService();
