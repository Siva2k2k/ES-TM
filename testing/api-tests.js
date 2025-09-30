// API Testing Script for Enhanced Features
// Run with: node testing/api-tests.js

const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';
const TEST_USERS = {
  super_admin: { email: 'admin@company.com', password: 'admin123' },
  management: { email: 'management@company.com', password: 'admin123' },
  manager: { email: 'manager@company.com', password: 'admin123' },
  lead: { email: 'lead@company.com', password: 'admin123' },
  employee: { email: 'employee1@company.com', password: 'admin123' }
};

class APITester {
  constructor() {
    this.tokens = {};
    this.testResults = [];
  }

  async login(role) {
    try {
      const response = await axios.post(`${BASE_URL}/auth/login`, TEST_USERS[role]);
      this.tokens[role] = response.data.token;
      this.logResult('LOGIN', role, 'SUCCESS', `Token obtained for ${role}`);
      return true;
    } catch (error) {
      this.logResult('LOGIN', role, 'FAILED', error.response?.data?.message || error.message);
      return false;
    }
  }

  async testBillingEndpoints(role) {
    const token = this.tokens[role];
    const headers = { Authorization: `Bearer ${token}` };

    // Test 1: Get Billing Dashboard
    try {
      const response = await axios.get(`${BASE_URL}/billing/dashboard`, { headers });
      this.logResult('BILLING_DASHBOARD', role, 'SUCCESS', `Status: ${response.status}`);
    } catch (error) {
      const expected = ['manager', 'lead', 'employee'].includes(role);
      const status = expected && error.response?.status === 403 ? 'SUCCESS' : 'FAILED';
      this.logResult('BILLING_DASHBOARD', role, status, `Status: ${error.response?.status} (Expected: ${expected ? '403' : '200'})`);
    }

    // Test 2: Get Billing Summary
    try {
      const response = await axios.get(`${BASE_URL}/billing/summary?period=weekly&filterType=project`, { headers });
      this.logResult('BILLING_SUMMARY', role, 'SUCCESS', `Status: ${response.status}, Entries: ${response.data.summary?.entries?.length || 0}`);
    } catch (error) {
      const expected = ['lead', 'employee'].includes(role);
      const status = expected && error.response?.status === 403 ? 'SUCCESS' : 'FAILED';
      this.logResult('BILLING_SUMMARY', role, status, `Status: ${error.response?.status}`);
    }

    // Test 3: Update Billable Hours (Management only)
    try {
      // This would need a real entry ID, so we'll simulate
      const response = await axios.patch(`${BASE_URL}/billing/hours/test-entry-id`,
        { hours: 8.5 }, { headers });
      this.logResult('UPDATE_HOURS', role, 'SUCCESS', `Status: ${response.status}`);
    } catch (error) {
      const expected = !['super_admin', 'management'].includes(role);
      const status = expected && error.response?.status === 403 ? 'SUCCESS' : 'NEEDS_REAL_DATA';
      this.logResult('UPDATE_HOURS', role, status, `Status: ${error.response?.status}`);
    }
  }

  async testClientEndpoints(role) {
    const token = this.tokens[role];
    const headers = { Authorization: `Bearer ${token}` };

    // Test 1: Get All Clients
    try {
      const response = await axios.get(`${BASE_URL}/clients`, { headers });
      this.logResult('GET_CLIENTS', role, 'SUCCESS', `Status: ${response.status}, Count: ${response.data.data?.length || 0}`);
    } catch (error) {
      this.logResult('GET_CLIENTS', role, 'FAILED', `Status: ${error.response?.status}`);
    }

    // Test 2: Create Client (Management only)
    try {
      const clientData = {
        name: `Test Client ${Date.now()}`,
        contact_person: 'Test Person',
        contact_email: 'test@example.com',
        is_active: true
      };
      const response = await axios.post(`${BASE_URL}/clients`, clientData, { headers });
      this.logResult('CREATE_CLIENT', role, 'SUCCESS', `Status: ${response.status}, Client: ${response.data.data?.name}`);

      // Clean up - delete the test client
      if (response.data.data?.id) {
        try {
          await axios.delete(`${BASE_URL}/clients/${response.data.data.id}`, { headers });
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    } catch (error) {
      const expected = !['super_admin', 'management'].includes(role);
      const status = expected && error.response?.status === 403 ? 'SUCCESS' : 'FAILED';
      this.logResult('CREATE_CLIENT', role, status, `Status: ${error.response?.status} (Expected: ${expected ? '403' : '201'})`);
    }

    // Test 3: Get Client Stats
    try {
      const response = await axios.get(`${BASE_URL}/clients/stats`, { headers });
      this.logResult('CLIENT_STATS', role, 'SUCCESS', `Status: ${response.status}`);
    } catch (error) {
      this.logResult('CLIENT_STATS', role, 'FAILED', `Status: ${error.response?.status}`);
    }
  }

  async testDashboardEndpoints(role) {
    const token = this.tokens[role];
    const headers = { Authorization: `Bearer ${token}` };

    // Test 1: Get Role-Specific Dashboard
    try {
      const response = await axios.get(`${BASE_URL}/dashboard`, { headers });
      this.logResult('ROLE_DASHBOARD', role, 'SUCCESS', `Status: ${response.status}, Role: ${response.data.role}`);
    } catch (error) {
      this.logResult('ROLE_DASHBOARD', role, 'FAILED', `Status: ${error.response?.status}`);
    }

    // Test 2: Get Specific Role Dashboard
    const roleEndpoints = {
      super_admin: 'super-admin',
      management: 'management',
      manager: 'manager',
      lead: 'lead',
      employee: 'employee'
    };

    try {
      const response = await axios.get(`${BASE_URL}/dashboard/${roleEndpoints[role]}`, { headers });
      this.logResult('SPECIFIC_DASHBOARD', role, 'SUCCESS', `Status: ${response.status}`);
    } catch (error) {
      this.logResult('SPECIFIC_DASHBOARD', role, 'FAILED', `Status: ${error.response?.status}`);
    }

    // Test 3: Try to access wrong role dashboard
    const wrongRole = role === 'super_admin' ? 'employee' : 'super_admin';
    try {
      const response = await axios.get(`${BASE_URL}/dashboard/${roleEndpoints[wrongRole]}`, { headers });
      this.logResult('WRONG_DASHBOARD', role, 'FAILED', `Should not access ${wrongRole} dashboard`);
    } catch (error) {
      const status = error.response?.status === 403 ? 'SUCCESS' : 'FAILED';
      this.logResult('WRONG_DASHBOARD', role, status, `Status: ${error.response?.status} (Expected: 403)`);
    }
  }

  logResult(test, role, status, details) {
    const result = {
      timestamp: new Date().toISOString(),
      test,
      role,
      status,
      details
    };
    this.testResults.push(result);

    const statusColor = status === 'SUCCESS' ? '\x1b[32m' : status === 'FAILED' ? '\x1b[31m' : '\x1b[33m';
    console.log(`${statusColor}[${status}]\x1b[0m ${test} - ${role}: ${details}`);
  }

  async runAllTests() {
    console.log('🚀 Starting Comprehensive API Testing...\n');

    // Step 1: Login all users
    console.log('📝 Step 1: Authentication Tests');
    for (const role of Object.keys(TEST_USERS)) {
      await this.login(role);
    }

    // Step 2: Test Billing Endpoints
    console.log('\n💰 Step 2: Billing Management Tests');
    for (const role of Object.keys(TEST_USERS)) {
      if (this.tokens[role]) {
        await this.testBillingEndpoints(role);
      }
    }

    // Step 3: Test Client Endpoints
    console.log('\n🏢 Step 3: Client Management Tests');
    for (const role of Object.keys(TEST_USERS)) {
      if (this.tokens[role]) {
        await this.testClientEndpoints(role);
      }
    }

    // Step 4: Test Dashboard Endpoints
    console.log('\n📊 Step 4: Dashboard Tests');
    for (const role of Object.keys(TEST_USERS)) {
      if (this.tokens[role]) {
        await this.testDashboardEndpoints(role);
      }
    }

    // Generate Report
    this.generateReport();
  }

  generateReport() {
    console.log('\n📋 TEST REPORT');
    console.log('=' * 50);

    const summary = {
      total: this.testResults.length,
      success: this.testResults.filter(r => r.status === 'SUCCESS').length,
      failed: this.testResults.filter(r => r.status === 'FAILED').length,
      needs_data: this.testResults.filter(r => r.status === 'NEEDS_REAL_DATA').length
    };

    console.log(`Total Tests: ${summary.total}`);
    console.log(`✅ Passed: ${summary.success}`);
    console.log(`❌ Failed: ${summary.failed}`);
    console.log(`⚠️  Needs Real Data: ${summary.needs_data}`);
    console.log(`Success Rate: ${((summary.success / summary.total) * 100).toFixed(1)}%`);

    // Group by role
    console.log('\n📊 Results by Role:');
    const roleGroups = {};
    this.testResults.forEach(result => {
      if (!roleGroups[result.role]) {
        roleGroups[result.role] = { success: 0, failed: 0, total: 0 };
      }
      roleGroups[result.role].total++;
      if (result.status === 'SUCCESS') roleGroups[result.role].success++;
      else if (result.status === 'FAILED') roleGroups[result.role].failed++;
    });

    Object.entries(roleGroups).forEach(([role, stats]) => {
      console.log(`${role}: ${stats.success}/${stats.total} passed`);
    });

    // Save detailed results
    const fs = require('fs');
    fs.writeFileSync('test-results.json', JSON.stringify({
      summary,
      roleGroups,
      detailedResults: this.testResults
    }, null, 2));

    console.log('\n💾 Detailed results saved to test-results.json');
  }
}

// Run tests
const tester = new APITester();
tester.runAllTests().catch(console.error);

module.exports = APITester;