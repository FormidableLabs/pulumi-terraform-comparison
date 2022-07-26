# Pulumni and Terraform Comparison

Designed to be a side-by-side comparison of [Pulumi](https://www.pulumi.com/) and Terraform, two Infrastructure as Code technologies

## Differences Between The Two
* Pulumi requires a Pulumi account and token
  * If you use an email address to set up your account, doesn't seem like you have the option to use MFA...
    * You are able to use your GitHub/GitLab/Atlassian/SAML SSO which can be secured with MFA however
  * Not sure where the token for Pulumi is stored when entered for a project

## Terraform

### Initializing
* From the `terraform` directory:
  * Setup Terragrunt Configuration:
    * Copy the file `terragrunt-config-example.yaml` to `terragrunt-config.yaml`
    * Modify the file according to needs
  * Use terragrunt to setup the state bucket/table:
    * `terragrunt init`
  * Terragrunt usage:
    * `terragrunt plan`
    * `terragrunt apply`

## Pulumi

### Initializing
* Download and Install Pulumi
  * [Looks like Pulumi recommends downloading directly from them](https://www.pulumi.com/docs/get-started/install/)
  * `brew install pulumi` did work on my Linux machine however
* [Create a Pulumi account](https://app.pulumi.com/signup) (if you don't already have one)
* Creating a new project:
  * `pulumi new aws-typescript`

### Links
* [Downloading/Installing - Official Docs](https://www.pulumi.com/docs/get-started/install/)
* [Fundamentals - Official Docs](https://www.pulumi.com/learn/pulumi-fundamentals/)
* [Stacks - Official Docs](https://www.pulumi.com/learn/building-with-pulumi/understanding-stacks/)