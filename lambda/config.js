"use strict";

/**
 * Centralized configuration — single source of truth for all env vars and defaults.
 * Follows the singleton pattern: one frozen instance shared across the app.
 */
class Config {
  constructor() {
    // AWS region for the Bedrock client
    this.awsRegion = process.env.AWS_REGION || "eu-central-1";

    // Bedrock model inference profile ID (must be an eu.* profile)
    this.bedrockModelId = process.env.BEDROCK_MODEL_ID || "eu.amazon.nova-lite-v1:0";

    // Maximum number of tokens the model can generate (1–4096)
    this.defaultMaxTokens = parseInt(process.env.DEFAULT_MAX_TOKENS ?? "2048", 10);

    // Sampling temperature — controls randomness (0.0 = deterministic, 1.0 = creative)
    this.defaultTemperature = parseFloat(process.env.DEFAULT_TEMPERATURE ?? "0.7");

    // Top-p (nucleus sampling) — cumulative probability cutoff (0.0–1.0)
    this.defaultTopP = parseFloat(process.env.DEFAULT_TOP_P ?? "0.9");

    // Stop sequences — JSON array of strings that halt generation (e.g. '["\\n\\nHuman:"]')
    this.defaultStopSequences = JSON.parse(process.env.DEFAULT_STOP_SEQUENCES || "[]");

    // CORS allowed origin — returned in Access-Control-Allow-Origin header
    this.allowedOrigin = process.env.ALLOWED_ORIGIN || "*";

    Object.freeze(this);
  }
}

module.exports = new Config();
