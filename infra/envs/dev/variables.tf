variable "project" {
  type        = string
  description = "Project name"
}

variable "region" {
  type        = string
  description = "AWS region"
  default     = "us-east-1"
}

variable "bucket_name" {
  type        = string
  description = "S3 bucket name for static site"
}

variable "front_origin" {
  type        = string
  description = "Origin do front (ex: https://dxxxx.cloudfront.net)"
}

# Opcional: bucket S3 separado para assets/imagens.
# Se ficar "", reutiliza o bucket_name do front.
variable "assets_bucket_name" {
  type        = string
  description = "Nome do bucket S3 de assets (opcional)"
  default     = ""
}
