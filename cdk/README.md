# Welcome to your CDK TypeScript project for LBL-Linkage

If you want to deploy your app, there are a number of commands that you have to run, and they can only be performed locally for now.

There are some dependencies:

- AWS CLI
- Docker
- Node

```bash
# Deploy Server and Client S3 Bucket through CDK
cd cdk
npm i
npx aws-cdk synth
npx aws-cdk deploy --require-approval never

# Export the LbLApiUrl for use in the client build
# There has got to be some way to grab this directly from CDK, but I have
# not been able to find it. That would remove the dependency on the aws cli
export REACT_APP_API=$(aws cloudformation describe-stacks --stack-name LblCdkStack --query "Stacks[0].Outputs[?OutputKey=='LbLApiUrl'].OutputValue" --output text)

# TODO. Copy the templates.json file out of the docker image
# and into /client/src/templates.json
cd ../server
docker build -t lbl-api-cdk .
id=$(docker create lbl-api-cdk)
docker cp $id:/server/scripts/templates.json ../client/src/data/templates.json
docker rm -v $id

# Build the client
cd ../client
npm i
npm run build

# Deploy the client
aws s3 rm s3://lbl-client/ --recursive
aws s3 sync ./build s3://lbl-client/
```
