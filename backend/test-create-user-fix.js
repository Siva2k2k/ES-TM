/**
 * Test script for create_user intent fix
 * Tests the "Invalid Id (toString)" error fix
 */
require("dotenv").config();

const axios = require("axios");

const BASE_URL = "http://localhost:3001/api/v1";

// Test authentication credentials for a super_admin user
const TEST_AUTH = {
  email: "admin@test.com", // Replace with your super admin email
  password: "password123", // Replace with your super admin password
};

async function testCreateUserIntent() {
  try {
    console.log("🧪 Testing create_user intent fix...\n");

    // Step 1: Login to get auth token
    console.log("1. Authenticating...");
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, TEST_AUTH);

    if (!loginResponse.data.success) {
      console.error("❌ Login failed:", loginResponse.data.message);
      return;
    }

    const authToken = loginResponse.data.token;
    console.log("✅ Login successful\n");

    // Step 2: Test create_user voice intent
    console.log("2. Testing create_user intent...");

    const testUserData = {
      actions: [
        {
          intent: "create_user",
          data: {
            userName: `TestUser_${Date.now()}`,
            email: `testuser_${Date.now()}@test.com`,
            role: "employee",
            hourlyRate: 50,
          },
        },
      ],
      confirmed: true,
    };

    const voiceResponse = await axios.post(
      `${BASE_URL}/voice/execute-action`,
      testUserData,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("📊 Voice execute response:");
    console.log("Success:", voiceResponse.data.success);
    console.log(
      "Results:",
      JSON.stringify(voiceResponse.data.results, null, 2)
    );

    // Check for the specific error
    const createUserResult = voiceResponse.data.results.find(
      (r) => r.intent === "create_user"
    );

    if (createUserResult) {
      if (createUserResult.success) {
        console.log("✅ create_user intent executed successfully!");
        console.log('✅ No "Invalid Id (toString)" error detected');

        if (
          createUserResult.affectedEntities &&
          createUserResult.affectedEntities.length > 0
        ) {
          console.log(
            "✅ affectedEntities properly populated:",
            createUserResult.affectedEntities[0]
          );
        }
      } else {
        console.log("❌ create_user intent failed:", createUserResult.error);

        if (
          createUserResult.error &&
          createUserResult.error.includes("toString")
        ) {
          console.log('🐛 "Invalid Id (toString)" error still exists!');
        }
      }
    } else {
      console.log("❌ No create_user result found in response");
    }
  } catch (error) {
    console.error("❌ Test failed:", error.response?.data || error.message);

    // Check specifically for toString errors in the response
    if (
      error.response?.data?.error &&
      error.response.data.error.includes("toString")
    ) {
      console.log('🐛 "Invalid Id (toString)" error detected in API response!');
    }
  }
}

// Run the test
testCreateUserIntent()
  .then(() => {
    console.log("\n🏁 Test completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Test script error:", error.message);
    process.exit(1);
  });
