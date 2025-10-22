/**
 * List all collections in the database
 */

const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

// Load environment variables from backend directory
dotenv.config({ path: path.join(__dirname, ".env") });

async function listCollections() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected successfully!\n");

    const collections = await mongoose.connection.db
      .listCollections()
      .toArray();

    console.log("Collections in database:");
    collections.forEach((col) => {
      console.log(`  - ${col.name}`);
    });

    // Check approval-related collections
    console.log("\nApproval-related collections:");
    const approvalCollections = collections.filter((c) =>
      c.name.toLowerCase().includes("approval")
    );

    if (approvalCollections.length > 0) {
      for (const col of approvalCollections) {
        const count = await mongoose.connection.db
          .collection(col.name)
          .countDocuments();
        console.log(`  - ${col.name}: ${count} documents`);
      }
    } else {
      console.log("  No approval-related collections found");
    }

    await mongoose.connection.close();
    console.log("\nDone!");
  } catch (error) {
    console.error("Error:", error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

listCollections();
