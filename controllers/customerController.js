const pool = require("../config/db");
const { validationResult } = require("express-validator");

exports.getAllCustomers = async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM customers ORDER BY created_at ASC");
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
};

exports.getCustomersForDataTable = async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM customers ORDER BY created_at ASC");
        res.json({ data: rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

exports.getCustomerById = async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM customers WHERE id=?", [req.params.id]);
        if (!rows.length) return res.status(404).json({ error: "Not found" });
        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
};

exports.createCustomer = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    const { first_name, last_name, email, phone, address } = req.body;

    try {
        const sql = `INSERT INTO customers (first_name,last_name,email,phone,address)
                 VALUES (?,?,?,?,?)`;
        await pool.query(sql, [first_name, last_name, email, phone, address]);
        res.json({ message: "Customer added" });
    } catch (err) {
        if (err.code === "ER_DUP_ENTRY")
            return res.status(409).json({ error: "Email already exists" });
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
};

exports.updateCustomer = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    const { first_name, last_name, email, phone, address } = req.body;

    try {
        await pool.query(
            `UPDATE customers SET first_name=?,last_name=?,email=?,phone=?,address=? WHERE id=?`,
            [first_name, last_name, email, phone, address, req.params.id]
        );

        res.json({ message: "Customer updated" });
    } catch (err) {
        if (err.code === "ER_DUP_ENTRY")
            return res.status(409).json({ error: "Email already exists" });
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
};

exports.deleteCustomer = async (req, res) => {
    try {
        await pool.query("DELETE FROM customers WHERE id=?", [req.params.id]);
        res.json({ message: "Customer deleted" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
};
