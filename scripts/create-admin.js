/**
 * Script to create admin user with custom password
 * Usage: node scripts/create-admin.js
 */

const bcrypt = require("bcryptjs");
const readline = require("readline");

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function createAdmin() {
    console.log("\n=== Create Admin User ===\n");

    rl.question("Enter admin username: ", (username) => {
        rl.question("Enter admin email: ", (email) => {
            rl.question("Enter admin password: ", async (password) => {
                try {
                    // Validate password
                    if (password.length < 8) {
                        console.error("\n❌ Password must be at least 8 characters long");
                        rl.close();
                        return;
                    }

                    // Hash password
                    const hash = await bcrypt.hash(password, 10);

                    console.log("\n✅ Admin user details:");
                    console.log(`Username: ${username}`);
                    console.log(`Email: ${email}`);
                    console.log(`Password Hash: ${hash}`);
                    console.log("\nRun this SQL to create the admin user:");
                    console.log(`
INSERT INTO users (username, email, password_hash, role_id) 
VALUES ('${username}', '${email}', '${hash}', 1)
ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash);
                    `);

                } catch (error) {
                    console.error("\n❌ Error:", error.message);
                } finally {
                    rl.close();
                }
            });
        });
    });
}

createAdmin();
