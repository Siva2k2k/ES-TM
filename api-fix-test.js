// Quick API Test - Run this in browser console after refresh
console.log("🔧 Testing Fixed API Endpoints...");

// Test the corrected API URL
const testApiUrl = () => {
  const baseUrl = "http://localhost:3001";
  const endpoint = "/api/v1/reports/templates";
  const fullUrl = baseUrl + endpoint;

  console.log("✅ Correct API URL:", fullUrl);
  console.log(
    "❌ Previous (broken) URL would have been:",
    baseUrl + "/" + endpoint
  );

  return fullUrl;
};

// Test API call
const testReportApi = async () => {
  const token = localStorage.getItem("auth_token");
  if (!token) {
    console.log("⚠️  No auth token found. Please login first.");
    return;
  }

  try {
    const url = testApiUrl();
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    console.log("📡 API Response Status:", response.status);

    if (response.ok) {
      const data = await response.json();
      console.log("✅ API Working! Templates found:", data.count);
      console.log(
        "📋 Templates:",
        data.templates?.map((t) => t.name)
      );
    } else {
      console.log("❌ API Error:", response.status, response.statusText);
    }
  } catch (error) {
    console.log("❌ Network Error:", error.message);
  }
};

// Run the test
testApiUrl();
console.log(
  "🚀 Run testReportApi() after logging in to test the fixed endpoints"
);

// Auto-test if token exists
if (localStorage.getItem("auth_token")) {
  testReportApi();
}
