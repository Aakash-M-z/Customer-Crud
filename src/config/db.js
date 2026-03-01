const mysql = require("mysql2/promise");
const envConfig = require("./env");
const logger = require("../utils/logger");

let pool;

try {
    if (envConfig.databaseUrl) {
        pool = mysql.createPool(envConfig.databaseUrl);
    } else {
        pool = mysql.createPool(envConfig.dbConfig);
    }
    logger.info("Database pool created successfully");
} catch (error) {
    logger.error("Error creating database pool:", error);
    process.exit(1);
}

module.exports = pool;
