// Authentication & API Test - Run in browser console

console.log("🔐 Testing Report API Authentication...");

// Check if user is logged in
const checkAuth = () => {
  const token = localStorage.getItem("accessToken");
  console.log("✅ Access Token Found:", !!token);

  if (token) {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      console.log("🎫 Token Info:", {
        userId: payload.userId,
        role: payload.role,
        email: payload.email,
        exp: new Date(payload.exp * 1000),
      });

      if (payload.exp * 1000 < Date.now()) {
        console.log("⚠️  Token has expired!");
        return false;
      }
      return true;
    } catch (e) {
      console.log("❌ Invalid token format");
      return false;
    }
  }
  return false;
};

// Test report generation endpoint
const testReportGeneration = async () => {
  if (!checkAuth()) {
    console.log("🚨 Please login first");
    return;
  }

  const token = localStorage.getItem("accessToken");

  // First, get templates to use a valid template_id
  console.log("📋 Getting report templates...");

  try {
    const templatesResponse = await fetch(
      "http://localhost:3001/api/v1/reports/templates",
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!templatesResponse.ok) {
      console.log("❌ Templates fetch failed:", templatesResponse.status);
      return;
    }

    const templatesData = await templatesResponse.json();
    console.log("✅ Templates loaded:", templatesData.count, "templates");

    if (templatesData.templates.length === 0) {
      console.log("⚠️  No templates available");
      return;
    }

    // Test report generation with first template
    const template = templatesData.templates[0];
    console.log("🧪 Testing with template:", template.name);

    const reportRequest = {
      template_id: template.template_id,
      date_range: {
        start: "2025-09-01",
        end: "2025-10-31",
      },
      format: "csv",
      filters: {},
    };

    console.log("📊 Generating report...");

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

    console.log("📡 Report Response Status:", reportResponse.status);

    if (reportResponse.ok) {
      const blob = await reportResponse.blob();
      console.log("✅ Report Generated Successfully!");
      console.log("📄 File size:", blob.size, "bytes");
      console.log("📄 File type:", blob.type);

      // Try to download the file
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `test-report-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      console.log("💾 File download triggered");
    } else {
      const errorText = await reportResponse.text();
      console.log("❌ Report Generation Failed:", errorText);
    }
  } catch (error) {
    console.log("❌ Error:", error.message);
  }
};

// Auto-run the test
console.log("🚀 Running authentication test...");
if (checkAuth()) {
  console.log("🎯 Run testReportGeneration() to test report generation");
  // Uncomment the next line to auto-test report generation
  // testReportGeneration();
} else {
  console.log("🔑 Please login first, then run testReportGeneration()");
}

// Make functions available globally
window.checkAuth = checkAuth;
window.testReportGeneration = testReportGeneration;
