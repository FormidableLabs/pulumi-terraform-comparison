locals {
  config = yamldecode(file("terragrunt-config.yaml"))
}

inputs = {
  project_name = local.config.environment.project_name
  unique_identifier = local.config.environment.unique_identifier
  region = local.config.environment.aws_region
  working_dir = get_terragrunt_dir()
}

dependencies {
  paths = ["../lambda"]
}

terraform {
  source = ".///"

  extra_arguments "env" {
    commands = ["init", "apply", "refresh", "import", "plan", "taint", "untaint"]
  }

  extra_arguments "init_args" {
    commands = [
      "init"
    ]

    # Always treat remote backend state as controlling.
    arguments = [
      "--reconfigure",
    ]
  }
}

remote_state {
  backend = "s3"

  config = {
    region = local.config.environment.aws_region

    bucket  = "${local.config.environment.project_name}-${local.config.environment.unique_identifier}-remote-state"
    key     = "terraform.tfstate"
    encrypt = true

    dynamodb_table = "${local.config.environment.project_name}-${local.config.environment.unique_identifier}-remote-locks"
  }
}