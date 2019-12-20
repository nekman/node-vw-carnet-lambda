# aws s3 mb s3://vw-carnet-api-s3-deploy --region eu-west-1
aws cloudformation package --template-file aws/cloudformation.yaml --output-template-file packaged.yaml --s3-bucket vw-carnet-api-s3-deploy --profile $1 --region eu-west-1
