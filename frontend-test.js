// Frontend-Backend Integration Test
// Run this in browser console to test frontend-backend connectivity

console.log("🚀 Starting Frontend Reports Integration Test...");

// Test configuration
const API_BASE = "http://localhost:3001/api/v1";
const TEST_CREDENTIALS = {
  email: "manager@company.com",
  password: "admin123",
};

// Test 1: Login functionality
async function testLogin() {
  console.log("\n🔐 Testing Login...");

  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(TEST_CREDENTIALS),
    });

    if (response.ok) {
      const result = await response.json();
      console.log("✅ Login successful");
      console.log("🔑 Token received:", !!result.tokens?.accessToken);
      return result.tokens?.accessToken;
    } else {
      console.log("❌ Login failed:", response.status);
      return null;
    }
  } catch (error) {
    console.log("❌ Login error:", error.message);
    return null;
  }
}

// Test 2: Report templates
async function testReportTemplates(token) {
  console.log("\n📋 Testing Report Templates...");

  try {
    const response = await fetch(`${API_BASE}/reports/templates`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.ok) {
      const result = await response.json();
      console.log(`✅ Templates loaded: ${result.count} templates`);
      console.log(
        "📄 Available templates:",
        result.templates.map((t) => t.name)
      );
      return result.templates;
    } else {
      console.log("❌ Templates failed:", response.status);
      return [];
    }
  } catch (error) {
    console.log("❌ Templates error:", error.message);
    return [];
  }
}

// Test 3: Report generation
async function testReportGeneration(token, templates) {
  console.log("\n📊 Testing Report Generation...");

  if (templates.length === 0) {
    console.log("❌ No templates available for testing");
    return;
  }

  const template = templates[0];

  try {
    const reportRequest = {
      template_id: template.template_id,
      date_range: {
        start: "2025-09-01",
        end: "2025-10-31",
      },
      format: "csv",
      filters: {},
    };

    const response = await fetch(`${API_BASE}/reports/generate`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(reportRequest),
    });

    if (response.ok) {
      const content = await response.text();
      console.log(`✅ Report generated: ${template.name}`);
      console.log(`📄 Content size: ${content.length} characters`);
      console.log("🔍 Content preview:", content.substring(0, 100) + "...");
    } else {
      console.log(`❌ Report generation failed: ${response.status}`);
    }
  } catch (error) {
    console.log("❌ Report generation error:", error.message);
  }
}

// Run all tests
async function runFrontendTests() {
  console.log("🌐 Frontend-Backend Integration Test Starting...\n");

  const token = await testLogin();
  if (!token) {
    console.log("🛑 Cannot continue without authentication");
    return;
  }

  const templates = await testReportTemplates(token);
  await testReportGeneration(token, templates);

  console.log("\n🎉 Frontend integration test complete!");
  console.log(
    "💡 If all tests passed, the frontend should work perfectly with the backend."
  );
}

// Auto-run the tests
runFrontendTests();

// Instructions for manual testing
console.log(`
📋 Manual Testing Instructions:
1. Open http://localhost:5173 in browser
2. Login with: ${TEST_CREDENTIALS.email} / ${TEST_CREDENTIALS.password}
3. Navigate to Reports section
4. Try generating reports in different formats
5. Check that role-based templates are visible
6. Verify downloads work properly

🔧 If you see any console errors, they indicate frontend-backend communication issues.
🌐 Frontend URL: http://localhost:5173
🔌 Backend API: http://localhost:3001
`);
