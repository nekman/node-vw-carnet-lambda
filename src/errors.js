export class JsonError extends Error {
  constructor(message, httpStatus = 400, code = 'bad.arguments') {
    super(message);
    this.status = httpStatus;
    this.code = code;
  }

  toJsonError() {
    return {
      status: this.status,
      code: this.code,
      message: this.message
    };
  }
}

export class TokenNotFoundError extends JsonError {
  constructor(message) {
    super(message, 404, 'token.not.found');
  }
}

export class CarnetLoginError extends JsonError {
  constructor(message) {
    super(message, 400, 'error.during.carnet.login');
  }
}

export class LoginError extends JsonError {
  constructor(message) {
    super(message, 403, 'invalid.login');
  }
}
