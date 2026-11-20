const mongoose = require("mongoose");

/**
 * Default MongoDB connection options tuned for high-throughput IoT workloads.
 */
const getDefaultOptions = () => ({
  maxPoolSize: parseInt(process.env.MONGODB_MAX_POOL_SIZE, 10) || 50,
  minPoolSize: parseInt(process.env.MONGODB_MIN_POOL_SIZE, 10) || 10,
  serverSelectionTimeoutMS: parseInt(process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS, 10) || 5000,
  socketTimeoutMS: parseInt(process.env.MONGODB_SOCKET_TIMEOUT_MS, 10) || 45000,
});

/**
 * Register connection lifecycle event listeners.
 */
let listenersRegistered = false;
const registerConnectionListeners = () => {
  if (listenersRegistered) return;

  mongoose.connection.on("connected", () => {
    console.log(
      `[MongoDB] Connected successfully to host: ${mongoose.connection.host || "localhost"} | Database: ${mongoose.connection.name}`
    );
  });

  mongoose.connection.on("error", (err) => {
    console.error(`[MongoDB] Centralized Database Error: ${err.message}`);
  });

  mongoose.connection.on("disconnected", () => {
    console.warn("[MongoDB] Connection disconnected.");
  });

  mongoose.connection.on("reconnected", () => {
    console.log("[MongoDB] Connection re-established.");
  });

  listenersRegistered = true;
};

/**
 * Get readable connection state.
 * @returns {string} 'disconnected' | 'connected' | 'connecting' | 'disconnecting' | 'unknown'
 */
const getConnectionState = () => {
  const states = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };
  return states[mongoose.connection.readyState] || "unknown";
};

/**
 * Check if database is currently connected.
 * @returns {boolean}
 */
const isDBConnected = () => mongoose.connection.readyState === 1;

/**
 * Connect to MongoDB with connection pooling and error resilience.
 * @param {string} [customUri] - Optional custom connection URI (defaults to process.env.MONGODB_URI)
 * @param {object} [customOptions] - Optional custom mongoose connection options
 * @returns {Promise<typeof mongoose>}
 */
const connectDB = async (customUri, customOptions = {}) => {
  registerConnectionListeners();

  const uri = customUri || process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/nexusflow";
  const options = { ...getDefaultOptions(), ...customOptions };

  try {
    if (mongoose.connection.readyState === 1) {
      return mongoose;
    }

    const conn = await mongoose.connect(uri, options);
    return conn;
  } catch (error) {
    console.error(`[MongoDB] Connection failed: ${error.message}`);
    // In test mode, throw error for test assertions
    if (process.env.NODE_ENV === "test") {
      throw error;
    }
    // In production/server startup, exit process on critical failure
    process.exit(1);
  }
};

/**
 * Gracefully disconnect from MongoDB.
 * @returns {Promise<void>}
 */
const disconnectDB = async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log("[MongoDB] Disconnected successfully.");
    }
  } catch (error) {
    console.error(`[MongoDB] Error during disconnect: ${error.message}`);
    throw error;
  }
};

// Export default connectDB for backward compatibility with existing server.js
module.exports = connectDB;
module.exports.connectDB = connectDB;
module.exports.disconnectDB = disconnectDB;
module.exports.getConnectionState = getConnectionState;
module.exports.isDBConnected = isDBConnected;
module.exports.getDefaultOptions = getDefaultOptions;
