const express = require("express");
const { body } = require("express-validator");
const { validate } = require("../../middlewares/validationMiddleware");
const authController = require("./auth.controller");
const { authenticate, authorize } = require("../../middlewares/authMiddleware");

const router = express.Router();

// Validation rules
const registerValidation = [
    body("username")
        .notEmpty().withMessage("Username is required")
        .isLength({ min: 3, max: 50 }).withMessage("Username must be 3-50 characters")
        .matches(/^[a-zA-Z0-9_]+$/).withMessage("Username can only contain letters, numbers, and underscores"),
    body("email")
        .notEmpty().withMessage("Email is required")
        .isEmail().withMessage("Invalid email format"),
    body("password")
        .notEmpty().withMessage("Password is required")
        .isLength({ min: 8 }).withMessage("Password must be at least 8 characters"),
    body("role")
        .optional()
        .isIn(["admin", "manager", "user", "viewer"]).withMessage("Invalid role")
];

const loginValidation = [
    body("email")
        .notEmpty().withMessage("Email is required")
        .isEmail().withMessage("Invalid email format"),
    body("password")
        .notEmpty().withMessage("Password is required")
];

const refreshTokenValidation = [
    body("refreshToken")
        .notEmpty().withMessage("Refresh token is required")
];

const changePasswordValidation = [
    body("oldPassword")
        .notEmpty().withMessage("Current password is required"),
    body("newPassword")
        .notEmpty().withMessage("New password is required")
        .isLength({ min: 8 }).withMessage("New password must be at least 8 characters")
];

// Public routes
router.post("/register", validate(registerValidation), authController.register);
router.post("/login", validate(loginValidation), authController.login);
router.post("/refresh-token", validate(refreshTokenValidation), authController.refreshToken);
router.post("/logout", authController.logout);

// Protected routes
router.get("/profile", authenticate, authController.getProfile);
router.post("/change-password", authenticate, validate(changePasswordValidation), authController.changePassword);
router.post("/logout-all", authenticate, authController.logoutAll);

// Admin only routes
router.get("/roles", authenticate, authorize("admin"), authController.getRoles);

module.exports = router;
