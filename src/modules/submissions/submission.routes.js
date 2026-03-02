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
    body("status").optional().isIn(['New', 'In Review', 'Approved', 'Rejected']).withMessage("Invalid status")
];

const updateValidationRules = [
    body("title").optional().notEmpty().withMessage("Title cannot be logically empty").isString(),
    body("description").optional().notEmpty().withMessage("Description cannot be logically empty"),
    body("submitter_email").optional().isEmail().withMessage("Provide a valid email")
];

const statusValidationRules = [
    body("status").notEmpty().withMessage("Status is required").isIn(['New', 'In Review', 'Approved', 'Rejected']).withMessage("Invalid status")
];

const idValidationRule = [
    param("id").isInt().withMessage("ID must be an integer")
];

// All routes require authentication
router.use(authenticate);

// Create submission - all authenticated roles except viewer can create
router.post("/", authorize("user", "manager", "admin"), validate(submissionValidationRules), submissionController.createEntity);

// Get all submissions - all authenticated users can view
router.get("/", submissionController.getAllEntities);

// Get submission by ID - all authenticated users can view
router.get("/:id", validate(idValidationRule), submissionController.getEntityById);

// Update submission data - content can be edited by owner(user), manager, or admin
// Logic for status check (status must be 'New' for users) and lock check is in Service
router.put("/:id", authorize("user", "manager", "admin"), validate([...idValidationRule, ...updateValidationRules]), submissionController.updateEntity);

// Delete submission - admin only for now, logic for lock check is in Service
router.delete("/:id", authorize("admin"), validate(idValidationRule), submissionController.deleteEntity);

// Update submission status - manager and admin only
// Specific transition rules (New -> In Review for managers, In Review -> Approved/Rejected for admins) in Service
router.patch("/:id/status", authorize("manager", "admin"), validate([...idValidationRule, ...statusValidationRules]), submissionController.updateEntityStatus);

module.exports = router;
