const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const customerController = require("../controllers/customerController");

const customerValidation = [
    body("first_name").notEmpty().withMessage("First name required"),
    body("email").isEmail().withMessage("Valid email required"),
    body("phone")
        .optional()
        .matches(/^[0-9]{10}$/)
        .withMessage("Phone must be 10 digits")
];

router.get("/getCustomers", customerController.getCustomersForDataTable);
router.get("/api/customers", customerController.getAllCustomers);
router.get("/api/customers/:id", customerController.getCustomerById);
router.post("/api/customers", customerValidation, customerController.createCustomer);
router.put("/api/customers/:id", customerValidation, customerController.updateCustomer);
router.delete("/api/customers/:id", customerController.deleteCustomer);

module.exports = router;
