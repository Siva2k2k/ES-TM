/**
 * Quick test for project-scoped task resolution in update_task intent
 * Tests the scenario: "Update task documentation. In project development team. The estimated hours? Four hours."
 */

require("dotenv").config();
const mongoose = require("mongoose");
const mapper = require("./dist/services/VoiceFieldMapper").default;

async function testTaskResolution() {
  try {
    // Connect to MongoDB (using same config as main app)
    const mongoUri =
      process.env.MONGODB_URI ||
      "mongodb://localhost:27017/timesheet_management";
    await mongoose.connect(mongoUri);
    console.log("✓ Connected to MongoDB");

    // Test data simulating voice command: "Update task documentation. In project development team. The estimated hours? Four hours."
    const testData = {
      taskName: "documentation",
      projectName: "Development Team",
      estimatedHours: 4,
    };

    console.log(
      "\n📝 Testing update_task intent mapping with project context..."
    );
    console.log("Input data:", testData);

    const result = await mapper.mapUpdateTask(testData);

    console.log("\n📊 Mapping Result:");
    console.log("Success:", result.success);
    console.log("Data:", JSON.stringify(result.data, null, 2));

    if (result.errors) {
      console.log("Errors:", JSON.stringify(result.errors, null, 2));
    }

    // Check if task was resolved or flagged as custom_task
    if (result.success && result.data) {
      if (result.data.task_id) {
        console.log(
          '✅ Task "documentation" was successfully resolved to existing task ID:',
          result.data.task_id
        );
      } else if (result.data.custom_task) {
        console.log(
          '⚠️  Task "documentation" was flagged as custom_task:',
          result.data.custom_task
        );
        console.log(
          '   This means the task was not found in the "Development Team" project'
        );
      }

      if (result.data.project_id) {
        console.log(
          '✅ Project "Development Team" was resolved to ID:',
          result.data.project_id
        );
      }

      if (result.data.estimatedHours) {
        console.log(
          "✅ Estimated hours mapped correctly:",
          result.data.estimatedHours
        );
      }
    }

    // Test the project-scoped resolution method directly
    console.log("\n🔍 Testing direct project-scoped task resolution...");

    // First resolve project name to get project ID
    const projectResult = await mapper.resolveNameToId(
      "Development Team",
      "project"
    );
    if (projectResult.success) {
      console.log("✓ Project resolved to ID:", projectResult.id);

      // Now test project-scoped task resolution
      const taskResult = await mapper.resolveTaskInProject(
        "documentation",
        projectResult.id
      );

      console.log("\n📋 Direct task resolution result:");
      console.log("Success:", taskResult.success);
      if (taskResult.success) {
        console.log("✅ Task ID:", taskResult.id);
      } else {
        console.log("❌ Error:", taskResult.error);
      }
    } else {
      console.log("❌ Failed to resolve project:", projectResult.error);
    }
  } catch (error) {
    console.error("❌ Test failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\n✓ Disconnected from MongoDB");
  }
}

// Run the test
testTaskResolution()
  .then(() => {
    console.log("\n🎉 Test completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Test crashed:", error);
    process.exit(1);
  });
