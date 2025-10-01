// Comprehensive Report Functionality Test
const API_BASE = "http://localhost:3001/api/v1";

// Test user credentials (from the recent seed script)
const TEST_USER = {
  email: "manager@company.com",
  password: "admin123", // From the seed script output
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
      authToken =
        result.tokens?.accessToken || result.tokens?.token || result.token; // Try all possible locations
      console.log("🔍 Tokens object:", result.tokens);
      console.log("✅ Login successful");
      console.log("🔑 Token received:", authToken ? "Yes" : "No");
      console.log("🔑 Token length:", authToken?.length || 0);
      console.log("🔍 Response structure:", Object.keys(result));
      return true;
    } else {
      const error = await response.text();
      console.log("❌ Login failed:", response.status, error);
      return false;
    }
  } catch (error) {
    console.log("❌ Login error:", error.message);
    return false;
  }
}

async function testReportTemplates() {
  console.log("\n📋 Testing report templates...");

  try {
    const response = await fetch(`${API_BASE}/reports/templates`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    if (response.ok) {
      const result = await response.json();
      console.log("✅ Templates loaded:", result.count, "templates");

      if (result.templates && result.templates.length > 0) {
        console.log("📄 First template:", result.templates[0].name);
        return result.templates[0]; // Return first template for testing
      }
    } else {
      console.log("❌ Failed to load templates:", response.status);
    }
  } catch (error) {
    console.log("❌ Templates error:", error.message);
  }

  return null;
}

async function testReportGeneration(template) {
  console.log("\n🔄 Testing report generation...");

  if (!template) {
    console.log("❌ No template available for testing");
    return false;
  }

  try {
    const reportRequest = {
      template_id: template.template_id,
      date_range: {
        start: "2025-09-01",
        end: "2025-10-31",
      },
      format: "csv", // Start with CSV as it's most likely to work
      filters: {},
    };

    console.log("📊 Generating report:", template.name);
    console.log(
      "📅 Date range:",
      reportRequest.date_range.start,
      "to",
      reportRequest.date_range.end
    );

    const response = await fetch(`${API_BASE}/reports/generate`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(reportRequest),
    });

    console.log("📡 Response status:", response.status);
    console.log("📁 Content-Type:", response.headers.get("Content-Type"));

    if (response.ok) {
      const contentType = response.headers.get("Content-Type");

      if (
        contentType?.includes("text/csv") ||
        contentType?.includes("application/")
      ) {
        // This is a file download
        const content = await response.text();
        console.log("✅ Report generated successfully!");
        console.log("📄 Content length:", content.length, "characters");
        console.log("🔍 Content preview:", content.substring(0, 200) + "...");
        return true;
      } else {
        // This might be a JSON error response
        const result = await response.json();
        console.log("❓ Unexpected JSON response:", result);
      }
    } else {
      const error = await response.text();
      console.log("❌ Generation failed:", response.status);
      console.log("💥 Error:", error);
    }
  } catch (error) {
    console.log("❌ Generation error:", error.message);
  }

  return false;
}

async function testReportHistory() {
  console.log("\n📚 Testing report history...");

  try {
    const response = await fetch(`${API_BASE}/reports/history`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    if (response.ok) {
      const result = await response.json();
      console.log("✅ History loaded:", result.count, "reports");

      if (result.history && result.history.length > 0) {
        console.log("📄 Recent report:", result.history[0].template_name);
        return true;
      } else {
        console.log("📭 No reports in history yet");
      }
    } else {
      console.log("❌ Failed to load history:", response.status);
    }
  } catch (error) {
    console.log("❌ History error:", error.message);
  }

  return false;
}

async function runAllTests() {
  console.log("🚀 Starting Comprehensive Report Tests...\n");

  // Step 1: Login
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log("🛑 Cannot continue without authentication");
    return;
  }

  // Step 2: Test Templates
  const template = await testReportTemplates();

  // Step 3: Test Generation
  const generationSuccess = await testReportGeneration(template);

  // Step 4: Test History
  await testReportHistory();

  // Summary
  console.log("\n📊 Test Summary:");
  console.log("- Login:", loginSuccess ? "✅" : "❌");
  console.log("- Templates:", template ? "✅" : "❌");
  console.log("- Generation:", generationSuccess ? "✅" : "❌");

  if (generationSuccess) {
    console.log("\n🎉 Report functionality is WORKING!");
    console.log("✨ Users can successfully download reports!");
  } else {
    console.log("\n⚠️  Report generation needs debugging");
    console.log("🔧 Check backend logs for detailed errors");
  }
}

// Run all tests
runAllTests();
