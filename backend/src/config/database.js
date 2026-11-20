const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log("MongoDB connected successfully");

    const db = mongoose.connection.db;
    const collections = await db.listCollections(
      { name: "telemetries" }
    ).toArray();

    if (collections.length === 0) {
      await db.createCollection("telemetries", {
        timeseries: {
          timeField: "timestamp",
          metaField: "sensorId",
          granularity: "seconds"
        }
      });

      console.log("MongoDB Time-Series collection created");
    } else {
      console.log("Telemetry collection already exists");
    }

  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;