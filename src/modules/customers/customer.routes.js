const express = require("express");
const { body, param } = require("express-validator");
const { validate } = require("../../middlewares/validationMiddleware");
const customerController = require("./customer.controller");

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

router.post("/", validate(customerValidationRules), customerController.createCustomer);
router.get("/", customerController.getAllCustomers);
router.get("/:id", validate(idValidationRule), customerController.getCustomerById);
router.put("/:id", validate([...idValidationRule, ...updateValidationRules]), customerController.updateCustomer);
router.delete("/:id", validate(idValidationRule), customerController.deleteCustomer);

module.exports = router;
