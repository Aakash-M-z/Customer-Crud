const runMigrations = require("./migrations/runner");

async function migrate() {
    try {
        await runMigrations();
        console.log("Migration script completed.");
        process.exit(0);
    } catch (err) {
        console.error("Migration script failed:", err);
        process.exit(1);
    }
}

migrate();
