// Comprehensive Report Format Testing
const API_BASE = "http://localhost:3001/api/v1";

// Test user credentials (from the recent seed script)
const TEST_USER = {
  email: "manager@company.com",
  password: "admin123",
};

let authToken = "";

async function login() {
  console.log("🔐 Logging in as manager...");

  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(TEST_USER),
    });

    if (response.ok) {
      const result = await response.json();
      authToken = result.tokens?.accessToken;
      console.log("✅ Login successful");
      return true;
    } else {
      console.log("❌ Login failed");
      return false;
    }
  } catch (error) {
    console.log("❌ Login error:", error.message);
    return false;
  }
}

async function testAllFormats() {
  console.log("\n🧪 Testing All Report Formats...");

  // Get templates first
  const templatesResponse = await fetch(`${API_BASE}/reports/templates`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });

  if (!templatesResponse.ok) {
    console.log("❌ Failed to get templates");
    return;
  }

  const templatesResult = await templatesResponse.json();
  const template = templatesResult.templates[0]; // Use first template

  console.log(`\n📊 Testing template: ${template.name}`);

  // Test each format
  const formats = ["csv", "excel", "pdf"];
  const results = {};

  for (const format of formats) {
    console.log(`\n📄 Testing ${format.toUpperCase()} format...`);

    try {
      const reportRequest = {
        template_id: template.template_id,
        date_range: {
          start: "2025-09-01",
          end: "2025-10-31",
        },
        format: format,
        filters: {},
      };

      const response = await fetch(`${API_BASE}/reports/generate`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reportRequest),
      });

      console.log(`   📡 Status: ${response.status}`);
      console.log(
        `   📁 Content-Type: ${response.headers.get("Content-Type")}`
      );

      if (response.ok) {
        if (format === "csv") {
          const content = await response.text();
          console.log(
            `   ✅ ${format.toUpperCase()}: Success (${
              content.length
            } characters)`
          );
          console.log(`   🔍 Preview: ${content.substring(0, 100)}...`);
          results[format] = { success: true, size: content.length };
        } else {
          // For Excel and PDF, we expect binary data
          const blob = await response.blob();
          console.log(
            `   ✅ ${format.toUpperCase()}: Success (${blob.size} bytes)`
          );
          results[format] = { success: true, size: blob.size };
        }
      } else {
        const error = await response.text();
        console.log(`   ❌ ${format.toUpperCase()}: Failed - ${error}`);
        results[format] = { success: false, error };
      }
    } catch (error) {
      console.log(`   ❌ ${format.toUpperCase()}: Error - ${error.message}`);
      results[format] = { success: false, error: error.message };
    }
  }

  // Summary
  console.log("\n📊 Format Test Results:");
  for (const [format, result] of Object.entries(results)) {
    const status = result.success ? "✅" : "❌";
    const details = result.success
      ? `${result.size} ${format === "csv" ? "chars" : "bytes"}`
      : result.error;
    console.log(`   ${status} ${format.toUpperCase()}: ${details}`);
  }

  return results;
}

async function testDifferentUserRoles() {
  console.log("\n👥 Testing Different User Roles...");

  const testUsers = [
    { email: "admin@company.com", password: "admin123", role: "super_admin" },
    { email: "employee1@company.com", password: "admin123", role: "employee" },
  ];

  for (const user of testUsers) {
    console.log(`\n🔐 Testing role: ${user.role} (${user.email})`);

    try {
      // Login as this user
      const loginResponse = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, password: user.password }),
      });

      if (!loginResponse.ok) {
        console.log(`   ❌ Login failed for ${user.role}`);
        continue;
      }

      const loginResult = await loginResponse.json();
      const userToken = loginResult.tokens?.accessToken;

      // Get templates for this user
      const templatesResponse = await fetch(`${API_BASE}/reports/templates`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });

      if (templatesResponse.ok) {
        const templatesResult = await templatesResponse.json();
        console.log(
          `   ✅ ${user.role}: ${templatesResult.count} templates available`
        );

        if (templatesResult.templates.length > 0) {
          console.log(
            `   📄 Sample template: ${templatesResult.templates[0].name}`
          );
        }
      } else {
        console.log(`   ❌ ${user.role}: Failed to get templates`);
      }
    } catch (error) {
      console.log(`   ❌ ${user.role}: Error - ${error.message}`);
    }
  }
}

async function runComprehensiveTests() {
  console.log("🚀 Starting Comprehensive Report Testing...\n");

  // Step 1: Login as manager
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log("🛑 Cannot continue without authentication");
    return;
  }

  // Step 2: Test all formats
  await testAllFormats();

  // Step 3: Test different user roles
  await testDifferentUserRoles();

  console.log("\n🎉 Comprehensive testing complete!");
  console.log("📋 Check the results above to see what's working.");
}

// Run comprehensive tests
runComprehensiveTests();
