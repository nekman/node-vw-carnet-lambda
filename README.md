### node-vw-carnet-lambda

Example of how the <a href="https://github.com/nekman/node-vw-carnet">node-vw-carnet</a> module can be used in a AWS Lambda.

#### Running locally

To test and run locally, just run:
```
npm run local
```

#### Install on AWS lambda using Cloudformation template.

This will create a API Gateway REST API protected with an API key.
(You need to manually connect the key to a usage plan).

```bash
# installing
rm -rf node_modules/ && npm i --production

# package
./aws/package.sh.sh <aws-profile>

# deploy
./aws/package.sh.sh <aws-profile>
```