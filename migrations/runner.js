const pool = require("../src/config/db");
const fs = require("fs");
const path = require("path");

async function runMigrations() {
    console.log("Starting database migrations...");
    try {
        await pool.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        migration_name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

        const [rows] = await pool.query("SELECT migration_name FROM migrations");
        const executedMigrations = rows.map((row) => row.migration_name);

        const migrationsDir = __dirname;
        const files = fs.readdirSync(migrationsDir).filter((file) => file.endsWith(".sql")).sort();


        for (const file of files) {
            if (!executedMigrations.includes(file)) {
                console.log(`Executing migration: ${file}`);
                const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");

                await pool.query(sql);

                await pool.query("INSERT INTO migrations (migration_name) VALUES (?)", [file]);
                console.log(`Successfully applied: ${file}`);
            }
        }

        console.log("All migrations applied successfully.");
    } catch (error) {
        console.error("Migration failed:", error);
        throw error;
    }
}

module.exports = runMigrations;
