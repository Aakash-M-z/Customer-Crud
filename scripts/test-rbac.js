/**
 * RBAC System Test Script
 * Tests authentication and authorization flows
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';
let adminToken = '';
let userToken = '';

// Helper function to make HTTP requests
function makeRequest(method, path, data = null, token = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, BASE_URL);
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }

        const req = http.request(url, options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    resolve({
                        status: res.statusCode,
                        data: JSON.parse(body)
                    });
                } catch (e) {
                    resolve({
                        status: res.statusCode,
                        data: body
                    });
                }
            });
        });

        req.on('error', reject);

        if (data) {
            req.write(JSON.stringify(data));
        }

        req.end();
    });
}

// Test functions
async function testAdminLogin() {
    console.log('\n📝 Test 1: Admin Login');
    try {
        const response = await makeRequest('POST', '/api/auth/login', {
            email: 'admin@example.com',
            password: 'Admin@123'
        });

        if (response.status === 200 && response.data.success) {
            adminToken = response.data.data.accessToken;
            console.log('✅ Admin login successful');
            console.log(`   Token: ${adminToken.substring(0, 20)}...`);
            return true;
        } else {
            console.log('❌ Admin login failed:', response.data.message);
            return false;
        }
    } catch (error) {
        console.log('❌ Error:', error.message);
        return false;
    }
}

async function testUserRegistration() {
    console.log('\n📝 Test 2: User Registration');
    try {
        const response = await makeRequest('POST', '/api/auth/register', {
            username: 'testuser_' + Date.now(),
            email: `testuser_${Date.now()}@example.com`,
            password: 'Test@123',
            role: 'user'
        });

        if (response.status === 201 && response.data.success) {
            console.log('✅ User registration successful');
            console.log(`   User ID: ${response.data.data.id}`);
            return true;
        } else {
            console.log('❌ User registration failed:', response.data.message);
            return false;
        }
    } catch (error) {
        console.log('❌ Error:', error.message);
        return false;
    }
}

async function testGetProfile() {
    console.log('\n📝 Test 3: Get Profile (Authenticated)');
    try {
        const response = await makeRequest('GET', '/api/auth/profile', null, adminToken);

        if (response.status === 200 && response.data.success) {
            console.log('✅ Profile retrieved successfully');
            console.log(`   Username: ${response.data.data.username}`);
            console.log(`   Role: ${response.data.data.role_name}`);
            return true;
        } else {
            console.log('❌ Get profile failed:', response.data.message);
            return false;
        }
    } catch (error) {
        console.log('❌ Error:', error.message);
        return false;
    }
}

async function testUnauthorizedAccess() {
    console.log('\n📝 Test 4: Unauthorized Access (No Token)');
    try {
        const response = await makeRequest('GET', '/api/submissions');

        if (response.status === 401) {
            console.log('✅ Correctly rejected unauthorized request');
            return true;
        } else {
            console.log('❌ Should have rejected unauthorized request');
            return false;
        }
    } catch (error) {
        console.log('❌ Error:', error.message);
        return false;
    }
}

async function testAuthorizedAccess() {
    console.log('\n📝 Test 5: Authorized Access (With Token)');
    try {
        const response = await makeRequest('GET', '/api/submissions', null, adminToken);

        if (response.status === 200 && response.data.success) {
            console.log('✅ Authorized request successful');
            console.log(`   Submissions count: ${response.data.data.length}`);
            return true;
        } else {
            console.log('❌ Authorized request failed:', response.data.message);
            return false;
        }
    } catch (error) {
        console.log('❌ Error:', error.message);
        return false;
    }
}

async function testCreateSubmission() {
    console.log('\n📝 Test 6: Create Submission (Admin)');
    try {
        const response = await makeRequest('POST', '/api/submissions', {
            title: 'Test Submission',
            description: 'Testing RBAC system',
            submitter_email: 'admin@example.com',
            status: 'pending'
        }, adminToken);

        if (response.status === 201 && response.data.success) {
            console.log('✅ Submission created successfully');
            console.log(`   Submission ID: ${response.data.data.id}`);
            return true;
        } else {
            console.log('❌ Create submission failed:', response.data.message);
            return false;
        }
    } catch (error) {
        console.log('❌ Error:', error.message);
        return false;
    }
}

async function testInvalidToken() {
    console.log('\n📝 Test 7: Invalid Token');
    try {
        const response = await makeRequest('GET', '/api/submissions', null, 'invalid-token');

        if (response.status === 401) {
            console.log('✅ Correctly rejected invalid token');
            return true;
        } else {
            console.log('❌ Should have rejected invalid token');
            return false;
        }
    } catch (error) {
        console.log('❌ Error:', error.message);
        return false;
    }
}

async function testGetRoles() {
    console.log('\n📝 Test 8: Get Roles (Admin Only)');
    try {
        const response = await makeRequest('GET', '/api/auth/roles', null, adminToken);

        if (response.status === 200 && response.data.success) {
            console.log('✅ Roles retrieved successfully');
            console.log(`   Roles count: ${response.data.data.length}`);
            response.data.data.forEach(role => {
                console.log(`   - ${role.name}: ${role.description}`);
            });
            return true;
        } else {
            console.log('❌ Get roles failed:', response.data.message);
            return false;
        }
    } catch (error) {
        console.log('❌ Error:', error.message);
        return false;
    }
}

// Run all tests
async function runTests() {
    console.log('🚀 Starting RBAC System Tests...');
    console.log('='.repeat(50));

    const tests = [
        testAdminLogin,
        testUserRegistration,
        testGetProfile,
        testUnauthorizedAccess,
        testAuthorizedAccess,
        testCreateSubmission,
        testInvalidToken,
        testGetRoles
    ];

    let passed = 0;
    let failed = 0;

    for (const test of tests) {
        const result = await test();
        if (result) {
            passed++;
        } else {
            failed++;
        }
        await new Promise(resolve => setTimeout(resolve, 500)); // Small delay between tests
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 Test Results:');
    console.log(`   ✅ Passed: ${passed}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`   📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
    console.log('='.repeat(50));

    if (failed === 0) {
        console.log('\n🎉 All tests passed! RBAC system is working correctly.');
    } else {
        console.log('\n⚠️  Some tests failed. Please check the errors above.');
    }
}

// Check if server is running
async function checkServer() {
    try {
        const response = await makeRequest('GET', '/health');
        if (response.status === 200) {
            console.log('✅ Server is running');
            return true;
        }
    } catch (error) {
        console.log('❌ Server is not running. Please start the server first:');
        console.log('   npm start');
        return false;
    }
}

// Main execution
(async () => {
    const serverRunning = await checkServer();
    if (serverRunning) {
        await runTests();
    }
    process.exit(0);
})();
