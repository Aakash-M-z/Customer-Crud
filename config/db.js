const mysql = require("mysql2/promise");
require("dotenv").config();

let pool;

if (process.env.DATABASE_URL) {
    pool = mysql.createPool(process.env.DATABASE_URL);
} else {
    pool = mysql.createPool({
        host: "localhost",
        user: "root",
        password: "Aakash@420",
        database: "customer_db",
        port: 3306,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        multipleStatements: true
    });
}

module.exports = pool;