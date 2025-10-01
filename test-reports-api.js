// Quick test script for report functionality
const API_BASE = "http://localhost:3001/api/v1";

async function testReportsAPI() {
  console.log("🧪 Testing Reports API...\n");

  try {
    // Test 1: Check if backend is running
    console.log("1️⃣ Testing backend connectivity...");
    const healthCheck = await fetch(`${API_BASE}/health`).catch(() => null);
    if (!healthCheck) {
      console.log("❌ Backend not accessible on port 3001");
      return;
    }
    console.log("✅ Backend is running");

    // Test 2: Get report templates (should work without auth for testing)
    console.log("\n2️⃣ Testing report templates endpoint...");
    const templatesResponse = await fetch(`${API_BASE}/reports/templates`);

    if (templatesResponse.status === 401) {
      console.log("🔒 Endpoint requires authentication (expected)");
      console.log("Status:", templatesResponse.status);
    } else if (templatesResponse.ok) {
      const templates = await templatesResponse.json();
      console.log("✅ Templates loaded:", templates.count || 0);
    } else {
      console.log("❌ Unexpected response:", templatesResponse.status);
    }

    // Test 3: Check if report generation endpoint exists
    console.log("\n3️⃣ Testing report generation endpoint...");
    const generateResponse = await fetch(`${API_BASE}/reports/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    if (generateResponse.status === 401) {
      console.log("✅ Generation endpoint exists (requires auth)");
    } else {
      console.log("❓ Unexpected response:", generateResponse.status);
    }

    console.log("\n🎯 API Endpoints are accessible!");
    console.log("Next: Test with actual authentication");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

// Run the test
testReportsAPI();
