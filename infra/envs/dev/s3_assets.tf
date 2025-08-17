locals {
  effective_assets_bucket = var.assets_bucket_name != "" ? var.assets_bucket_name : var.bucket_name
}

# Se quiser bucket separado para assets, crie-o quando assets_bucket_name estiver definido
resource "aws_s3_bucket" "assets" {
  count  = var.assets_bucket_name != "" ? 1 : 0
  bucket = var.assets_bucket_name
}

resource "aws_s3_bucket_public_access_block" "assets_block" {
  count                   = var.assets_bucket_name != "" ? 1 : 0
  bucket                  = aws_s3_bucket.assets[0].id
  block_public_acls       = true
  block_public_policy     = true
  restrict_public_buckets = true
  ignore_public_acls      = true
}

# CORS para permitir PUT do browser via URL assinada
resource "aws_s3_bucket_cors_configuration" "assets_cors" {
  bucket = var.assets_bucket_name != "" ? aws_s3_bucket.assets[0].id : var.bucket_name

  cors_rule {
    allowed_methods = ["PUT","HEAD","GET"]
    allowed_origins = [var.front_origin]  # ex: https://d23txfksmcxujg.cloudfront.net
    allowed_headers = ["*"]
    max_age_seconds = 300
  }
}

resource "aws_iam_policy" "lambda_assets_put" {
  name        = "${var.project}-lambda-assets-put"
  description = "Permite a Lambda assinar uploads (S3 PutObject/GetObject) no bucket de assets"
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect   = "Allow",
        Action   = ["s3:PutObject", "s3:GetObject"],
        Resource = "arn:aws:s3:::${local.effective_assets_bucket}/*"
      }
    ]
  })
}


resource "aws_iam_role_policy_attachment" "lambda_assets_put_attach" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = aws_iam_policy.lambda_assets_put.arn
}