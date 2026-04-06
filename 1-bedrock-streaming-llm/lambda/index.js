/**
 * Bedrock ConverseStream → API Gateway streaming response (Node.js).
 *
 * Compatible with BOTH:
 *   1. API Gateway REST API  (ResponseTransferMode: STREAM, Nov 2025+)
 *   2. Lambda Function URL   (InvokeMode: RESPONSE_STREAM)
 */

"use strict";

const { normalizeError } = require("./errors");
const ConverseRequest = require("./models/converse-request");
const bedrockService = require("./services/bedrock.service");
const {
  beginSseStream,
  writeSseEvent,
  writeErrorResponse,
} = require("./utils/response");

// ── Handler ──────────────────────────────────────────────────────────────────

async function _handler(event, responseStream, _context) {
  let request;
  try {
    request = ConverseRequest.fromEvent(event.body);
  } catch (err) {
    const { statusCode, message } = normalizeError(err);
    writeErrorResponse(responseStream, statusCode, message);
    return;
  }

  const sseStream = beginSseStream(responseStream);

  try {
    for await (const chunk of bedrockService.converseStream(request)) {
      writeSseEvent(sseStream, chunk);
    }
  } catch (err) {
    const { message } = normalizeError(err);
    writeSseEvent(sseStream, { error: message });
  } finally {
    sseStream.end();
  }
}

// awslambda is a global injected by the Lambda Node.js runtime.
module.exports.handler = awslambda.streamifyResponse(_handler);
