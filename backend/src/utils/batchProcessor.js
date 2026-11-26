/**
 * Batch processing utilities optimized for high-throughput IoT writes.
 */

/**
 * Splits an array into smaller chunks to prevent memory spikes and
 * stay within MongoDB BSON packet size limits.
 *
 * @param {Array} array - Array to split
 * @param {number} [chunkSize=1000] - Maximum elements per chunk
 * @returns {Array<Array>} Array of chunk arrays
 */
const chunkArray = (array, chunkSize = 1000) => {
  if (!Array.isArray(array)) {
    return [];
  }
  const size = Math.max(1, parseInt(chunkSize, 10) || 1000);
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

/**
 * High-resolution timer helper for benchmarking write throughput.
 *
 * @returns {() => number} Function returning elapsed time in milliseconds
 */
const startTimer = () => {
  const start = process.hrtime.bigint();
  return () => {
    const end = process.hrtime.bigint();
    return Number(end - start) / 1_000_000; // Convert nanoseconds to milliseconds
  };
};

module.exports = {
  chunkArray,
  startTimer,
};
