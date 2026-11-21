const mongoose = require("mongoose");

/**
 * Telemetry Schema configured as a MongoDB Time-Series collection.
 * Optimized for high-throughput IoT writes, automated columnar compression,
 * and efficient time-range aggregation queries.
 */
const telemetrySchema = new mongoose.Schema(
  {
    timestamp: {
      type: Date,
      required: [true, "Telemetry timestamp is required"],
      default: Date.now,
      index: true,
    },
    metadata: {
      deviceId: {
        type: String,
        required: [true, "Device ID is required in metadata"],
        trim: true,
      },
      sensorId: {
        type: String,
        required: [true, "Sensor ID is required in metadata"],
        trim: true,
      },
    },
    measurements: {
      type: Map,
      of: Number,
      default: {},
      validate: {
        validator: function (v) {
          if (!v) return true;
          for (const [key, val] of v.entries()) {
            if (typeof val !== "number" || isNaN(val)) {
              return false;
            }
          }
          return true;
        },
        message: "All measurement values must be valid numbers",
      },
    },
  },
  {
    // MongoDB Time-Series Collection Configuration
    timeseries: {
      timeField: "timestamp",
      metaField: "metadata",
      granularity: "seconds",
    },
    timestamps: false,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        // Flatten metadata for clean API representation
        if (ret.metadata) {
          ret.deviceId = ret.metadata.deviceId;
          ret.sensorId = ret.metadata.sensorId;
          delete ret.metadata;
        }
        // Convert measurements Map to plain JavaScript object if needed
        if (ret.measurements instanceof Map) {
          ret.measurements = Object.fromEntries(ret.measurements);
        }
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        if (ret.metadata) {
          ret.deviceId = ret.metadata.deviceId;
          ret.sensorId = ret.metadata.sensorId;
          delete ret.metadata;
        }
        if (ret.measurements instanceof Map) {
          ret.measurements = Object.fromEntries(ret.measurements);
        }
        return ret;
      },
    },
  }
);

// Compound indexes for high-speed sensor and device time-range lookups
telemetrySchema.index({ "metadata.sensorId": 1, timestamp: -1 });
telemetrySchema.index({ "metadata.deviceId": 1, timestamp: -1 });
telemetrySchema.index({ "metadata.deviceId": 1, "metadata.sensorId": 1, timestamp: -1 });

// Virtual getters for direct field access
telemetrySchema.virtual("deviceId").get(function () {
  return this.metadata ? this.metadata.deviceId : undefined;
});

telemetrySchema.virtual("sensorId").get(function () {
  return this.metadata ? this.metadata.sensorId : undefined;
});

/**
 * Helper method to construct a standard Telemetry document structure
 * from an incoming REST API payload.
 *
 * @param {object} payload
 * @param {string} payload.deviceId
 * @param {string} payload.sensorId
 * @param {string|Date} [payload.timestamp]
 * @param {object} [payload.measurements]
 * @returns {object} Formatted document ready for insertion
 */
telemetrySchema.statics.formatIncomingPayload = function (payload) {
  if (!payload || typeof payload !== "object") {
    throw new Error("Payload must be a valid object");
  }

  const { deviceId, sensorId, timestamp, measurements = {} } = payload;

  return {
    timestamp: timestamp ? new Date(timestamp) : new Date(),
    metadata: {
      deviceId: deviceId ? String(deviceId).trim() : undefined,
      sensorId: sensorId ? String(sensorId).trim() : undefined,
    },
    measurements: measurements instanceof Map ? measurements : new Map(Object.entries(measurements)),
  };
};

const Telemetry = mongoose.model("Telemetry", telemetrySchema);

module.exports = Telemetry;

