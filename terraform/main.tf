# Generated Terraform configuration

resource "aws_s3_bucket" "s3" {
  versioning = "Disabled"
  public_access = "Blocked"
}

resource "aws_dynamodb_table" "dynamodb" {
  billing_mode = "PAY_PER_REQUEST"
  hash_key = "id"
}

resource "aws_api_gateway_rest_api" "api_gateway" {
  name = "api"
  description = "REST API"
}