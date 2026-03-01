const crypto = require("crypto");

/**
 * Generate secure random secrets for JWT tokens
 */
function generateSecrets() {
    const accessSecret = crypto.randomBytes(64).toString("hex");
    const refreshSecret = crypto.randomBytes(64).toString("hex");

    console.log("\n=== JWT Secrets Generated ===\n");
    console.log("Add these to your .env file:\n");
    console.log(`JWT_ACCESS_SECRET=${accessSecret}`);
    console.log(`JWT_REFRESH_SECRET=${refreshSecret}`);
    console.log("\n⚠️  Keep these secrets safe and never commit them to version control!\n");
}

generateSecrets();
