# Pulumni and Terraform Comparison

Designed to be a side-by-side comparison of [Pulumi](https://www.pulumi.com/) and Terraform, two Infrastructure as Code technologies. We published a [blog based on this repository](https://formidable.com/blog/2022/pulumi-or-terraform/) that is more coherent than the ramblings that follow!

## Summary
Pulumi reminds me of what [troposphere](https://pypi.org/project/troposphere/) is for Python/CloudFormation in that they're both Infrastructure as Code that you write in a programming language. While troposphere generates CloudFormation templates, Pulumi is more like a managed Terraform service where the state and stacks are managed by Pulumi. Pulumi can be written in TypeScript, Python, Go, C#, Java or YAML (I used exclusively TypeScript in this repository). The syntax for Pulumi is VERY similar to Terraform, and frequently the biggest change was converting snake to camel case. Being fluent in Terraform was a huge help for writing in Pulumi as the syntax was so similar. The size of the resources where pretty similar in terms of number of lines.

If you're familiar with Terraform, the biggest advantage I saw with Pulumi was the ease of state management/getting started and not having to use either terragrunt, CloudFormation or a local Terraform stack to create the prerequisite S3 bucket and DynamoDB table. I prefer how variables are handled with Terraform, but it may just be that I didn't find similar functionality in Pulumi. Terraform also had some built in functions which were easier for myself, not being as familiar with the Typescript syntax. An example of this was creating a zip file and then getting a hash of that file. With Terraform, there are functions built in to handle all of this, but with Typescript, I had to look up the syntax to perform these actions. It means that Pulumi does have greater flexibility (one of my favorite "hacks" was to be able to use `console.log` to debug with Pulumi) as you're not limited to Terraform functions.

If you're not familiar with Terraform, then it may be easier to get started using Pulumi as you'll have to learn some syntax similar to Terraform either way, but at least you'll have some comfort in being able to use you're preferred programming language.

## Differences Between The Two
* State Management
  * Terraform
    * The most common solution is to create an S3 bucket and DynamoDB table to manage locks and share state with multiple users
  * Pulumi
    * State is managed by Pulumi directly
    * It's kind of like if Terraform was a managed service through Pulumi
    * I wasn't able to fully test locks as I only had a single user
      * If I ran two instances of `pulumi up` at the same time, I did not receive any kind of error like I would with Terraform
      * Pulumi does have a concept of organizations which is meant to be used when there are multiple users, but wasn't able to test this as they want you to sign up a free trial and then start paying
* Built In Functions
  * Terraform
    * Terraform has more built in functionality which you may have to handle in the programming language for Pulumi
      * This could be good or bad depending on your familiarity with the programming language
    * Examples:
      * Creating zip files: `data "archive_file" "resource_name"`
      * Getting an MD5 Hash of file: `filemd5(filename)` 
      * Creating a base64 encoded SHA-256 hash: `data.archive_file.resource_name.output_base64sha256`
  * Pulumi
    * You have to know how to do it in the programming language you are using, but may offer more flexibility
* Pulumi requires a Pulumi account and token
  * If you use an email address to set up your account, doesn't seem like you have the option to use MFA...
    * You are able to use your GitHub/GitLab/Atlassian/SAML SSO which can be secured with MFA however
  * Not sure where the token for Pulumi is stored when entered for a project
* Pulumi has a central dashboard for viewing all of your stacks
  * Does have a concept of an organization
* Think that I personally like the docs better for Pulumi compared to Terraform
  * More extensive examples and documentations
  * Frequently... the docs seem to be pulled directly from Terraform however
    * There are references to Terraform functions which don't exist in Pulumi
      * An example is [filebase64sha56](https://www.terraform.io/language/functions/filebase64sha256) on the [Pulumi Lambda function](https://www.pulumi.com/registry/packages/aws/api-docs/lambda/function/) documentation
* Easier debugging in Pulumi
  * Can do `console.log` in middle of code
* Pulumi has a tendency to replace more frequently than Terraform (rather than update)
  * Especially sensitive to resource name changes
* Pulumi assumes that changes are not made directly to resources
  * If you modify resources directly in AWS, have to run a `pulumi refresh` in order for the changes to be recognized
  * I only discovered this after the last time I made a change directly to a resource, so wasn't able to test this fully

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
* If you modify resources directly in AWS (without Pulumi), Pulumi freaks out, and you may have to refresh Pulumi
  * `pulumi refresh`
  * This will almost certainly happen if you delete a resource that was managed by Pulumi
* Viewing stacks
  * `pulumi stack ls`
* Viewing Outputs of Stacks:
  * `pulumi stack output`
* Switching to a different active stack:
  * `pulumi stack select ${NAME:?}`
* Importing:
  * `pulumi import ${resourceType:?} ${definedName:?} ${resourceName:?}`
  * Example: `pulumi import aws:iam/role:Role pulumi-pulumi-personal-lambda pulumi-terraform-personal-lambda`
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

## Links
* [Downloading/Installing - Official Docs](https://www.pulumi.com/docs/get-started/install/)
* [Fundamentals - Official Docs](https://www.pulumi.com/learn/pulumi-fundamentals/)
* [Stacks - Official Docs](https://www.pulumi.com/learn/building-with-pulumi/understanding-stacks/)
