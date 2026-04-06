"use strict";

const {
  BedrockRuntimeClient,
  ConverseStreamCommand,
} = require("@aws-sdk/client-bedrock-runtime");

const config = require("../config");
const { BedrockError } = require("../errors");

/**
 * Encapsulates all Bedrock ConverseStream interactions.
 * The client is created once and reused across invocations (Lambda container reuse).
 */
class BedrockService {
  constructor() {
    this.client = new BedrockRuntimeClient({ region: config.awsRegion });
    this.modelId = config.bedrockModelId;
  }

  /**
   * Build the ConverseStream input payload.
   * @param {import('../models/converse-request')} request – Validated request
   * @returns {object} ConverseStreamCommand input
   */
  _buildInput(request) {
    const inferenceConfig = {
      maxTokens: request.maxTokens,
      temperature: request.temperature,
      topP: request.topP,
    };

    if (request.stopSequences.length > 0) {
      inferenceConfig.stopSequences = request.stopSequences;
    }

    const input = {
      modelId: this.modelId,
      messages: [{ role: "user", content: [{ text: request.prompt }] }],
      inferenceConfig,
    };

    if (request.system) {
      input.system = [{ text: request.system }];
    }

    return input;
  }

  /**
   * Invoke Bedrock ConverseStream and yield text chunks.
   *
   * @param {import('../models/converse-request')} request – Validated request
   * @yields {{ text: string } | { done: true, stopReason: string }}
   * @throws {BedrockError} on SDK / network failures
   */
  async *converseStream(request) {
    const input = this._buildInput(request);

    let response;
    try {
      response = await this.client.send(new ConverseStreamCommand(input));
    } catch (err) {
      throw new BedrockError(
        `Failed to invoke Bedrock model: ${err.message}`,
        err,
      );
    }

    try {
      for await (const chunk of response.stream) {
        if (chunk.contentBlockDelta) {
          const text = chunk.contentBlockDelta.delta?.text ?? "";
          if (text) {
            yield { text };
          }
        }

        if (chunk.messageStop) {
          yield { done: true, stopReason: chunk.messageStop.stopReason ?? "" };
        }
      }
    } catch (err) {
      throw new BedrockError(
        `Bedrock stream interrupted: ${err.message}`,
        err,
      );
    }
  }
}

// Singleton — reuses the underlying TCP connection across warm invocations.
module.exports = new BedrockService();
