variable "region" {
  description = "The deploy target region in AWS"
  type = string
}

variable "project_name" {
  description = "Identifier for this project"
  type = string
}

variable "unique_identifier" {
  description = "A unique identifier for this particular deployment"
  type = string
}