// Quick diagnostic script to test backend connectivity
const testBackendConnection = async () => {
  const token = localStorage.getItem("accessToken");

  console.log("Testing backend connectivity...");
  console.log("Token available:", !!token);

  try {
    // Test basic health check first
    console.log("1. Testing health endpoint...");
    const healthResponse = await fetch("/api/health");
    console.log("Health check status:", healthResponse.status);

    // Test authenticated endpoint
    console.log("2. Testing authenticated endpoint...");
    const authResponse = await fetch("/api/v1/users", {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    console.log("Auth endpoint status:", authResponse.status);

    // Test our new project billing endpoints
    console.log("3. Testing project billing test endpoint...");
    const testResponse = await fetch("/api/v1/project-billing/test", {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    console.log("Project billing test status:", testResponse.status);

    if (testResponse.ok) {
      const testResult = await testResponse.json();
      console.log("Test result:", testResult);
    }

    // Test tasks endpoint with minimal params
    console.log("4. Testing tasks endpoint...");
    const tasksResponse = await fetch(
      "/api/v1/project-billing/tasks?startDate=2025-10-01&endDate=2025-10-06",
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    console.log("Tasks endpoint status:", tasksResponse.status);

    if (tasksResponse.ok) {
      const tasksResult = await tasksResponse.json();
      console.log("Tasks result:", tasksResult);
    } else {
      const errorText = await tasksResponse.text();
      console.log("Tasks error:", errorText);
    }
  } catch (error) {
    console.error("Connection test failed:", error);
  }
};

// Run the test
testBackendConnection();
