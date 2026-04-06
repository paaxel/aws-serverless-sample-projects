"use strict";

const config = require("../config");
const { ValidationError } = require("../errors");

/**
 * Validated request object for a Bedrock ConverseStream call.
 *
 * Constructed from the raw HTTP body — all fields are validated and
 * fall back to the centralised Config defaults when omitted.
 */
class ConverseRequest {
  /**
   * @param {object} params
   * @param {string}   params.prompt         – User message text (required)
   * @param {string}   [params.system]       – Optional system prompt to steer behaviour
   * @param {number}   [params.maxTokens]    – Max tokens to generate (1–4096)
   * @param {number}   [params.temperature]  – Sampling temperature (0.0–1.0)
   * @param {number}   [params.topP]         – Nucleus sampling cutoff (0.0–1.0)
   * @param {string[]} [params.stopSequences] – Sequences that stop generation (max 4)
   */
  constructor({ prompt, system, maxTokens, temperature, topP, stopSequences }) {
    // ── prompt (required) ────────────────────────────────────────────
    if (!prompt || typeof prompt !== "string") {
      throw new ValidationError('"prompt" field is required and must be a non-empty string');
    }
    this.prompt = prompt.trim();

    // ── system (optional string) ─────────────────────────────────────
    if (system !== undefined && typeof system !== "string") {
      throw new ValidationError('"system" must be a string');
    }
    this.system = system ?? undefined;

    // ── maxTokens (1–4096) ───────────────────────────────────────────
    this.maxTokens = this._parseIntInRange(
      "maxTokens", maxTokens, config.defaultMaxTokens, 1, 4096,
    );

    // ── temperature (0.0–1.0) ────────────────────────────────────────
    this.temperature = this._parseFloatInRange(
      "temperature", temperature, config.defaultTemperature, 0, 1,
    );

    // ── topP (0.0–1.0) ──────────────────────────────────────────────
    this.topP = this._parseFloatInRange(
      "topP", topP, config.defaultTopP, 0, 1,
    );

    // ── stopSequences (array of strings, max 4) ─────────────────────
    this.stopSequences = this._parseStopSequences(
      stopSequences ?? config.defaultStopSequences,
    );

    Object.freeze(this);
  }

  // ── Validation helpers ───────────────────────────────────────────────

  _parseIntInRange(name, value, defaultValue, min, max) {
    const v = value !== undefined ? parseInt(value, 10) : defaultValue;
    if (Number.isNaN(v) || v < min || v > max) {
      throw new ValidationError(`"${name}" must be an integer between ${min} and ${max}`);
    }
    return v;
  }

  _parseFloatInRange(name, value, defaultValue, min, max) {
    const v = value !== undefined ? parseFloat(value) : defaultValue;
    if (Number.isNaN(v) || v < min || v > max) {
      throw new ValidationError(`"${name}" must be a number between ${min} and ${max}`);
    }
    return v;
  }

  _parseStopSequences(value) {
    if (!Array.isArray(value)) {
      throw new ValidationError('"stopSequences" must be an array of strings');
    }
    if (value.length > 4) {
      throw new ValidationError('"stopSequences" supports at most 4 entries');
    }
    if (!value.every((s) => typeof s === "string")) {
      throw new ValidationError('"stopSequences" entries must all be strings');
    }
    return value;
  }

  /**
   * Factory — parse a raw Lambda event body into a ConverseRequest.
   * @param {string|object} rawBody – event.body (JSON string or already parsed)
   * @returns {ConverseRequest}
   */
  static fromEvent(rawBody) {
    let body;
    try {
      body = typeof rawBody === "string" ? JSON.parse(rawBody || "{}") : rawBody ?? {};
    } catch {
      throw new ValidationError('"body" must be valid JSON');
    }
    return new ConverseRequest(body);
  }
}

module.exports = ConverseRequest;
