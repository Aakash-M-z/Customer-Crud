const { validationResult } = require("express-validator");
const { AppError } = require("./errorMiddleware");

const validate = (validations) => {
    return async (req, res, next) => {
        // Run all validations
        await Promise.all(validations.map((validation) => validation.run(req)));

        const errors = validationResult(req);
        if (errors.isEmpty()) {
            return next();
        }

        const extractedErrors = [];
        errors.array().map((err) => extractedErrors.push({ [err.path]: err.msg }));

        res.status(422).json({
            success: false,
            errors: extractedErrors,
        });
    };
};

module.exports = { validate };
