/**
 * Seed demo users for testing
 * Creates admin, manager, and user accounts
 */

const bcrypt = require('bcryptjs');
const pool = require('../src/config/db');

async function seedDemoUsers() {
    console.log('\n🌱 Seeding demo users...\n');

    try {
        // Demo users with their passwords
        const demoUsers = [
            {
                username: 'admin',
                email: 'admin@example.com',
                password: 'Admin@123',
                role: 'admin',
                description: 'Administrator with full access'
            },
            {
                username: 'manager',
                email: 'manager@example.com',
                password: 'Manager@123',
                role: 'manager',
                description: 'Manager who can manage submissions'
            },
            {
                username: 'user',
                email: 'user@example.com',
                password: 'User@123',
                role: 'user',
                description: 'Regular user who can create submissions'
            },
            {
                username: 'viewer',
                email: 'viewer@example.com',
                password: 'Viewer@123',
                role: 'viewer',
                description: 'Viewer with read-only access'
            }
        ];

        for (const user of demoUsers) {
            // Get role ID
            const [roleRows] = await pool.query(
                'SELECT id FROM roles WHERE name = ?',
                [user.role]
            );

            if (roleRows.length === 0) {
                console.log(`❌ Role '${user.role}' not found. Skipping ${user.username}`);
                continue;
            }

            const roleId = roleRows[0].id;

            // Check if user already exists
            const [existingUsers] = await pool.query(
                'SELECT id FROM users WHERE email = ?',
                [user.email]
            );

            // Hash password
            const passwordHash = await bcrypt.hash(user.password, 10);

            if (existingUsers.length > 0) {
                // Update existing user
                await pool.query(
                    'UPDATE users SET username = ?, password_hash = ?, role_id = ?, is_active = TRUE WHERE email = ?',
                    [user.username, passwordHash, roleId, user.email]
                );
                console.log(`✅ Updated: ${user.username} (${user.email}) - Role: ${user.role}`);
            } else {
                // Insert new user
                await pool.query(
                    'INSERT INTO users (username, email, password_hash, role_id, is_active) VALUES (?, ?, ?, ?, TRUE)',
                    [user.username, user.email, passwordHash, roleId]
                );
                console.log(`✅ Created: ${user.username} (${user.email}) - Role: ${user.role}`);
            }
        }

        console.log('\n📋 Demo User Credentials:\n');
        console.log('┌─────────────────────────────────────────────────────────┐');
        console.log('│ Role      │ Email                  │ Password      │');
        console.log('├─────────────────────────────────────────────────────────┤');
        demoUsers.forEach(user => {
            console.log(`│ ${user.role.padEnd(9)} │ ${user.email.padEnd(22)} │ ${user.password.padEnd(13)} │`);
        });
        console.log('└─────────────────────────────────────────────────────────┘\n');

        console.log('🎉 Demo users seeded successfully!\n');

    } catch (error) {
        console.error('❌ Error seeding demo users:', error);
        throw error;
    } finally {
        await pool.end();
    }
}

// Run the seeder
seedDemoUsers()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
