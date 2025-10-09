const mongoose = require("mongoose");
const path = require("path");

// Load environment variables
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/estm-claude"
    );
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

// Define BillingRate schema (simplified for seeding)
const BillingRateSchema = new mongoose.Schema(
  {
    entity_type: { type: String, required: true },
    entity_id: { type: mongoose.Schema.Types.ObjectId },
    rate_type: { type: String, default: "hourly" },
    standard_rate: { type: Number, required: true },
    overtime_rate: { type: Number },
    holiday_rate: { type: Number },
    weekend_rate: { type: Number },
    effective_from: { type: Date, required: true },
    effective_to: { type: Date },
    minimum_increment: { type: Number, default: 15 },
    rounding_rule: { type: String, default: "nearest" },
    description: { type: String },
    is_active: { type: Boolean, default: true },
    created_by: { type: mongoose.Schema.Types.ObjectId, required: true },
    deleted_at: { type: Date },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

const BillingRate = mongoose.model("BillingRate", BillingRateSchema);

// Get or create a system user for seeding
const getSystemUser = async () => {
  const User = mongoose.model(
    "User",
    new mongoose.Schema(
      {
        email: String,
        full_name: String,
        role: String,
        is_active: Boolean,
      },
      { timestamps: true }
    )
  );

  let systemUser = await User.findOne({ email: "system@billing.seed" });

  if (!systemUser) {
    systemUser = new User({
      email: "system@billing.seed",
      full_name: "System Seed User",
      role: "system",
      is_active: true,
    });
    await systemUser.save();
    console.log("Created system user for billing rate seeding");
  }

  return systemUser._id;
};

// Seed billing rates
const seedBillingRates = async () => {
  try {
    await connectDB();

    // Check if global rate already exists
    const existingGlobalRate = await BillingRate.findOne({
      entity_type: "global",
      is_active: true,
    });

    if (existingGlobalRate) {
      console.log(
        "Global billing rate already exists:",
        existingGlobalRate.standard_rate
      );
      return;
    }

    const systemUserId = await getSystemUser();

    // Create global default billing rate
    const globalRate = new BillingRate({
      entity_type: "global",
      rate_type: "hourly",
      standard_rate: 75, // $75/hour standard rate
      overtime_rate: 112.5, // 1.5x overtime rate
      weekend_rate: 90, // 1.2x weekend rate
      holiday_rate: 150, // 2x holiday rate
      effective_from: new Date("2025-01-01"),
      effective_to: null, // No end date
      minimum_increment: 15, // 15-minute increments
      rounding_rule: "nearest", // Round to nearest increment
      description:
        "Global default hourly billing rate for all users/projects without specific rates",
      is_active: true,
      created_by: systemUserId,
    });

    await globalRate.save();
    console.log("✅ Global billing rate created successfully:");
    console.log(`   Standard Rate: $${globalRate.standard_rate}/hour`);
    console.log(`   Overtime Rate: $${globalRate.overtime_rate}/hour`);
    console.log(`   Weekend Rate: $${globalRate.weekend_rate}/hour`);
    console.log(`   Holiday Rate: $${globalRate.holiday_rate}/hour`);

    // Optionally create some role-based rates
    const roleRates = [
      { role: "senior_developer", rate: 100 },
      { role: "developer", rate: 85 },
      { role: "junior_developer", rate: 65 },
      { role: "project_manager", rate: 120 },
      { role: "designer", rate: 80 },
    ];

    for (const roleData of roleRates) {
      const roleRate = new BillingRate({
        entity_type: "role",
        rate_type: "hourly",
        standard_rate: roleData.rate,
        overtime_rate: roleData.rate * 1.5,
        weekend_rate: roleData.rate * 1.2,
        holiday_rate: roleData.rate * 2,
        effective_from: new Date("2025-01-01"),
        effective_to: null,
        minimum_increment: 15,
        rounding_rule: "nearest",
        description: `Billing rate for ${roleData.role} role`,
        is_active: true,
        created_by: systemUserId,
      });

      await roleRate.save();
      console.log(
        `✅ Created rate for ${roleData.role}: $${roleData.rate}/hour`
      );
    }

    console.log("\n🎉 Billing rates seeded successfully!");
    console.log(
      "Your ProjectBillingController should now work without errors."
    );
  } catch (error) {
    console.error("❌ Error seeding billing rates:", error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log("Database connection closed");
  }
};

// Run the seeding
if (require.main === module) {
  seedBillingRates();
}

module.exports = { seedBillingRates };
