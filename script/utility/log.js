/**
 * Logs a message to the console.
 * @param {string} message The message to log.
 */
const log = (message) => console.log(message);

/**
 * Logs a debug message to the console.
 * @param {string} message The message to log.
 */
const dlog = (message) => log("DEBUG - " + message);

/**
 * Logs an info message to the console.
 * @param {string} message The message to log.
 */
const ilog = (message) => log("INFO - " + message);

/**
 * Logs a warning message to the console.
 * @param {string} message The message to log.
 */
const wlog = (message) => log("WARN - " + message);

/**
 * Logs an error message to the console.
 * @param {string} message The message to log.
 */
const elog = (message) => log("ERROR - " + message);


