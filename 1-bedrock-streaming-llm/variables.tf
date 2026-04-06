variable "stack_name" {
  description = "Name prefix used for all resources."
  type        = string
  default     = "bedrock-stream-poc"
}

variable "aws_region" {
  description = "AWS region to deploy into."
  type        = string
  default     = "eu-central-1"
}

variable "aws_profile" {
  description = "AWS CLI profile to use."
  type        = string
  default     = "default"
}

variable "bedrock_model_id" {
  description = "Bedrock EU cross-region inference profile ID. Must be one of the supported EU models."
  type        = string
  default     = "eu.amazon.nova-lite-v1:0"

  validation {
    condition = contains([
      "eu.amazon.nova-lite-v1:0",
      "eu.amazon.nova-micro-v1:0",
      "eu.amazon.nova-pro-v1:0",
      "eu.anthropic.claude-3-5-sonnet-20241022-v2:0",
      "eu.anthropic.claude-3-5-haiku-20241022-v1:0",
      "eu.anthropic.claude-3-7-sonnet-20250219-v1:0",
      "eu.meta.llama3-2-1b-instruct-v1:0",
      "eu.meta.llama3-2-3b-instruct-v1:0",
      "eu.meta.llama3-2-11b-instruct-v1:0",
      "eu.meta.llama3-2-90b-instruct-v1:0",
    ], var.bedrock_model_id)
    error_message = "Unsupported EU Bedrock model. Choose a valid eu.* inference profile from the allowed list."
  }
}

variable "default_max_tokens" {
  description = "Default maximum tokens to generate per request (1–4096)."
  type        = number
  default     = 2048

  validation {
    condition     = var.default_max_tokens >= 1 && var.default_max_tokens <= 4096
    error_message = "default_max_tokens must be between 1 and 4096."
  }
}

variable "default_temperature" {
  description = "Default sampling temperature (0.0 = deterministic, 1.0 = creative)."
  type        = number
  default     = 0.7

  validation {
    condition     = var.default_temperature >= 0 && var.default_temperature <= 1
    error_message = "default_temperature must be between 0 and 1."
  }
}

variable "default_top_p" {
  description = "Default nucleus sampling cutoff (0.0–1.0)."
  type        = number
  default     = 0.9

  validation {
    condition     = var.default_top_p >= 0 && var.default_top_p <= 1
    error_message = "default_top_p must be between 0 and 1."
  }
}

