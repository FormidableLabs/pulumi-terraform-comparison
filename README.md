# Pulumni and Terraform Comparison

Designed to be a side-by-side comparison of [Pulumi](https://www.pulumi.com/) and Terraform, two Infrastructure as Code technologies

## Differences Between The Two
* Pulumi requires a Pulumi account and token
  * If you use an email address to set up your account, doesn't seem like you have the option to use MFA...
    * You are able to use your GitHub/GitLab/Atlassian/SAML SSO which can be secured with MFA however
  * Not sure where the token for Pulumi is stored when entered for a project
* Pulumi has a central dashboard for viewing all of your stacks
  * Does have a concept of an organization
* Think that I personally like the docs better for Pulumi compared to Terraform
* Easier debugging in Pulumi
  * Can do `console.log` in middle of code
* Pulumi has a tendency to replace rather than update
  * Updating an IAM role name caused a replace rather than an update

## Terraform

### Initializing/Setup
* From the `terraform` directory:
  * Setup Terragrunt Configuration:
    * Copy the file `terragrunt-config-example.yaml` to `terragrunt-config.yaml`
    * Modify the file according to needs
  * Use terragrunt to setup the state bucket/table:
    * `terragrunt init`

### Usage
* `terragrunt plan`
  * See pending changes
* `terragrunt apply`
  * Apply pending changes

## Pulumi

### Initializing/Setup
* Download and Install Pulumi
  * [Looks like Pulumi recommends downloading directly from them](https://www.pulumi.com/docs/get-started/install/)
  * `brew install pulumi` did work on my Linux machine however
* [Create a Pulumi account](https://app.pulumi.com/signup) (if you don't already have one)
* Creating a new project:
  * `pulumi new aws-typescript`

### Usage
* Previewing changes to be made
  * `pulumi preview`
* Deploy the stack to AWS
  * `pulumi up`
    * Will show a preview of what is going to be applied before actually doing it
* Viewing stacks
  * `pulumi stack ls`
* Switching to a different active stack:
  * `pulumi stack select ${NAME:?}`
* Destroying the stack
  * `pulumi destroy`

#### Configurations
Configurations are stored in the `Pulumi.dev.yaml` file (`dev` is the environment name)

* List all the configurations (variables) that are set
  * `pulumi config`
* Set a variable
  * `pulumi config set ${key:?} ${value:?}`
* Get a variable
  * `pulumi config get ${key:?}`

### Links
* [Downloading/Installing - Official Docs](https://www.pulumi.com/docs/get-started/install/)
* [Fundamentals - Official Docs](https://www.pulumi.com/learn/pulumi-fundamentals/)
* [Stacks - Official Docs](https://www.pulumi.com/learn/building-with-pulumi/understanding-stacks/)