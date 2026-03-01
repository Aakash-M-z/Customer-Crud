const customerRepository = require("./customer.repository");
const { AppError } = require("../../middlewares/errorMiddleware");

class CustomerService {
    async createCustomer(data) {
        const existingCustomer = await customerRepository.findByEmail(data.email);
        if (existingCustomer) {
            throw new AppError("Email already exists", 409);
        }

        const newCustomer = await customerRepository.create(data);
        return newCustomer;
    }

    async getAllCustomers() {
        return await customerRepository.findAll();
    }

    async getCustomerById(id) {
        const customer = await customerRepository.findById(id);
        if (!customer) {
            throw new AppError("Customer not found", 404);
        }
        return customer;
    }

    async updateCustomer(id, data) {
        const existingCustomer = await customerRepository.findById(id);
        if (!existingCustomer) {
            throw new AppError("Customer not found", 404);
        }

        if (data.email && data.email !== existingCustomer.email) {
            const emailExists = await customerRepository.findByEmail(data.email);
            if (emailExists) {
                throw new AppError("Email already exists", 409);
            }
        }

        const updatedCustomer = await customerRepository.update(id, data);
        return updatedCustomer;
    }

    async deleteCustomer(id) {
        const existingCustomer = await customerRepository.findById(id);
        if (!existingCustomer) {
            throw new AppError("Customer not found", 404);
        }

        const isDeleted = await customerRepository.delete(id);
        if (!isDeleted) {
            throw new AppError("Failed to delete customer", 500);
        }
    }
}

module.exports = new CustomerService();
