
const mongoose = require("mongoose");

const telemetrySchema = new mongoose.Schema(
  {
    sensorId: {
      type: String,
      required: true,
      index: true
    },

    timestamp: {
      type: Date,
      required: true,
      default: Date.now
    },

    measurements: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model(
  "Telemetry",
  telemetrySchema,
  "telemetries"
);
