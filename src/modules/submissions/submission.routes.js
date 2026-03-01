const express = require("express");
const { body, param } = require("express-validator");
const { validate } = require("../../middlewares/validationMiddleware");
const submissionController = require("./submission.controller");
const { authenticate, authorize } = require("../../middlewares/authMiddleware");

const router = express.Router();

const submissionValidationRules = [
    body("title").notEmpty().withMessage("Title is required").isString().withMessage("Title must be a string"),
    body("description").notEmpty().withMessage("Description is required"),
    body("submitter_email").notEmpty().withMessage("Submitter email is required").isEmail().withMessage("Provide a valid email"),
    body("status").optional().isIn(['pending', 'in_progress', 'approved', 'rejected']).withMessage("Invalid status")
];

const updateValidationRules = [
    body("title").optional().notEmpty().withMessage("Title cannot be logically empty").isString(),
    body("description").optional().notEmpty().withMessage("Description cannot be logically empty"),
    body("submitter_email").optional().isEmail().withMessage("Provide a valid email"),
    body("status").optional().isIn(['pending', 'in_progress', 'approved', 'rejected']).withMessage("Invalid status")
];

const statusValidationRules = [
    body("status").notEmpty().withMessage("Status is required").isIn(['pending', 'in_progress', 'approved', 'rejected']).withMessage("Invalid status")
];

const idValidationRule = [
    param("id").isInt().withMessage("ID must be an integer")
];

// All routes require authentication
router.use(authenticate);

// Create submission - user, manager, admin (NOT viewer)
router.post("/", authorize("user", "manager", "admin"), validate(submissionValidationRules), submissionController.createEntity);

// Get all submissions - all authenticated users can view
router.get("/", submissionController.getAllEntities);

// Get submission by ID - all authenticated users can view
router.get("/:id", validate(idValidationRule), submissionController.getEntityById);

// Update submission - manager and admin only (NOT viewer or user)
router.put("/:id", authorize("manager", "admin"), validate([...idValidationRule, ...updateValidationRules]), submissionController.updateEntity);

// Delete submission - admin only (NOT viewer, user, or manager)
router.delete("/:id", authorize("admin"), validate(idValidationRule), submissionController.deleteEntity);

// Update submission status - manager and admin only (NOT viewer or user)
router.patch("/:id/status", authorize("manager", "admin"), validate([...idValidationRule, ...statusValidationRules]), submissionController.updateEntityStatus);

module.exports = router;
