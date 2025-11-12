/**
 * Test edge cases for voice command handling:
 * 1. Task not present in project
 * 2. Project not present
 * 3. Various voice command scenarios
 */

require("dotenv").config();
const mongoose = require("mongoose");
const mapper = require("./dist/services/VoiceFieldMapper").default;

async function testEdgeCases() {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI ||
        "mongodb://localhost:27017/timesheet_management"
    );
    console.log("✓ Connected to MongoDB\n");

    // Test 1: Task not present in project
    console.log(
      "🧪 TEST 1: Task NOT present in project (Should now FAIL with validation error)"
    );
    console.log(
      'Command: "Update task nonexistent-task. In project Development Team. The estimated hours? 2 hours."'
    );

    const test1Data = {
      taskName: "nonexistent-task",
      projectName: "Development Team",
      estimatedHours: 2,
    };

    const result1 = await mapper.mapUpdateTask(test1Data);
    console.log("Result:", JSON.stringify(result1, null, 2));
    console.log(
      "Analysis:",
      !result1.success && result1.errors
        ? "✅ Correctly failed validation for non-existing task (NEW behavior)"
        : "❌ Should fail validation for non-existing task"
    );

    console.log("\n" + "=".repeat(60) + "\n");

    // Test 2: Project not present
    console.log("🧪 TEST 2: Project NOT present");
    console.log(
      'Command: "Update task documentation. In project NonExistent Project. The estimated hours? 3 hours."'
    );

    const test2Data = {
      taskName: "documentation",
      projectName: "NonExistent Project",
      estimatedHours: 3,
    };

    const result2 = await mapper.mapUpdateTask(test2Data);
    console.log("Result:", JSON.stringify(result2, null, 2));
    console.log(
      "Analysis:",
      result2.success
        ? "❌ Should fail when project not found"
        : "✅ Correctly failed when project not found"
    );

    console.log("\n" + "=".repeat(60) + "\n");

    // Test 3: No project context (fallback to global task search)
    console.log("🧪 TEST 3: No project context - fallback behavior");
    console.log(
      'Command: "Update task documentation. The estimated hours? 5 hours."'
    );

    const test3Data = {
      taskName: "documentation",
      estimatedHours: 5,
    };

    const result3 = await mapper.mapUpdateTask(test3Data);
    console.log("Result:", JSON.stringify(result3, null, 2));
    console.log(
      "Analysis:",
      result3.success && result3.data?.task_id
        ? "✅ Fallback to global task search worked"
        : "⚠️  Global task search failed - might need investigation"
    );

    console.log("\n" + "=".repeat(60) + "\n");

    // Test 4: Both project and task not found
    console.log("🧪 TEST 4: Both project AND task not found");
    console.log(
      'Command: "Update task ghost-task. In project Ghost Project. The estimated hours? 1 hour."'
    );

    const test4Data = {
      taskName: "ghost-task",
      projectName: "Ghost Project",
      estimatedHours: 1,
    };

    const result4 = await mapper.mapUpdateTask(test4Data);
    console.log("Result:", JSON.stringify(result4, null, 2));
    console.log(
      "Analysis:",
      result4.success
        ? "❌ Should fail when both project and task not found"
        : "✅ Correctly failed when both project and task not found"
    );

    console.log("\n" + "=".repeat(60) + "\n");

    // Test 5: Test update_project intent for comparison
    console.log("🧪 TEST 5: update_project intent mapping");
    console.log(
      'Command: "Update project Development Team. Set budget to 50000."'
    );

    const test5Data = {
      projectName: "Development Team",
      budget: 50000,
    };

    const result5 = await mapper.mapUpdateProject(test5Data);
    console.log("Result:", JSON.stringify(result5, null, 2));
    console.log(
      "Analysis:",
      result5.success
        ? "✅ update_project intent works correctly"
        : "❌ update_project intent has issues"
    );
  } catch (error) {
    console.error("❌ Test failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\n✓ Disconnected from MongoDB");
  }
}

testEdgeCases()
  .then(() => {
    console.log("\n🎉 Edge case testing completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Test crashed:", error);
    process.exit(1);
  });
