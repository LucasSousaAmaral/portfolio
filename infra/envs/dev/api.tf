########################
# API: Lambda + HTTP API
########################

# Caminho do ZIP gerado pelo dotnet lambda package
variable "lambda_zip_path" {
  type        = string
  description = "Path to Lambda deployment zip"
}

# Role básica da Lambda (logs no CloudWatch)
resource "aws_iam_role" "lambda_role" {
  name = "${var.project}-lambda-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect = "Allow",
      Principal = { Service = "lambda.amazonaws.com" },
      Action = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_logs" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Função Lambda (.NET 8)
resource "aws_lambda_function" "api" {
  function_name = "${var.project}-api"
  role          = aws_iam_role.lambda_role.arn
  runtime       = "dotnet8"
  handler       = "Portfolio.Api"

  filename         = var.lambda_zip_path
  source_code_hash = filebase64sha256(var.lambda_zip_path)

  timeout     = 15
  memory_size = 512

  environment {
    variables = {
      ASPNETCORE_URLS    = "http://0.0.0.0:8080"
      DOTNET_ENVIRONMENT = "Production"

      DDB_PROJECTS_TABLE = aws_dynamodb_table.projects.name
      DDB_POSTS_TABLE    = aws_dynamodb_table.posts.name
      DDB_CONTACTS_TABLE = aws_dynamodb_table.contacts.name

      ASSETS_BUCKET = var.assets_bucket_name != "" ? var.assets_bucket_name : var.bucket_name
      FRONT_ORIGIN  = var.front_origin
    }
  }
}

resource "aws_apigatewayv2_api" "http_api" {
  name          = "${var.project}-http-api"
  protocol_type = "HTTP"

  cors_configuration {
    allow_credentials = false
    allow_headers     = ["*"]
    allow_methods     = ["GET","POST","PUT","PATCH","DELETE","OPTIONS"]
    allow_origins     = [var.front_origin]
  }
}

# Integração Lambda Proxy
resource "aws_apigatewayv2_integration" "lambda_integration" {
  api_id                 = aws_apigatewayv2_api.http_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.api.invoke_arn
  payload_format_version = "2.0"
}

# Rota padrão (qualquer caminho)
resource "aws_apigatewayv2_route" "any_proxy" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "$default"
  target    = "integrations/${aws_apigatewayv2_integration.lambda_integration.id}"
}

# Stage $default com deploy automático
resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.http_api.id
  name        = "$default"
  auto_deploy = true
}

# Permitir API Gateway invocar a Lambda
resource "aws_lambda_permission" "api_gateway" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http_api.execution_arn}/*/*"
}

# Output com a URL base da API
output "api_base_url" {
  value = aws_apigatewayv2_stage.default.invoke_url
}

output "assets_bucket" {
  value = var.assets_bucket_name != "" ? var.assets_bucket_name : var.bucket_name
}