const express = require("express");
const { body, param } = require("express-validator");
const { validate } = require("../../middlewares/validationMiddleware");
const customerController = require("./customer.controller");
const { authenticate, authorize } = require("../../middlewares/authMiddleware");

const router = express.Router();

const customerValidationRules = [
    body("first_name").notEmpty().withMessage("First name is required").isString().withMessage("First name must be a string"),
    body("last_name").optional().isString().withMessage("Last name must be a string"),
    body("email").notEmpty().withMessage("Email is required").isEmail().withMessage("Provide a valid email"),
    body("phone").optional().matches(/^\d{10}$/).withMessage("Phone must be 10 digits"),
    body("address").optional().isString().withMessage("Address must be a string")
];

const updateValidationRules = [
    body("first_name").optional().notEmpty().withMessage("First name cannot be empty").isString(),
    body("last_name").optional().isString().withMessage("Last name must be a string"),
    body("email").optional().isEmail().withMessage("Provide a valid email"),
    body("phone").optional().matches(/^\d{10}$/).withMessage("Phone must be 10 digits"),
    body("address").optional().isString().withMessage("Address must be a string")
];

const idValidationRule = [
    param("id").isInt().withMessage("ID must be an integer")
];

// All routes require authentication
router.use(authenticate);

// Create customer - user, manager, admin (NOT viewer)
router.post("/", authorize("user", "manager", "admin"), validate(customerValidationRules), customerController.createCustomer);

// Get all customers - all authenticated users can view
router.get("/", customerController.getAllCustomers);

// Get customer by ID - all authenticated users can view
router.get("/:id", validate(idValidationRule), customerController.getCustomerById);

// Update customer - manager and admin only (NOT viewer or user)
router.put("/:id", authorize("manager", "admin"), validate([...idValidationRule, ...updateValidationRules]), customerController.updateCustomer);

// Delete customer - admin only (NOT viewer, user, or manager)
router.delete("/:id", authorize("admin"), validate(idValidationRule), customerController.deleteCustomer);

module.exports = router;
