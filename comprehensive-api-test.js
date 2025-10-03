// COMPREHENSIVE API TEST - Run in browser console

console.log("🔧 COMPREHENSIVE API & DATE FORMAT TEST");

async function fullApiTest() {
  console.log("🧪 Testing Complete API Flow...");

  const token = localStorage.getItem("accessToken");
  if (!token) {
    console.log("❌ Please login first: manager@company.com / admin123");
    return;
  }

  console.log("✅ Token found");

  try {
    // Test 1: Check API path for templates
    console.log("\n📋 Test 1: Templates endpoint...");
    const templatesResponse = await fetch(
      "http://localhost:3001/api/v1/reports/templates",
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    console.log("Templates API status:", templatesResponse.status);

    if (!templatesResponse.ok) {
      console.log("❌ Templates API failed");
      return;
    }

    const templatesData = await templatesResponse.json();
    console.log("✅ Templates loaded:", templatesData.count);

    if (!templatesData.templates || templatesData.templates.length === 0) {
      console.log("❌ No templates available");
      return;
    }

    // Test 2: Test report generation with correct date format
    const template = templatesData.templates[0];
    console.log("\n📊 Test 2: Report generation...");
    console.log("Using template:", template.name);

    // Create proper ISO8601 dates
    const startDate = new Date("2025-09-01T00:00:00.000Z");
    const endDate = new Date("2025-09-30T23:59:59.999Z");

    const reportRequest = {
      template_id: template.template_id,
      date_range: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
      format: "csv",
      filters: {},
    };

    console.log("Request payload:", {
      template_id: reportRequest.template_id,
      date_range: reportRequest.date_range,
      format: reportRequest.format,
    });

    const reportResponse = await fetch(
      "http://localhost:3001/api/v1/reports/generate",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(reportRequest),
      }
    );

    console.log("Report API status:", reportResponse.status);
    console.log(
      "Response headers:",
      Object.fromEntries(reportResponse.headers.entries())
    );

    if (reportResponse.ok) {
      console.log("✅ API call successful!");

      const blob = await reportResponse.blob();
      console.log("📄 File info:", {
        size: blob.size,
        type: blob.type,
        isEmpty: blob.size === 0,
      });

      if (blob.size > 0) {
        // Preview content
        const preview = await blob.slice(0, 200).text();
        console.log("📝 Content preview:", preview);

        // Download file
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `working-report-${Date.now()}.csv`;
        a.style.display = "none";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        console.log("✅ SUCCESS! File downloaded and should be openable now!");
      } else {
        console.log("❌ Empty file received");
      }
    } else {
      const errorText = await reportResponse.text();
      console.log("❌ Report generation failed:", errorText);

      try {
        const errorJson = JSON.parse(errorText);
        console.log("Error details:", errorJson);
      } catch {
        console.log("Raw error:", errorText);
      }
    }
  } catch (error) {
    console.log("❌ Exception:", error);
  }
}

// Run the comprehensive test
fullApiTest();

console.log(`
🎯 FIXES APPLIED:

✅ 1. API Path: /api/v1/reports/generate (was missing /api/v1)
✅ 2. Date Format: ISO8601 format (was YYYY-MM-DD string)
✅ 3. Request Structure: Proper payload format

📋 BACKEND EXPECTS:
- template_id: string
- date_range.start: ISO8601 date (e.g., "2025-09-01T00:00:00.000Z")
- date_range.end: ISO8601 date (e.g., "2025-09-30T23:59:59.999Z")  
- format: "csv" | "excel" | "pdf"
- filters: {} (optional)

🚀 NEXT STEPS:
1. Refresh your browser (Ctrl+F5)
2. Try the report form again
3. The files should now download and open properly!
`);

// Make available for manual testing
window.fullApiTest = fullApiTest;
