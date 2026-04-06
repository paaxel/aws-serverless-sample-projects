terraform {
  required_version = ">= 1.5"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 6.28.0" # response_transfer_mode + response_streaming_invoke_arn support
    }
  }

  backend "s3" {
    bucket = "bedrock-stream-poc-<YOUR_UNIQUE_ID>-tfstate"
    key    = "terraform.tfstate"
    region = "eu-central-1"
  }
}

provider "aws" {
  region  = var.aws_region
  profile = var.aws_profile
}

locals {
  name = var.stack_name
}

# ─────────────────────────────────────────────────────────────────────────────
# Primary flow (API Gateway + native streaming — Nov 2025+):
#   Browser  →  API Gateway POST /stream (x-api-key header, ResponseTransferMode: STREAM)
#           →  Lambda (Node.js streaming handler)
#           →  Bedrock ConverseStream
#
# Alternative flow (Lambda Function URL, no API Gateway):
#   Browser  →  Lambda Function URL (InvokeMode: RESPONSE_STREAM)
#           →  Bedrock ConverseStream
# ─────────────────────────────────────────────────────────────────────────────

# ── Lambda archive ───────────────────────────────────────────────────────────
# Run the Docker build in lambda/ to produce function.zip before terraform apply.
# See README § "Build the Lambda ZIP".

# ── CloudWatch Log Group ────────────────────────────────────────────────────

resource "aws_cloudwatch_log_group" "lambda" {
  name              = "/aws/lambda/${local.name}-bedrock-stream"
  retention_in_days = 14
}

# ── IAM Role ────────────────────────────────────────────────────────────────

resource "aws_iam_role" "lambda" {
  name = "${local.name}-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "basic_execution" {
  role       = aws_iam_role.lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "bedrock" {
  name = "BedrockConverseStreamPolicy"
  role = aws_iam_role.lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid    = "BedrockInvokeStream"
      Effect = "Allow"
      Action = [
        "bedrock:InvokeModelWithResponseStream",
        "bedrock:InvokeModel",
      ]
      # Covers both foundation models and cross-region inference profiles
      # (e.g. eu.*, us.* prefixed model IDs resolve to inference-profile ARNs).
      Resource = [
        "arn:aws:bedrock:*::foundation-model/*",
        "arn:aws:bedrock:*:*:inference-profile/*",
      ]
    }]
  })
}

# ── Lambda Function ─────────────────────────────────────────────────────────

resource "aws_lambda_function" "bedrock_stream" {
  function_name    = "${local.name}-bedrock-stream"
  role             = aws_iam_role.lambda.arn
  runtime          = "nodejs20.x"
  handler          = "index.handler"
  timeout          = 900   # 15 min — matches API Gateway max streaming timeout
  memory_size      = 512

  filename         = "${path.module}/function.zip"
  source_code_hash = filebase64sha256("${path.module}/function.zip")

  environment {
    variables = {
      BEDROCK_MODEL_ID       = var.bedrock_model_id
      DEFAULT_MAX_TOKENS     = tostring(var.default_max_tokens)
      DEFAULT_TEMPERATURE    = tostring(var.default_temperature)
      DEFAULT_TOP_P          = tostring(var.default_top_p)
    }
  }

  depends_on = [
    aws_cloudwatch_log_group.lambda,
    aws_iam_role_policy_attachment.basic_execution,
  ]
}


resource "aws_api_gateway_rest_api" "main" {
  name        = "${local.name}-api"
  description = "REST API with native response streaming (ResponseTransferMode: STREAM)."

  endpoint_configuration {
    types = ["REGIONAL"]
  }
}

resource "aws_api_gateway_resource" "stream" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "stream"
}

# POST /stream — native streaming

resource "aws_api_gateway_method" "stream_post" {
  rest_api_id      = aws_api_gateway_rest_api.main.id
  resource_id      = aws_api_gateway_resource.stream.id
  http_method      = "POST"
  authorization    = "NONE"
  api_key_required = true
}

resource "aws_api_gateway_integration" "stream_post" {
  rest_api_id             = aws_api_gateway_rest_api.main.id
  resource_id             = aws_api_gateway_resource.stream.id
  http_method             = aws_api_gateway_method.stream_post.http_method
  
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.bedrock_stream.response_streaming_invoke_arn
  response_transfer_mode  = "STREAM"
  timeout_milliseconds    = 900000
}

resource "aws_api_gateway_method_response" "stream_post_200" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.stream.id
  http_method = aws_api_gateway_method.stream_post.http_method
  status_code = "200"
}

# OPTIONS /stream — CORS preflight

resource "aws_api_gateway_method" "stream_options" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.stream.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "stream_options" {
  rest_api_id          = aws_api_gateway_rest_api.main.id
  resource_id          = aws_api_gateway_resource.stream.id
  http_method          = aws_api_gateway_method.stream_options.http_method
  type                 = "MOCK"
  passthrough_behavior = "WHEN_NO_MATCH"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_method_response" "stream_options_200" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.stream.id
  http_method = aws_api_gateway_method.stream_options.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration_response" "stream_options_200" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.stream.id
  http_method = aws_api_gateway_method.stream_options.http_method
  status_code = aws_api_gateway_method_response.stream_options_200.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'content-type,authorization,x-api-key'"
    "method.response.header.Access-Control-Allow-Methods" = "'POST,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
}

resource "aws_lambda_permission" "api_gateway" {
  # lambda:InvokeFunction covers both Invoke and InvokeWithResponseStreaming.
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.bedrock_stream.function_name
  principal     = "apigateway.amazonaws.com"
  # Use a wildcard stage (*) on the REST API execution ARN (guide pattern).
  # Pinning to the stage execution ARN causes AWS to validate that the
  # integration URI matches the Lambda ARN exactly — which fails when the
  # URI uses response_streaming_invoke_arn (trailing /response-streaming-invocations).
  source_arn    = "${aws_api_gateway_rest_api.main.execution_arn}/*/POST/stream"

  depends_on = [aws_api_gateway_stage.prod]
}

# ── CORS on API Gateway error responses (4xx / 5xx) ─────────────────────────
# Default gateway responses don't include CORS headers, so browsers see
# 502/504 errors as opaque network failures. These resources fix that.

resource "aws_api_gateway_gateway_response" "cors_5xx" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  response_type = "DEFAULT_5XX"

  response_parameters = {
    "gatewayresponse.header.Access-Control-Allow-Origin"  = "'*'"
    "gatewayresponse.header.Access-Control-Allow-Headers" = "'content-type,x-api-key'"
  }
}

resource "aws_api_gateway_gateway_response" "cors_4xx" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  response_type = "DEFAULT_4XX"

  response_parameters = {
    "gatewayresponse.header.Access-Control-Allow-Origin"  = "'*'"
    "gatewayresponse.header.Access-Control-Allow-Headers" = "'content-type,x-api-key'"
  }
}

# ── Deployment + Stage ───────────────────────────────────────────────────────

resource "aws_api_gateway_deployment" "main" {
  rest_api_id = aws_api_gateway_rest_api.main.id

  # Force a new deployment when any method or integration changes.
  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_resource.stream.id,
      aws_api_gateway_method.stream_post.id,
      aws_api_gateway_integration.stream_post.id,
      aws_api_gateway_method.stream_options.id,
      aws_api_gateway_integration.stream_options.id,
      aws_api_gateway_gateway_response.cors_5xx.id,
      aws_api_gateway_gateway_response.cors_4xx.id,
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }

  depends_on = [
    aws_api_gateway_method.stream_post,
    aws_api_gateway_integration.stream_post,
    aws_api_gateway_method.stream_options,
    aws_api_gateway_integration.stream_options,
  ]
}

resource "aws_api_gateway_stage" "prod" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  deployment_id = aws_api_gateway_deployment.main.id
  stage_name    = "prod"
}

# ── API Key + Usage Plan ─────────────────────────────────────────────────────

resource "aws_api_gateway_api_key" "main" {
  name    = "${local.name}-api-key"
  enabled = true
}

resource "aws_api_gateway_usage_plan" "main" {
  name = "${local.name}-usage-plan"

  api_stages {
    api_id = aws_api_gateway_rest_api.main.id
    stage  = aws_api_gateway_stage.prod.stage_name
  }

  throttle_settings {
    burst_limit = 50
    rate_limit  = 20
  }
}

resource "aws_api_gateway_usage_plan_key" "main" {
  key_id        = aws_api_gateway_api_key.main.id
  key_type      = "API_KEY"
  usage_plan_id = aws_api_gateway_usage_plan.main.id
}


