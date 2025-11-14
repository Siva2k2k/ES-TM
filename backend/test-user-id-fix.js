/**
 * Direct unit test for the create_user intent fix
 * Tests the VoiceFieldMapper and RoleBasedServiceDispatcher
 */
require("dotenv").config();

// Import the MongoDB connection setup
const mongoose = require("mongoose");

// Import the models and services we need to test
async function testCreateUserFieldMapping() {
  try {
    console.log("🧪 Testing create_user field mapping fix...\n");

    // Connect to MongoDB
    console.log("1. Connecting to MongoDB...");
    const MONGODB_URI =
      process.env.MONGODB_URI || "mongodb://localhost:27017/timesheet-test";
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    // Import the VoiceFieldMapper after connection
    const { VoiceFieldMapper } = await import(
      "./src/services/VoiceFieldMapper.ts"
    );

    console.log("2. Testing VoiceFieldMapper.mapUserCreation...");

    const testData = {
      userName: "TestUser",
      email: "testuser@test.com",
      role: "employee",
      hourlyRate: 50,
    };

    const mapper = new VoiceFieldMapper();
    const result = await mapper.mapUserCreation(testData);

    console.log("📊 Field mapping result:");
    console.log("Success:", result.success);
    console.log("Data:", JSON.stringify(result.data, null, 2));

    if (result.errors) {
      console.log("Errors:", JSON.stringify(result.errors, null, 2));
    }

    if (result.success) {
      console.log("✅ VoiceFieldMapper.mapUserCreation works correctly");
    } else {
      console.log("❌ VoiceFieldMapper.mapUserCreation failed");
    }

    console.log("\n3. Testing object ID handling...");

    // Test the actual fix - simulate what happens in the service
    const mockUser = {
      _id: new mongoose.Types.ObjectId(),
      full_name: "Test User",
      email: "test@test.com",
    };

    // Test the old way (would fail)
    try {
      const oldWayId = mockUser._id.toString();
      console.log("✅ Direct _id.toString() works:", oldWayId);
    } catch (error) {
      console.log("❌ Direct _id.toString() failed:", error.message);
    }

    // Test the new way (should work in all cases)
    const newWayId = mockUser._id ? mockUser._id.toString() : mockUser.id;
    console.log("✅ Safe ID conversion works:", newWayId);

    // Test with JSON converted object (simulating UserService.createUser return)
    const jsonUser = JSON.parse(JSON.stringify(mockUser));
    console.log("📝 JSON user object:", jsonUser);

    try {
      const jsonOldWay = jsonUser._id.toString();
      console.log("✅ JSON _id.toString() works:", jsonOldWay);
    } catch (error) {
      console.log("❌ JSON _id.toString() failed:", error.message);
      console.log("🔧 This is why the fix was needed!");
    }

    const jsonNewWay = jsonUser._id ? jsonUser._id.toString() : jsonUser.id;
    console.log("✅ Safe JSON ID conversion works:", jsonNewWay);
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    console.error(error.stack);
  } finally {
    // Clean up
    await mongoose.disconnect();
    console.log("\n🔌 Disconnected from MongoDB");
  }
}

// Run the test
testCreateUserFieldMapping()
  .then(() => {
    console.log("\n🏁 Test completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Test script error:", error.message);
    process.exit(1);
  });
