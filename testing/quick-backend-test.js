// Quick Backend Route Testing
// This helps verify if the new routes are properly integrated
// Run with: node testing/quick-backend-test.js

const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function checkServerHealth() {
  console.log('🏥 Checking server health...');

  try {
    const response = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Server is healthy:', response.data);
    return true;
  } catch (error) {
    // Try alternative health endpoints
    try {
      const response = await axios.get(`${BASE_URL}/`);
      console.log('✅ Server is responding');
      return true;
    } catch (altError) {
      console.log('❌ Server health check failed:', error.message);
      return false;
    }
  }
}

async function checkAuthEndpoint() {
  console.log('\n🔐 Testing authentication endpoint...');

  try {
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'admin@company.com',
      password: 'admin123'
    });

    if (response.data.token) {
      console.log('✅ Authentication endpoint working');
      return response.data.token;
    } else {
      console.log('⚠️  Authentication endpoint responded but no token received');
      return null;
    }
  } catch (error) {
    console.log('❌ Authentication failed:', error.response?.data?.message || error.message);
    return null;
  }
}

async function checkNewRoutes(token) {
  console.log('\n🛣️  Checking new route availability...');

  const routes = [
    { path: '/api/clients', method: 'GET', description: 'Client Management' },
    { path: '/api/dashboard', method: 'GET', description: 'Dashboard Data' },
    { path: '/api/billing/dashboard', method: 'GET', description: 'Billing Dashboard' },
    { path: '/api/billing/summary', method: 'GET', description: 'Billing Summary' }
  ];

  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  for (const route of routes) {
    try {
      let response;

      if (route.method === 'GET') {
        response = await axios.get(`${BASE_URL}${route.path}`, { headers });
      } else if (route.method === 'POST') {
        response = await axios.post(`${BASE_URL}${route.path}`, {}, { headers });
      }

      console.log(`✅ ${route.description}: ${route.path} (${response.status})`);
    } catch (error) {
      const status = error.response?.status;
      const message = error.response?.data?.message || error.message;

      if (status === 404) {
        console.log(`❌ ${route.description}: Route not found - ${route.path}`);
      } else if (status === 403) {
        console.log(`⚠️  ${route.description}: Access denied (this might be expected) - ${route.path}`);
      } else if (status === 401) {
        console.log(`⚠️  ${route.description}: Unauthorized (auth might be required) - ${route.path}`);
      } else {
        console.log(`❓ ${route.description}: ${status || 'Error'} - ${message}`);
      }
    }
  }
}

async function checkDatabaseTables() {
  console.log('\n🗄️  Checking if enhanced routes return data...');

  // This would require a database connection, but we can infer from API responses
  console.log('Note: Database structure check would require direct DB access');
  console.log('API responses above indicate if data is properly accessible');
}

async function generateQuickReport() {
  console.log('\n📋 QUICK INTEGRATION REPORT');
  console.log('='.repeat(50));

  const serverHealthy = await checkServerHealth();

  if (!serverHealthy) {
    console.log('❌ Cannot proceed - server is not responding');
    console.log('\n🔧 TROUBLESHOOTING STEPS:');
    console.log('1. Make sure backend server is running: npm start in backend directory');
    console.log('2. Check if port 3001 is available');
    console.log('3. Verify database connection in backend');
    console.log('4. Check for any startup errors in server logs');
    return;
  }

  const token = await checkAuthEndpoint();

  if (!token) {
    console.log('\n⚠️  Authentication not working - some tests will be limited');
    console.log('Check user database and password hashing');
  }

  await checkNewRoutes(token);
  await checkDatabaseTables();

  console.log('\n🎯 NEXT STEPS:');
  console.log('1. If routes show 404 errors, add them to your main Express app:');
  console.log('   app.use("/api/clients", require("./routes/client"));');
  console.log('   app.use("/api/dashboard", require("./routes/dashboard"));');
  console.log('');
  console.log('2. If auth is working, run full tests:');
  console.log('   cd testing && npm run test:api');
  console.log('');
  console.log('3. For frontend testing:');
  console.log('   Make sure frontend is running, then:');
  console.log('   cd testing && npm run test:frontend');
}

// Run the quick integration test
generateQuickReport().catch(console.error);