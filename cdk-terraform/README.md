# CDK for Terraform

Cloud Development Kit for Terraform (CDKTF)

## PreRequisites:
* From the `cdk-terraform` directory: `npm install`
  * Should [install CDKTF](https://learn.hashicorp.com/tutorials/terraform/cdktf-install?in=terraform/cdktf) as well

## Running Through CDKTF
* These should all be ran from the `cdk-terraform` directory
* Deploy the state stack to manage state:
  * `cdktf deploy cdk-terraform-state`
  * **This does have to be deployed before the Lambda stack**
  * State for this stack is stored locally... without the use of terragrunt, I couldn't find a way around this without having to modify the code before and after running
* Deploy the stacks:
  * `cdktf deploy lambda api-gateway cloud-front`
* Get a list of the stacks:
  * `cdktf list`
* Destroying all stacks:
  * `cdktf destroy lambda api-gateway cloud-front cdk-terraform-state`

## Running Using Native Terraform
* Running a Terraform init with migrating the state or reconfiguring:
  * `terraform -chdir=cdktf.out/stacks/lambda init -migrate-state`
  * `terraform -chdir=cdktf.out/stacks/lambda init -reconfigure`

## Starting New Project
* `cdktf init --template=typescript`