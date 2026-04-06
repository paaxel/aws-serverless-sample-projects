output "api_gateway_stream_url" {
  description = "[PRIMARY] API Gateway REST endpoint with native response streaming. Requires x-api-key header. POST { \"prompt\": \"...\", \"system\": \"...\", \"maxTokens\": 2048 }"
  value       = "https://${aws_api_gateway_rest_api.main.id}.execute-api.${var.aws_region}.amazonaws.com/prod/stream"
}

output "api_key_id" {
  description = "API Key ID — retrieve the value with: aws apigateway get-api-key --api-key <id> --include-value"
  value       = aws_api_gateway_api_key.main.id
}

output "api_key_value" {
  description = "API Key value (sensitive)."
  value       = aws_api_gateway_api_key.main.value
  sensitive   = true
}

output "lambda_function_name" {
  description = "Lambda function name."
  value       = aws_lambda_function.bedrock_stream.function_name
}

output "lambda_function_arn" {
  description = "Lambda function ARN."
  value       = aws_lambda_function.bedrock_stream.arn
}

output "lambda_role_arn" {
  description = "Lambda execution role ARN (already has Bedrock permissions)."
  value       = aws_iam_role.lambda.arn
}


