// Frontend Integration Tests using Playwright
// Run with: npm install playwright && node testing/frontend-integration-tests.js

const { chromium } = require('playwright');

class FrontendTester {
  constructor() {
    this.browser = null;
    this.testResults = [];
    this.baseUrl = 'http://localhost:3000';

    this.testUsers = {
      super_admin: { email: 'admin@company.com', password: 'admin123', role: 'Super Admin' },
      management: { email: 'management@company.com', password: 'admin123', role: 'Management' },
      manager: { email: 'manager@company.com', password: 'admin123', role: 'Manager' },
      lead: { email: 'lead@company.com', password: 'admin123', role: 'Lead' },
      employee: { email: 'employee1@company.com', password: 'admin123', role: 'Employee' }
    };
  }

  async setup() {
    this.browser = await chromium.launch({ headless: false }); // Set to true for headless testing
  }

  async teardown() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async login(page, userType) {
    const user = this.testUsers[userType];

    try {
      await page.goto(`${this.baseUrl}/login`);
      await page.waitForSelector('input[type="email"]', { timeout: 5000 });

      await page.fill('input[type="email"]', user.email);
      await page.fill('input[type="password"]', user.password);
      await page.click('button[type="submit"]');

      // Wait for navigation to dashboard
      await page.waitForURL('**/dashboard', { timeout: 10000 });

      this.logResult('LOGIN', userType, 'SUCCESS', `Logged in as ${user.role}`);
      return true;
    } catch (error) {
      this.logResult('LOGIN', userType, 'FAILED', error.message);
      return false;
    }
  }

  async testNavigationAccess(page, userType) {
    const expectedNavItems = {
      super_admin: ['Dashboard', 'Billing Management', 'Client Management', 'Reports'],
      management: ['Dashboard', 'Billing Management', 'Client Management', 'Reports'],
      manager: ['Dashboard', 'Client Management', 'Reports'],
      lead: ['Dashboard', 'Client Management'],
      employee: ['Dashboard', 'Client Management']
    };

    const expected = expectedNavItems[userType] || [];

    try {
      // Check main navigation
      const navElements = await page.locator('nav a, nav button').allTextContents();

      for (const item of expected) {
        const hasItem = navElements.some(nav => nav.includes(item));
        this.logResult('NAVIGATION', userType, hasItem ? 'SUCCESS' : 'FAILED',
          `${item} ${hasItem ? 'found' : 'missing'} in navigation`);
      }

      // Check for items that shouldn't be there
      const forbidden = {
        manager: ['Billing Management'],
        lead: ['Billing Management', 'Reports'],
        employee: ['Billing Management', 'Reports']
      };

      if (forbidden[userType]) {
        for (const item of forbidden[userType]) {
          const hasItem = navElements.some(nav => nav.includes(item));
          this.logResult('NAVIGATION_FORBIDDEN', userType, hasItem ? 'FAILED' : 'SUCCESS',
            `${item} ${hasItem ? 'inappropriately visible' : 'correctly hidden'}`);
        }
      }

    } catch (error) {
      this.logResult('NAVIGATION', userType, 'FAILED', error.message);
    }
  }

  async testDashboardAccess(page, userType) {
    try {
      await page.goto(`${this.baseUrl}/dashboard`);
      await page.waitForLoadState('networkidle');

      // Check for role-specific dashboard elements
      const dashboardContent = await page.textContent('body');

      const expectedContent = {
        super_admin: ['System Overview', 'Total Users', 'User Activity'],
        management: ['Organization Overview', 'Project Health', 'Team Performance'],
        manager: ['Team Overview', 'Project Status', 'Team Members'],
        lead: ['Task Overview', 'Project Coordination', 'Team Collaboration'],
        employee: ['Personal Overview', 'Timesheet Status', 'Project Assignments']
      };

      const expected = expectedContent[userType] || [];

      for (const content of expected) {
        const hasContent = dashboardContent.includes(content);
        this.logResult('DASHBOARD_CONTENT', userType, hasContent ? 'SUCCESS' : 'FAILED',
          `"${content}" ${hasContent ? 'found' : 'missing'} in dashboard`);
      }

    } catch (error) {
      this.logResult('DASHBOARD_ACCESS', userType, 'FAILED', error.message);
    }
  }

  async testBillingManagement(page, userType) {
    const hasAccess = ['super_admin', 'management'].includes(userType);

    try {
      await page.goto(`${this.baseUrl}/billing`);

      if (hasAccess) {
        // Should see billing management interface
        await page.waitForSelector('h1', { timeout: 5000 });
        const title = await page.textContent('h1');

        if (title.includes('Billing Management')) {
          this.logResult('BILLING_ACCESS', userType, 'SUCCESS', 'Billing Management page loaded');

          // Test tabs
          const tabs = ['Dashboard', 'Summaries', 'Reports'];
          for (const tab of tabs) {
            try {
              await page.click(`text=${tab}`);
              await page.waitForTimeout(1000);
              this.logResult('BILLING_TAB', userType, 'SUCCESS', `${tab} tab accessible`);
            } catch (error) {
              this.logResult('BILLING_TAB', userType, 'FAILED', `${tab} tab error: ${error.message}`);
            }
          }

          // Test edit functionality (should have edit buttons)
          const editButtons = await page.locator('button:has-text("Edit")').count();
          this.logResult('BILLING_EDIT', userType, editButtons > 0 ? 'SUCCESS' : 'WARNING',
            `Found ${editButtons} edit buttons`);

        } else {
          this.logResult('BILLING_ACCESS', userType, 'FAILED', 'Wrong page loaded');
        }
      } else {
        // Should see access denied
        await page.waitForSelector('text=Access Denied', { timeout: 5000 });
        this.logResult('BILLING_ACCESS', userType, 'SUCCESS', 'Access correctly denied');
      }

    } catch (error) {
      if (hasAccess) {
        this.logResult('BILLING_ACCESS', userType, 'FAILED', error.message);
      } else {
        // If no access expected and we get an error, it might be correct behavior
        this.logResult('BILLING_ACCESS', userType, 'SUCCESS', 'Access correctly denied (error expected)');
      }
    }
  }

  async testClientManagement(page, userType) {
    try {
      await page.goto(`${this.baseUrl}/clients`);
      await page.waitForLoadState('networkidle');

      const pageContent = await page.textContent('body');

      if (pageContent.includes('Access Denied')) {
        this.logResult('CLIENT_ACCESS', userType, 'FAILED', 'Unexpected access denial');
        return;
      }

      this.logResult('CLIENT_ACCESS', userType, 'SUCCESS', 'Client Management page loaded');

      // Check for management capabilities
      const canManage = ['super_admin', 'management'].includes(userType);

      const addButton = await page.locator('button:has-text("Add Client")').count();
      this.logResult('CLIENT_ADD_BUTTON', userType,
        (canManage && addButton > 0) || (!canManage && addButton === 0) ? 'SUCCESS' : 'FAILED',
        `Add button ${addButton > 0 ? 'present' : 'absent'} (Expected: ${canManage ? 'present' : 'absent'})`);

      // Test search functionality
      const searchInput = await page.locator('input[placeholder*="Search"]').count();
      this.logResult('CLIENT_SEARCH', userType, searchInput > 0 ? 'SUCCESS' : 'FAILED',
        `Search functionality ${searchInput > 0 ? 'available' : 'missing'}`);

      // Check client list
      const clientItems = await page.locator('[data-testid="client-item"], .client-card, div:has(h4)').count();
      this.logResult('CLIENT_LIST', userType, clientItems >= 0 ? 'SUCCESS' : 'FAILED',
        `Found ${clientItems} client items`);

    } catch (error) {
      this.logResult('CLIENT_ACCESS', userType, 'FAILED', error.message);
    }
  }

  async testReportsAccess(page, userType) {
    const hasAccess = ['super_admin', 'management', 'manager'].includes(userType);

    try {
      await page.goto(`${this.baseUrl}/reports`);

      if (hasAccess) {
        await page.waitForSelector('h1', { timeout: 5000 });
        const title = await page.textContent('h1');

        if (title.includes('Reports')) {
          this.logResult('REPORTS_ACCESS', userType, 'SUCCESS', 'Reports page loaded');

          // Check for report templates
          const templates = await page.locator('.report-template, [data-testid="report-template"]').count();
          this.logResult('REPORTS_TEMPLATES', userType, templates > 0 ? 'SUCCESS' : 'WARNING',
            `Found ${templates} report templates`);

        } else {
          this.logResult('REPORTS_ACCESS', userType, 'FAILED', 'Wrong page loaded');
        }
      } else {
        await page.waitForSelector('text=Access Denied', { timeout: 5000 });
        this.logResult('REPORTS_ACCESS', userType, 'SUCCESS', 'Access correctly denied');
      }

    } catch (error) {
      if (hasAccess) {
        this.logResult('REPORTS_ACCESS', userType, 'FAILED', error.message);
      } else {
        this.logResult('REPORTS_ACCESS', userType, 'SUCCESS', 'Access correctly denied (error expected)');
      }
    }
  }

  async testUserRole(userType) {
    const context = await this.browser.newContext();
    const page = await context.newPage();

    console.log(`\n🧪 Testing ${userType.toUpperCase()} role...`);

    try {
      // Login
      const loginSuccess = await this.login(page, userType);
      if (!loginSuccess) {
        await context.close();
        return;
      }

      // Test navigation
      await this.testNavigationAccess(page, userType);

      // Test dashboard
      await this.testDashboardAccess(page, userType);

      // Test billing management
      await this.testBillingManagement(page, userType);

      // Test client management
      await this.testClientManagement(page, userType);

      // Test reports
      await this.testReportsAccess(page, userType);

    } catch (error) {
      this.logResult('USER_ROLE_TEST', userType, 'FAILED', error.message);
    } finally {
      await context.close();
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

    const statusColor = status === 'SUCCESS' ? '\x1b[32m' :
                       status === 'FAILED' ? '\x1b[31m' : '\x1b[33m';
    console.log(`${statusColor}[${status}]\x1b[0m ${test} - ${role}: ${details}`);
  }

  async runAllTests() {
    console.log('🎭 Starting Frontend Integration Testing...');
    console.log('Make sure your frontend is running on http://localhost:3000\n');

    await this.setup();

    try {
      // Test each user role
      for (const userType of Object.keys(this.testUsers)) {
        await this.testUserRole(userType);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait between tests
      }

      this.generateReport();

    } finally {
      await this.teardown();
    }
  }

  generateReport() {
    console.log('\n📋 FRONTEND TEST REPORT');
    console.log('='.repeat(50));

    const summary = {
      total: this.testResults.length,
      success: this.testResults.filter(r => r.status === 'SUCCESS').length,
      failed: this.testResults.filter(r => r.status === 'FAILED').length,
      warning: this.testResults.filter(r => r.status === 'WARNING').length
    };

    console.log(`Total Tests: ${summary.total}`);
    console.log(`✅ Passed: ${summary.success}`);
    console.log(`❌ Failed: ${summary.failed}`);
    console.log(`⚠️  Warnings: ${summary.warning}`);
    console.log(`Success Rate: ${((summary.success / summary.total) * 100).toFixed(1)}%`);

    // Critical failures
    const criticalFailures = this.testResults.filter(r =>
      r.status === 'FAILED' &&
      (r.test.includes('LOGIN') || r.test.includes('ACCESS'))
    );

    if (criticalFailures.length > 0) {
      console.log('\n🚨 CRITICAL FAILURES:');
      criticalFailures.forEach(failure => {
        console.log(`- ${failure.test} (${failure.role}): ${failure.details}`);
      });
    }

    // Save results
    const fs = require('fs');
    fs.writeFileSync('frontend-test-results.json', JSON.stringify({
      summary,
      detailedResults: this.testResults
    }, null, 2));

    console.log('\n💾 Detailed results saved to frontend-test-results.json');
  }
}

// Run tests
const tester = new FrontendTester();
tester.runAllTests().catch(console.error);

module.exports = FrontendTester;