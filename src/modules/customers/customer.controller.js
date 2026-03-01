const customerService = require("./customer.service");

class CustomerController {
    createCustomer = async (req, res, next) => {
        try {
            const customer = await customerService.createCustomer(req.body);
            res.status(201).json({
                success: true,
                message: "Customer created successfully",
                data: customer,
            });
        } catch (error) {
            next(error);
        }
    };

    getAllCustomers = async (req, res, next) => {
        try {
            const customers = await customerService.getAllCustomers();
            res.status(200).json({
                success: true,
                data: customers,
            });
        } catch (error) {
            next(error);
        }
    };

    getCustomerById = async (req, res, next) => {
        try {
            const customer = await customerService.getCustomerById(req.params.id);
            res.status(200).json(customer);
        } catch (error) {
            next(error);
        }
    };

    updateCustomer = async (req, res, next) => {
        try {
            const customer = await customerService.updateCustomer(req.params.id, req.body);
            res.status(200).json({
                success: true,
                message: "Customer updated successfully",
                data: customer,
            });
        } catch (error) {
            next(error);
        }
    };

    deleteCustomer = async (req, res, next) => {
        try {
            await customerService.deleteCustomer(req.params.id);
            res.status(200).json({
                success: true,
                message: "Customer deleted successfully",
            });
        } catch (error) {
            next(error);
        }
    };
}

module.exports = new CustomerController();
