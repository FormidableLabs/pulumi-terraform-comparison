# Pulumni and Terraform Comparison

Designed to be a side-by-side comparison of [Pulumi](https://www.pulumi.com/) and Terraform, two Infrastructure as Code technologies

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