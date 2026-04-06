"use strict";

/**
 * Custom error hierarchy for structured error handling.
 *
 * AppError         — base application error (includes HTTP status code)
 * ├─ ValidationError  — bad client input (400)
 * └─ BedrockError     — upstream Bedrock SDK failures (502)
 */

class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
  }
}

class ValidationError extends AppError {
  constructor(message) {
    super(message, 400);
  }
}

class BedrockError extends AppError {
  constructor(message, cause) {
    super(message, 502);
    this.cause = cause;
  }
}

/**
 * Maps any thrown value to a consistent { statusCode, message } shape.
 * Known AppErrors keep their code; unknown errors become 500.
 */
function normalizeError(err) {
  if (err instanceof AppError) {
    return { statusCode: err.statusCode, message: err.message };
  }

  console.error("Unhandled error:", err);
  return { statusCode: 500, message: "Internal server error" };
}

module.exports = { AppError, ValidationError, BedrockError, normalizeError };
