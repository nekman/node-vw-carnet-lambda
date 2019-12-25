## node-vw-carnet-lambda

A Node.js AWS Lambda with a API Gateway REST API. Uses <a href="https://www.npmjs.com/package/lambda-api">Lambda API</a> as 
application framework.


<a href="https://github.com/nekman/node-vw-carnet">node-vw-carnet</a> with <a href="https://www.npmjs.com/package/chrome-aws-lambda">chrome-aws-lambda</a> is used to login on <a href="https://www.portal.volkswagen-we.com/portal/">Volkswagen We Connect</a> and store a _token_ in memory that can be used to do operations on the car.


### Running
To run locally:
```bash
# start at localhost:3000 (see local-server.js)
npm start
```

### Developing
```bash
# install
npm i

# lint
npm run eslint

# test
npm test

# install & lint & test
npm run build-all
```

## API

#### Login
```
POST /login
```

```json
{
  "email": "<your-carnet-email>",
  "password": "<your-carnet-password>"
}
```

If email and password is used, `node-wv-carnet` is using `puppeteer` to login to the We-Connect portal. This can take long time (the request can timeout) etc. Try again if this happens.


**Response**

HTTP 201
```json5
{
    "token": "5ff11bfc-ea8f-4c2d-8307-fb1e6f78ac49",
    "options": {
        "carId": "WVWXYZ00000000000",
        "csrfToken": "abc00000",
        "cookies": [
            {
                "name": "sc_prevpage",
                "value": "Car-Net%20%3A%20Dashboard%20%3A%20General"
            }

        // ...
       ]
    }
}
```
The reponse contains one `token` and one `options` object. The `token` is be used to access the other methods in the API. 

The `options` object contains the "session" that is used to communicate
with the Volkswagen CarNet (I think that it is valid for approximately 10 minutes). 

You can also "login" with a saved options object by posting it to the `/login` endpoint instead of username/password.


#### Login with options
```
POST /login
```

```json5
{
    "options": {
      "carId": "WVWXYZ00000000000",
      "csrfToken": "abc00000",
      "cookies": [
          {
              "name": "sc_prevpage",
              "value": "Car-Net%20%3A%20Dashboard%20%3A%20General"
          }

      // ...
      ]
  }
}
```

If the options object is valid (known by Volkswagen CarNet), a new token is returned.

### Start the climate heater

The `token` can be used to call methods on the API.
```bash 
POST /startclimate

headers: {
  token: 'token',
  x-api-key: 'api-key'
}
```

### Run any node-vw-carnet client operation
POST /action?method=`<node-vw-carnet-client-method>`

Example: `getLocation`

```bash
POST /action?method=getLocation

headers: {
  token: 'token',
  x-api-key: 'api-key'
}
```

HTTP 200
```json5
{
    "errorCode": "0",
    "position": {
        "lat": 57.000000,
        "lng": 14.000000
    }
}
```


## Deploying
### Install on AWS using Cloudformation template

This will create a API Gateway REST API protected with an API key.
(You need to manually connect the key to a usage plan in the AWS console).

#### Clean
```bash
# remove node_modules/ and install with npm i --production
npm run clean
```
#### Create AWS Resources
```bash
# package
npm run cf:package <aws-profile>

# deploy
npm run cf:deploy <aws-profile>
```

