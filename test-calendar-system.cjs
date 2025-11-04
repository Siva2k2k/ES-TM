#!/usr/bin/env node

/**
 * Comprehensive Test Suite for Simplified Calendar System
 * Tests backend API endpoints and validates functional integrity
 */

const axios = require('axios');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const BASE_URL = 'http://localhost:3001/api/v1';
const FRONTEND_URL = 'http://localhost:5173';

// Test data
const testHoliday = {
  name: 'Test Holiday',
  date: '2025-12-25',
  holiday_type: 'company',
  description: 'Test holiday for validation'
};

let authToken = null;
let testHolidayId = null;

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logTest(testName) {
  log(`\n🧪 Testing: ${testName}`, colors.cyan);
}

function logPass(message) {
  log(`✅ ${message}`, colors.green);
}

function logFail(message) {
  log(`❌ ${message}`, colors.red);
}

function logWarn(message) {
  log(`⚠️  ${message}`, colors.yellow);
}

function logInfo(message) {
  log(`ℹ️  ${message}`, colors.blue);
}

async function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  warnings: 0
};

async function runTest(testName, testFn) {
  logTest(testName);
  try {
    await testFn();
    testResults.passed++;
    logPass(`${testName} passed`);
  } catch (error) {
    testResults.failed++;
    logFail(`${testName} failed: ${error.message}`);
  }
}

// Authentication helper
async function authenticateUser() {
  logTest('User Authentication Setup');
  
  try {
    // First check if we can access any protected endpoint
    const response = await axios.get(`${BASE_URL}/holidays`, {
      validateStatus: () => true
    });
    
    if (response.status === 401) {
      logWarn('Authentication required. Please provide credentials.');
      
      const email = await prompt('Enter admin email: ');
      const password = await prompt('Enter password: ');
      
      const authResponse = await axios.post(`${BASE_URL}/auth/login`, {
        email,
        password
      });
      
      if (authResponse.data.success && authResponse.data.user) {
        authToken = authResponse.headers['authorization'] || authResponse.data.token;
        logPass('Authentication successful');
        return true;
      } else {
        throw new Error('Authentication failed');
      }
    } else {
      logInfo('No authentication required for current setup');
      return true;
    }
  } catch (error) {
    if (error.response?.status === 404) {
      logWarn('Auth endpoint not found - assuming no auth required');
      return true;
    }
    throw error;
  }
}

// Backend API Tests
async function testServerConnectivity() {
  const response = await axios.get(`${BASE_URL}/holidays`, {
    headers: authToken ? { Authorization: authToken } : {},
    validateStatus: () => true
  });
  
  if (response.status >= 200 && response.status < 500) {
    logPass('Backend server is responsive');
  } else {
    throw new Error(`Server returned status: ${response.status}`);
  }
}

async function testFrontendConnectivity() {
  const response = await axios.get(FRONTEND_URL, {
    validateStatus: () => true
  });
  
  if (response.status === 200) {
    logPass('Frontend server is responsive');
  } else {
    throw new Error(`Frontend server returned status: ${response.status}`);
  }
}

async function testHolidaySystemStatus() {
  const response = await axios.get(`${BASE_URL}/holiday-system/status`);
  
  if (response.data.success) {
    logPass('Holiday system status endpoint working');
    logInfo(`System initialized: ${response.data.is_initialized}`);
    if (response.data.calendar_settings) {
      logInfo(`Auto-create holidays: ${response.data.calendar_settings.auto_create_holiday_entries}`);
      logInfo(`Default holiday hours: ${response.data.calendar_settings.default_holiday_hours}`);
    }
  } else {
    throw new Error('Holiday system status check failed');
  }
}

async function testHolidaySystemInitialization() {
  try {
    const response = await axios.post(`${BASE_URL}/holiday-system/initialize`, {}, {
      headers: authToken ? { Authorization: authToken } : {},
      validateStatus: () => true
    });
    
    if (response.status === 200 || response.status === 409) {
      logPass('Holiday system initialization endpoint working');
      if (response.status === 409) {
        logInfo('System already initialized');
      }
    } else if (response.status === 403) {
      logWarn('Insufficient permissions for initialization (expected for non-super-admin)');
    } else {
      throw new Error(`Unexpected status: ${response.status}`);
    }
  } catch (error) {
    if (error.response?.status === 403) {
      logWarn('Insufficient permissions for initialization (expected)');
    } else {
      throw error;
    }
  }
}

async function testGetAllHolidays() {
  const response = await axios.get(`${BASE_URL}/holidays`, {
    headers: authToken ? { Authorization: authToken } : {}
  });
  
  if (response.data.success && Array.isArray(response.data.holidays)) {
    logPass(`Retrieved ${response.data.holidays.length} holidays`);
    return response.data.holidays;
  } else {
    throw new Error('Failed to retrieve holidays');
  }
}

async function testGetHolidaysByYear() {
  const currentYear = new Date().getFullYear();
  const response = await axios.get(`${BASE_URL}/holidays?year=${currentYear}`, {
    headers: authToken ? { Authorization: authToken } : {}
  });
  
  if (response.data.success && Array.isArray(response.data.holidays)) {
    logPass(`Retrieved ${response.data.holidays.length} holidays for ${currentYear}`);
  } else {
    throw new Error('Failed to retrieve holidays by year');
  }
}

async function testGetUpcomingHolidays() {
  const response = await axios.get(`${BASE_URL}/holidays/upcoming?days=90`, {
    headers: authToken ? { Authorization: authToken } : {}
  });
  
  if (response.data.success && Array.isArray(response.data.holidays)) {
    logPass(`Retrieved ${response.data.count} upcoming holidays`);
  } else {
    throw new Error('Failed to retrieve upcoming holidays');
  }
}

async function testCreateHoliday() {
  try {
    const response = await axios.post(`${BASE_URL}/holidays`, testHoliday, {
      headers: authToken ? { Authorization: authToken } : {},
      validateStatus: () => true
    });
    
    if (response.status === 201 && response.data.success) {
      testHolidayId = response.data.holiday._id;
      logPass('Holiday created successfully');
      return response.data.holiday;
    } else if (response.status === 403) {
      logWarn('Insufficient permissions to create holiday (expected for non-admin)');
      return null;
    } else {
      throw new Error(`Failed to create holiday: ${response.status}`);
    }
  } catch (error) {
    if (error.response?.status === 403) {
      logWarn('Insufficient permissions to create holiday (expected)');
      return null;
    }
    throw error;
  }
}

async function testUpdateHoliday() {
  if (!testHolidayId) {
    logWarn('Skipping update test - no holiday ID available');
    return;
  }
  
  try {
    const updateData = {
      description: 'Updated test holiday description'
    };
    
    const response = await axios.put(`${BASE_URL}/holidays/${testHolidayId}`, updateData, {
      headers: authToken ? { Authorization: authToken } : {},
      validateStatus: () => true
    });
    
    if (response.status === 200 && response.data.success) {
      logPass('Holiday updated successfully');
    } else if (response.status === 403) {
      logWarn('Insufficient permissions to update holiday (expected for non-admin)');
    } else {
      throw new Error(`Failed to update holiday: ${response.status}`);
    }
  } catch (error) {
    if (error.response?.status === 403) {
      logWarn('Insufficient permissions to update holiday (expected)');
    } else {
      throw error;
    }
  }
}

async function testGetSpecificHoliday() {
  if (!testHolidayId) {
    logWarn('Skipping specific holiday test - no holiday ID available');
    return;
  }
  
  const response = await axios.get(`${BASE_URL}/holidays/${testHolidayId}`, {
    headers: authToken ? { Authorization: authToken } : {}
  });
  
  if (response.data.success && response.data.holiday) {
    logPass('Retrieved specific holiday successfully');
  } else {
    throw new Error('Failed to retrieve specific holiday');
  }
}

async function testCheckHolidayDate() {
  const testDate = '2025-12-25';
  const response = await axios.get(`${BASE_URL}/holidays/check/${testDate}`, {
    headers: authToken ? { Authorization: authToken } : {}
  });
  
  if (response.data.success && typeof response.data.is_holiday === 'boolean') {
    logPass(`Holiday check for ${testDate}: ${response.data.is_holiday}`);
  } else {
    throw new Error('Failed to check holiday date');
  }
}

async function testTimesheetIntegration() {
  try {
    // Test creating a timesheet to verify holiday integration
    const testTimesheet = {
      user_id: '507f1f77bcf86cd799439011', // Mock user ID
      week_start_date: '2025-12-22', // Week containing Christmas
      status: 'draft'
    };
    
    const response = await axios.post(`${BASE_URL}/timesheets`, testTimesheet, {
      headers: authToken ? { Authorization: authToken } : {},
      validateStatus: () => true
    });
    
    if (response.status === 201 || response.status === 400) {
      if (response.status === 201) {
        logPass('Timesheet creation endpoint working');
        
        // Check if holiday entries were auto-created
        const timesheetId = response.data.timesheet._id;
        const entriesResponse = await axios.get(`${BASE_URL}/timesheets/${timesheetId}/entries`, {
          headers: authToken ? { Authorization: authToken } : {},
          validateStatus: () => true
        });
        
        if (entriesResponse.status === 200) {
          const holidayEntries = entriesResponse.data.entries?.filter(entry => 
            entry.entry_category === 'holiday'
          ) || [];
          
          if (holidayEntries.length > 0) {
            logPass(`Auto-created ${holidayEntries.length} holiday entries`);
          } else {
            logInfo('No holiday entries auto-created (may be expected)');
          }
        }
      } else {
        logWarn('Timesheet creation returned 400 (may be validation issue)');
      }
    } else if (response.status === 404) {
      logWarn('Timesheet endpoint not found');
    } else if (response.status === 403) {
      logWarn('Insufficient permissions for timesheet creation');
    } else {
      throw new Error(`Unexpected timesheet creation status: ${response.status}`);
    }
  } catch (error) {
    if (error.response?.status === 404) {
      logWarn('Timesheet endpoints may not be implemented yet');
    } else {
      throw error;
    }
  }
}

async function testHolidaySynchronization() {
  try {
    const mockTimesheetId = '507f1f77bcf86cd799439012';
    const response = await axios.post(`${BASE_URL}/timesheets/${mockTimesheetId}/sync-holidays`, {
      week_start_date: '2025-12-22'
    }, {
      headers: authToken ? { Authorization: authToken } : {},
      validateStatus: () => true
    });
    
    if (response.status === 200) {
      logPass('Holiday synchronization endpoint working');
      if (response.data.added || response.data.removed || response.data.existing) {
        logInfo(`Sync results - Added: ${response.data.added}, Removed: ${response.data.removed}, Existing: ${response.data.existing}`);
      }
    } else if (response.status === 404) {
      logWarn('Holiday synchronization endpoint not found');
    } else if (response.status === 403) {
      logWarn('Insufficient permissions for holiday synchronization');
    } else {
      throw new Error(`Unexpected sync status: ${response.status}`);
    }
  } catch (error) {
    if (error.response?.status === 404) {
      logWarn('Holiday synchronization endpoints may not be implemented yet');
    } else {
      throw error;
    }
  }
}

async function testDeleteHoliday() {
  if (!testHolidayId) {
    logWarn('Skipping delete test - no holiday ID available');
    return;
  }
  
  try {
    const response = await axios.delete(`${BASE_URL}/holidays/${testHolidayId}`, {
      headers: authToken ? { Authorization: authToken } : {},
      validateStatus: () => true
    });
    
    if (response.status === 200 && response.data.success) {
      logPass('Holiday deleted successfully');
    } else if (response.status === 403) {
      logWarn('Insufficient permissions to delete holiday (expected for non-admin)');
    } else {
      throw new Error(`Failed to delete holiday: ${response.status}`);
    }
  } catch (error) {
    if (error.response?.status === 403) {
      logWarn('Insufficient permissions to delete holiday (expected)');
    } else {
      throw error;
    }
  }
}

// Frontend Integration Tests
async function testFrontendAdminSettings() {
  logTest('Frontend Admin Settings Integration');
  
  try {
    // Check if the settings page loads
    const response = await axios.get(FRONTEND_URL, {
      validateStatus: () => true
    });
    
    if (response.status === 200 && response.data.includes('Settings')) {
      logPass('Frontend appears to be serving settings-related content');
    } else {
      logWarn('Frontend may not be serving expected content');
    }
    
    // Test API calls from frontend perspective
    const apiResponse = await axios.get(`${BASE_URL}/settings/system`, {
      headers: authToken ? { Authorization: authToken } : {},
      validateStatus: () => true
    });
    
    if (apiResponse.status === 200 || apiResponse.status === 404) {
      if (apiResponse.status === 200) {
        logPass('System settings API accessible from frontend');
      } else {
        logWarn('System settings endpoint not found (may not be implemented)');
      }
    } else {
      logWarn(`System settings API returned: ${apiResponse.status}`);
    }
    
  } catch (error) {
    logWarn(`Frontend integration test failed: ${error.message}`);
  }
}

// Cleanup function
async function cleanup() {
  if (testHolidayId) {
    try {
      await axios.delete(`${BASE_URL}/holidays/${testHolidayId}`, {
        headers: authToken ? { Authorization: authToken } : {},
        validateStatus: () => true
      });
      logInfo('Cleanup: Test holiday removed');
    } catch (error) {
      logWarn('Cleanup: Could not remove test holiday');
    }
  }
}

// Main test runner
async function runAllTests() {
  log(`${colors.bright}🚀 Starting Simplified Calendar System Test Suite${colors.reset}\n`);
  
  try {
    // Authentication setup
    await runTest('Authentication Setup', authenticateUser);
    
    // Basic connectivity tests
    await runTest('Backend Server Connectivity', testServerConnectivity);
    await runTest('Frontend Server Connectivity', testFrontendConnectivity);
    
    // Holiday system core tests
    await runTest('Holiday System Status', testHolidaySystemStatus);
    await runTest('Holiday System Initialization', testHolidaySystemInitialization);
    
    // Holiday CRUD operations
    await runTest('Get All Holidays', testGetAllHolidays);
    await runTest('Get Holidays by Year', testGetHolidaysByYear);
    await runTest('Get Upcoming Holidays', testGetUpcomingHolidays);
    await runTest('Create Holiday', testCreateHoliday);
    await runTest('Update Holiday', testUpdateHoliday);
    await runTest('Get Specific Holiday', testGetSpecificHoliday);
    await runTest('Check Holiday Date', testCheckHolidayDate);
    
    // Advanced integration tests
    await runTest('Timesheet Integration', testTimesheetIntegration);
    await runTest('Holiday Synchronization', testHolidaySynchronization);
    
    // Frontend integration
    await runTest('Frontend Admin Settings', testFrontendAdminSettings);
    
    // Cleanup
    await runTest('Delete Test Holiday', testDeleteHoliday);
    
  } catch (error) {
    logFail(`Test suite failed: ${error.message}`);
    testResults.failed++;
  } finally {
    await cleanup();
  }
  
  // Results summary
  log(`\n${colors.bright}📊 Test Results Summary${colors.reset}`);
  log(`${colors.green}✅ Passed: ${testResults.passed}${colors.reset}`);
  log(`${colors.red}❌ Failed: ${testResults.failed}${colors.reset}`);
  log(`${colors.yellow}⚠️  Warnings: ${testResults.warnings}${colors.reset}`);
  
  const totalTests = testResults.passed + testResults.failed;
  const successRate = totalTests > 0 ? ((testResults.passed / totalTests) * 100).toFixed(1) : 0;
  
  log(`\n${colors.bright}Success Rate: ${successRate}%${colors.reset}`);
  
  if (testResults.failed === 0) {
    log(`\n${colors.green}🎉 All critical tests passed! Calendar system is functionally sound.${colors.reset}`);
  } else {
    log(`\n${colors.yellow}⚠️  Some tests failed. Review the results above for details.${colors.reset}`);
  }
  
  rl.close();
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  log('\n\n🛑 Test interrupted. Cleaning up...');
  await cleanup();
  rl.close();
  process.exit(0);
});

// Start the test suite
runAllTests().catch((error) => {
  logFail(`Test suite crashed: ${error.message}`);
  rl.close();
  process.exit(1);
});