const express = require("express");
const { body, param } = require("express-validator");
const { validate } = require("../../middlewares/validationMiddleware");
const submissionController = require("./submission.controller");

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

router.post("/", validate(submissionValidationRules), submissionController.createEntity);
router.get("/", submissionController.getAllEntities);
router.get("/:id", validate(idValidationRule), submissionController.getEntityById);
router.put("/:id", validate([...idValidationRule, ...updateValidationRules]), submissionController.updateEntity);
router.delete("/:id", validate(idValidationRule), submissionController.deleteEntity);
router.patch("/:id/status", validate([...idValidationRule, ...statusValidationRules]), submissionController.updateEntityStatus);

module.exports = router;
