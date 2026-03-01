const authService = require("./auth.service");

class AuthController {
    /**
     * Register new user
     */
    register = async (req, res, next) => {
        try {
            const result = await authService.register(req.body);
            res.status(201).json({
                success: true,
                message: result.message,
                data: result.user
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Login user
     */
    login = async (req, res, next) => {
        try {
            const result = await authService.login(req.body);
            res.status(200).json({
                success: true,
                message: "Login successful",
                data: {
                    user: result.user,
                    accessToken: result.accessToken,
                    refreshToken: result.refreshToken,
                    expiresIn: result.expiresIn
                }
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Refresh access token
     */
    refreshToken = async (req, res, next) => {
        try {
            const { refreshToken } = req.body;
            const result = await authService.refreshToken(refreshToken);
            res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Logout user
     */
    logout = async (req, res, next) => {
        try {
            const { refreshToken } = req.body;
            const result = await authService.logout(refreshToken);
            res.status(200).json({
                success: true,
                message: result.message
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Logout from all devices
     */
    logoutAll = async (req, res, next) => {
        try {
            const result = await authService.logoutAll(req.user.id);
            res.status(200).json({
                success: true,
                message: result.message
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Get current user profile
     */
    getProfile = async (req, res, next) => {
        try {
            const user = await authService.getProfile(req.user.id);
            res.status(200).json({
                success: true,
                data: user
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Change password
     */
    changePassword = async (req, res, next) => {
        try {
            const { oldPassword, newPassword } = req.body;
            const result = await authService.changePassword(req.user.id, oldPassword, newPassword);
            res.status(200).json({
                success: true,
                message: result.message
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Get all roles (admin only)
     */
    getRoles = async (req, res, next) => {
        try {
            const roles = await authService.getAllRoles();
            res.status(200).json({
                success: true,
                data: roles
            });
        } catch (error) {
            next(error);
        }
    };
}

module.exports = new AuthController();
