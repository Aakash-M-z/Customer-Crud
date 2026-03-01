const jwtUtil = require("../utils/jwt");
const { AppError } = require("./errorMiddleware");

/**
 * Middleware to authenticate JWT token
 */
const authenticate = (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            throw new AppError("No token provided. Authorization header must be 'Bearer <token>'", 401);
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        // Verify token
        const decoded = jwtUtil.verifyAccessToken(token);

        // Attach user info to request
        req.user = {
            id: decoded.id,
            username: decoded.username,
            email: decoded.email,
            role: decoded.role,
            roleId: decoded.roleId
        };

        next();
    } catch (error) {
        if (error instanceof AppError) {
            next(error);
        } else {
            next(new AppError(error.message || "Authentication failed", 401));
        }
    }
};

/**
 * Middleware to authorize based on roles
 * @param {Array<string>} allowedRoles - Array of role names that are allowed
 */
const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                throw new AppError("User not authenticated", 401);
            }

            if (!allowedRoles.includes(req.user.role)) {
                throw new AppError(
                    `Access denied. Required roles: ${allowedRoles.join(", ")}. Your role: ${req.user.role}`,
                    403
                );
            }

            next();
        } catch (error) {
            next(error);
        }
    };
};

/**
 * Middleware to check if user owns the resource
 * @param {string} paramName - Name of the parameter containing the user ID
 */
const authorizeOwner = (paramName = "id") => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                throw new AppError("User not authenticated", 401);
            }

            const resourceUserId = parseInt(req.params[paramName]);

            // Admin can access any resource
            if (req.user.role === "admin") {
                return next();
            }

            // Check if user owns the resource
            if (req.user.id !== resourceUserId) {
                throw new AppError("Access denied. You can only access your own resources", 403);
            }

            next();
        } catch (error) {
            next(error);
        }
    };
};

/**
 * Optional authentication - doesn't fail if no token provided
 */
const optionalAuth = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith("Bearer ")) {
            const token = authHeader.substring(7);
            const decoded = jwtUtil.verifyAccessToken(token);

            req.user = {
                id: decoded.id,
                username: decoded.username,
                email: decoded.email,
                role: decoded.role,
                roleId: decoded.roleId
            };
        }

        next();
    } catch (error) {
        // Continue without authentication
        next();
    }
};

module.exports = {
    authenticate,
    authorize,
    authorizeOwner,
    optionalAuth
};
