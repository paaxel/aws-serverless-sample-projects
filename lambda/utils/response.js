"use strict";

const config = require("../config");

// awslambda is a global injected by the Lambda Node.js managed runtime.

/**
 * Wrap the response stream for SSE using the managed-runtime API.
 * Returns the wrapped stream that callers must use for subsequent writes.
 */
function beginSseStream(responseStream) {
  return awslambda.HttpResponseStream.from(responseStream, {
    statusCode: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
      "Access-Control-Allow-Origin": config.allowedOrigin,
    },
  });
}

/**
 * Write a single SSE `data:` frame.
 */
function writeSseEvent(stream, data) {
  stream.write(`data: ${JSON.stringify(data)}\n\n`);
}

/**
 * Write a complete HTTP error response (non-streaming) and close the stream.
 */
function writeErrorResponse(responseStream, statusCode, message) {
  const stream = awslambda.HttpResponseStream.from(responseStream, {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": config.allowedOrigin,
    },
  });
  stream.write(JSON.stringify({ error: message }));
  stream.end();
}

module.exports = { beginSseStream, writeSseEvent, writeErrorResponse };
