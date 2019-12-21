## node-vw-carnet-lambda

A Node.js AWS Lambda with a API Gateway REST API. Uses <a href="https://www.npmjs.com/package/lambda-api">Lambda API</a> as 
application framework.


Uses <a href="https://github.com/nekman/node-vw-carnet">node-vw-carnet</a> with <a href="https://www.npmjs.com/package/chrome-aws-lambda">chrome-aws-lambda</a> to login on <a href="https://www.portal.volkswagen-we.com/portal/">Volkswagen We Connect</a> and store a _token_ in memory that can be used to do operations on the car.


To test and run locally, just run:
```bash
# start a simple server on localhost:3000 (see local-server.js)
npm start
```

### Install on AWS lambda using Cloudformation template.

This will create a API Gateway REST API protected with an API key.
(You need to manually connect the key to a usage plan).

#### Clean
```bash
# remove node_modules/ and install with npm i --production
npm run clean
```
#### Create AWS Resources
```bash
# package
./aws/package.sh.sh <aws-profile>

# deploy
./aws/package.sh.sh <aws-profile>
```