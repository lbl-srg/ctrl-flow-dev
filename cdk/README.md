# Welcome to your CDK TypeScript project for LBL-Linkage

If you want to deploy your app, there are a number of commands that you have to run, and they can only be performed locally for now.

There are some dependencies:

- AWS CLI (configured with credentials to your desired aws instance `~/.aws/credentials`)
- Docker
- Node
- JQ `brew install jq`

```bash
# Set the stage
export LBL_STAGE=staging

# Deploy Server and Client S3 Bucket through CDK
cd cdk
npm i
npx aws-cdk synth
npx aws-cdk deploy --require-approval never --outputs-file cdk.out/cdk-outputs.json

export API_ARN=$(jq -r .LblCdkStack${LBL_STAGE}.LbLALBArn cdk.out/cdk-outputs.json)

#Add longer timeout to give time to generate file
aws elbv2 modify-load-balancer-attributes --load-balancer-arn $API_ARN --attributes Key=idle_timeout.timeout_seconds,Value=300

# Export the LbLApiUrl and client url for cors for use in the client build
export REACT_APP_API=$(jq -r .LblCdkStack${LBL_STAGE}.LbLApiUrl cdk.out/cdk-outputs.json)/api

# Copy the templates.json file out of the server docker image
# and into /client/src/templates.json
cd ../server
docker build -t lbl-api-cdk .
id=$(docker create lbl-api-cdk)
docker cp $id:/server/scripts/templates.json ../client/src/data/templates.json
docker rm -v $id

# Build the client
cd ../client
npm i
npm run buildForS3

# Deploy the client
aws s3 rm s3://lbl-client-${LBL_STAGE}/ --recursive
aws s3 sync ./build s3://lbl-client-${LBL_STAGE}/
```
