# Pulumni and Terraform Comparison

Designed to be a side-by-side comparison of [Pulumi](https://www.pulumi.com/) and Terraform, two Infrastructure as Code technologies

## Differences Between The Two

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

### Links
* [Downloading/Installing - Official Docs](https://www.pulumi.com/docs/get-started/install/)
* [Fundamentals - Official Docs](https://www.pulumi.com/learn/pulumi-fundamentals/)
* [Stacks - Official Docs](https://www.pulumi.com/learn/building-with-pulumi/understanding-stacks/)