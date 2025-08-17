########################
# DynamoDB (on-demand) #
########################

locals {
  projects_table = "${var.project}-projects"
  posts_table    = "${var.project}-posts"
  contacts_table = "${var.project}-contacts"
}

# PROJETOS
resource "aws_dynamodb_table" "projects" {
  name         = local.projects_table
  billing_mode = "PAY_PER_REQUEST"

  hash_key = "id"

  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "status"
    type = "S"
  }

  attribute {
    name = "createdAt"
    type = "S"
  }

  global_secondary_index {
    name            = "gsi_status_createdAt"
    hash_key        = "status"
    range_key       = "createdAt"
    projection_type = "ALL"
  }

  point_in_time_recovery {
    enabled = false
  }
}

# POSTS (blog)
resource "aws_dynamodb_table" "posts" {
  name         = local.posts_table
  billing_mode = "PAY_PER_REQUEST"

  hash_key = "slug"

  attribute {
    name = "slug"
    type = "S"
  }

  attribute {
    name = "published"
    type = "S"
  }

  attribute {
    name = "publishedAt"
    type = "S"
  }

  global_secondary_index {
    name            = "gsi_published_publishedAt"
    hash_key        = "published"
    range_key       = "publishedAt"
    projection_type = "ALL"
  }

  point_in_time_recovery {
    enabled = false
  }
}

# CONTATOS
resource "aws_dynamodb_table" "contacts" {
  name         = local.contacts_table
  billing_mode = "PAY_PER_REQUEST"

  # Chave primária
  hash_key = "id"

  attribute {
    name = "id"
    type = "S"
  }

  # NÃO declare "ttl" aqui. TTL usa um atributo "solto".
  ttl {
    attribute_name = "ttl" # coluna numérica (epoch seconds)
    enabled        = true
  }

  point_in_time_recovery {
    enabled = false
  }
}

###########################
# IAM para a Lambda (CRUD)#
###########################

resource "aws_iam_role_policy" "lambda_ddb_access" {
  name = "${var.project}-lambda-ddb"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect : "Allow",
        Action : [
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:GetItem",
          "dynamodb:BatchGetItem",
          "dynamodb:BatchWriteItem",
          "dynamodb:Query",
          "dynamodb:Scan",
          "dynamodb:DescribeTable"
        ],
        Resource : [
          aws_dynamodb_table.projects.arn,
          "${aws_dynamodb_table.projects.arn}/index/*",
          aws_dynamodb_table.posts.arn,
          "${aws_dynamodb_table.posts.arn}/index/*",
          aws_dynamodb_table.contacts.arn
        ]
      }
    ]
  })
}
