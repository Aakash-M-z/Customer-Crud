const mysql = require("mysql2/promise");

console.log("Database config init for Railway");

const pool = mysql.createPool({
    uri: process.env.DATABASE_URL,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    multipleStatements: true
});

module.exports = pool;