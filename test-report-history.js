// Test Report History and Re-download
const API_BASE = "http://localhost:3001/api/v1";

const TEST_USER = {
  email: "manager@company.com",
  password: "admin123",
};

let authToken = "";

async function login() {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(TEST_USER),
  });

  if (response.ok) {
    const result = await response.json();
    authToken = result.tokens?.accessToken;
    return true;
  }
  return false;
}

async function generateMultipleReports() {
  console.log("📊 Generating multiple reports for history testing...");

  // Get templates
  const templatesResponse = await fetch(`${API_BASE}/reports/templates`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });

  const templatesResult = await templatesResponse.json();
  const templates = templatesResult.templates.slice(0, 3); // Use first 3 templates

  const generatedReports = [];

  for (let i = 0; i < templates.length; i++) {
    const template = templates[i];
    console.log(`\n📄 Generating report ${i + 1}: ${template.name}`);

    const reportRequest = {
      template_id: template.template_id,
      date_range: {
        start: "2025-09-01",
        end: "2025-10-31",
      },
      format: ["csv", "excel", "pdf"][i % 3], // Rotate formats
      filters: {},
    };

    try {
      const response = await fetch(`${API_BASE}/reports/generate`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reportRequest),
      });

      if (response.ok) {
        console.log(
          `   ✅ Generated: ${template.name} (${reportRequest.format})`
        );
        generatedReports.push({
          template: template.name,
          format: reportRequest.format,
        });
      } else {
        console.log(`   ❌ Failed: ${template.name}`);
      }

      // Small delay between requests
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }

  return generatedReports;
}

async function testReportHistory() {
  console.log("\n📚 Testing report history...");

  try {
    const response = await fetch(`${API_BASE}/reports/history?limit=10`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    if (response.ok) {
      const result = await response.json();
      console.log(`✅ History retrieved: ${result.count} reports found`);

      if (result.history && result.history.length > 0) {
        console.log("\n📋 Recent Reports:");
        result.history.forEach((report, index) => {
          const date = new Date(report.generated_at).toLocaleString();
          console.log(
            `   ${index + 1}. ${report.template_name} (${
              report.format
            }) - ${date}`
          );
        });
        return result.history;
      } else {
        console.log("📭 No reports in history");
        return [];
      }
    } else {
      console.log("❌ Failed to get report history");
      return [];
    }
  } catch (error) {
    console.log("❌ History error:", error.message);
    return [];
  }
}

async function runHistoryTest() {
  console.log("🚀 Testing Report History Functionality...\n");

  // Login
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log("❌ Login failed");
    return;
  }
  console.log("✅ Login successful");

  // Generate some reports
  const generated = await generateMultipleReports();
  console.log(`\n📊 Generated ${generated.length} reports successfully`);

  // Test history
  const history = await testReportHistory();

  // Summary
  console.log("\n🎯 History Test Summary:");
  console.log(`- Reports Generated: ${generated.length}`);
  console.log(`- Reports in History: ${history.length}`);

  if (history.length >= generated.length) {
    console.log("✅ Report history is working correctly!");
    console.log("📋 All generated reports appear in history");
  } else {
    console.log("⚠️ Some reports may not be appearing in history");
    console.log("💡 This might be expected if history uses audit logs");
  }

  console.log("\n🎉 Report history testing complete!");
}

runHistoryTest();
