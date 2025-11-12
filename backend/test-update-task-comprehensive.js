// Comprehensive test for update_task intent via voice endpoints
// Testing both process-command and execute-action endpoints

console.log("=== Update Task Intent Comprehensive Testing ===\n");

// Test data based on actual projects and tasks
const testData = {
  projectName: "Development Team",
  projectId: "6911da46ebab7ac0774cb711",
  existingTask: "documentation",
  existingTaskId: "69141091995f0483f0c4979c",
  nonExistingTask: "non-existing-task",
  adminToken: null,
};

// Get authentication token
async function getAuthToken() {
  try {
    const response = await fetch("http://localhost:3001/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "admin@company.com",
        password: "admin123",
      }),
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error(`Login failed: ${data.message}`);
    }

    console.log("✅ Authentication successful");
    return data.tokens.accessToken;
  } catch (error) {
    console.error("❌ Authentication failed:", error.message);
    throw error;
  }
}

// Test process-command endpoint
async function testProcessCommand(token) {
  console.log("\n--- Testing /voice/process-command endpoint ---");

  const testCases = [
    {
      name: "Update existing task - valid scenario",
      command: `Update task documentation in project ${testData.projectName} with description "Updated documentation task" and status completed`,
      expectSuccess: true,
    },
    {
      name: "Update non-existing task - should fail validation",
      command: `Update task ${testData.nonExistingTask} in project ${testData.projectName} with status completed`,
      expectSuccess: false,
    },
    {
      name: "Update task without project context - should fail",
      command: `Update task documentation with status completed`,
      expectSuccess: false,
    },
    {
      name: "Update task with invalid project - should fail validation",
      command: `Update task documentation in project NonExistentProject with status completed`,
      expectSuccess: false,
    },
  ];

  for (const testCase of testCases) {
    console.log(`\n🧪 ${testCase.name}`);
    console.log(`Command: "${testCase.command}"`);

    try {
      const response = await fetch(
        "http://localhost:3001/api/v1/voice/process-command",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            command: testCase.command,
          }),
        }
      );

      const data = await response.json();

      if (testCase.expectSuccess) {
        if (data.success && data.actions && data.actions.length > 0) {
          console.log(`✅ SUCCESS: ${data.actions.length} action(s) processed`);
          console.log(`   Intent: ${data.actions[0].intent}`);
          console.log(`   Data: ${JSON.stringify(data.actions[0].data)}`);
        } else {
          console.log(
            `❌ UNEXPECTED FAILURE: ${data.message || "No actions returned"}`
          );
          if (data.validationErrors) {
            console.log(
              `   Validation Errors: ${JSON.stringify(data.validationErrors)}`
            );
          }
        }
      } else {
        if (!data.success) {
          console.log(
            `✅ EXPECTED FAILURE: ${
              data.message || "Command failed as expected"
            }`
          );
          if (data.validationErrors) {
            console.log(
              `   Validation Errors: ${JSON.stringify(data.validationErrors)}`
            );
          }
        } else {
          console.log(`❌ UNEXPECTED SUCCESS: Command should have failed`);
          console.log(`   Response: ${JSON.stringify(data)}`);
        }
      }
    } catch (error) {
      console.log(`❌ REQUEST ERROR: ${error.message}`);
    }
  }
}

// Test execute-action endpoint
async function testExecuteAction(token) {
  console.log("\n--- Testing /voice/execute-action endpoint ---");

  const testCases = [
    {
      name: "Execute valid task update",
      action: {
        intent: "update_task",
        data: {
          projectName: testData.projectName,
          project_id: testData.projectId,
          taskName: testData.existingTask,
          task_id: testData.existingTaskId,
          description: "Updated via API test",
          status: "InProgress",
          estimatedHours: 15,
        },
      },
      expectSuccess: true,
    },
    {
      name: "Execute task update with invalid task ID",
      action: {
        intent: "update_task",
        data: {
          projectName: testData.projectName,
          project_id: testData.projectId,
          taskName: "invalid-task",
          task_id: "507f1f77bcf86cd799439011", // Valid ObjectId but non-existent
          description: "Should fail",
          status: "InProgress",
        },
      },
      expectSuccess: false,
    },
    {
      name: "Execute task update with missing required fields",
      action: {
        intent: "update_task",
        data: {
          // Missing projectName and taskName
          description: "Should fail due to missing required fields",
        },
      },
      expectSuccess: false,
    },
  ];

  for (const testCase of testCases) {
    console.log(`\n🧪 ${testCase.name}`);

    try {
      const response = await fetch(
        "http://localhost:3001/api/v1/voice/execute-action",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            actions: [testCase.action],
          }),
        }
      );

      const data = await response.json();

      if (testCase.expectSuccess) {
        if (
          data.success &&
          data.results &&
          data.results.length > 0 &&
          data.results[0].success
        ) {
          console.log(`✅ SUCCESS: Task updated successfully`);
          console.log(`   Result: ${JSON.stringify(data.results[0])}`);
        } else {
          console.log(
            `❌ UNEXPECTED FAILURE: ${data.message || "Execution failed"}`
          );
          if (data.results && data.results.length > 0) {
            console.log(
              `   Error: ${data.results[0].message || "Unknown error"}`
            );
          }
        }
      } else {
        if (
          !data.success ||
          (data.results && data.results.length > 0 && !data.results[0].success)
        ) {
          console.log(
            `✅ EXPECTED FAILURE: ${
              data.message || data.results?.[0]?.message || "Failed as expected"
            }`
          );
        } else {
          console.log(`❌ UNEXPECTED SUCCESS: Action should have failed`);
          console.log(`   Response: ${JSON.stringify(data)}`);
        }
      }
    } catch (error) {
      console.log(`❌ REQUEST ERROR: ${error.message}`);
    }
  }
}

// Main test execution
async function runTests() {
  try {
    // Get authentication token
    const token = await getAuthToken();
    testData.adminToken = token;

    // Test process-command endpoint
    await testProcessCommand(token);

    // Test execute-action endpoint
    await testExecuteAction(token);

    console.log("\n=== Test Summary ===");
    console.log(
      "✅ All tests completed. Review output above for detailed results."
    );
  } catch (error) {
    console.error("❌ Test execution failed:", error.message);
  }
}

// Run if this script is executed directly
if (typeof window === "undefined") {
  runTests();
}

// Export for potential reuse
if (typeof module !== "undefined" && module.exports) {
  module.exports = { runTests, testProcessCommand, testExecuteAction };
}
