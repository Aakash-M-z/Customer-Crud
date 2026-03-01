const pool = require("../../config/db");

class CustomerRepository {
    async create(customer) {
        const { first_name, last_name, email, phone, address } = customer;
        const [result] = await pool.query(
            "INSERT INTO customers (first_name, last_name, email, phone, address) VALUES (?, ?, ?, ?, ?)",
            [first_name, last_name || null, email, phone || null, address || null]
        );
        return { id: result.insertId, ...customer };
    }

    async findAll() {
        const [rows] = await pool.query("SELECT * FROM customers ORDER BY created_at DESC");
        return rows;
    }

    async findById(id) {
        const [rows] = await pool.query("SELECT * FROM customers WHERE id = ?", [id]);
        return rows[0];
    }

    async findByEmail(email) {
        const [rows] = await pool.query("SELECT * FROM customers WHERE email = ?", [email]);
        return rows[0];
    }

    async update(id, customerData) {
        const excludeFields = ["id", "created_at"];
        let updateFields = [];
        let values = [];

        Object.keys(customerData).forEach((key) => {
            if (!excludeFields.includes(key) && customerData[key] !== undefined) {
                updateFields.push(`${key} = ?`);
                values.push(customerData[key]);
            }
        });

        if (updateFields.length === 0) return null;

        const setClause = updateFields.join(", ");
        values.push(id);

        const [result] = await pool.query(
            `UPDATE customers SET ${setClause} WHERE id = ?`,
            values
        );

        if (result.affectedRows === 0) return null;

        return this.findById(id);
    }

    async delete(id) {
        const [result] = await pool.query("DELETE FROM customers WHERE id = ?", [id]);
        return result.affectedRows > 0;
    }
}

module.exports = new CustomerRepository();
