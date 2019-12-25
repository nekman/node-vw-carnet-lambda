import { expect, assert } from 'chai';
import sinon from 'sinon';
import LoginService from '../src/login-service';
import { LoginError } from '../src/errors';

describe('LoginService', () => {

  /** @type {LoginService} */
  let sut;

  let fakeCarnetClient;
  let fakePage;

  let fakeLoginHandler;
  let fakeBrowser;


  beforeEach(() => {
    fakeLoginHandler = {
      createClient: sinon.stub().resolves(fakeCarnetClient)
    };

    fakeBrowser = {
      newPage: sinon.stub().resolves(fakePage),
      close: sinon.spy()
    };

    sut = new LoginService(() => fakeLoginHandler, () => fakeBrowser);
  });

  it('can login with email and password', async () => {
    // Arrange
    const email = 'user@example.com';
    const pass = 'pass123';

    // Act
    await sut.login(email, pass);

    // Assert
    const [credentials] = fakeLoginHandler.createClient.firstCall.args;

    expect(credentials.email).to.equal(email);
    expect(credentials.password).to.equal(pass);
    expect(fakeBrowser.close.called).to.equal(true);
  });

  it('throws login error if login fails', async () => {
    // Arrange
    const email = 'user@example.com';
    const pass = 'pass123';

    fakeBrowser.newPage = sinon.stub().rejects(new Error('Carnet Error'));

    try {
      // Act
      await sut.login(email, pass);
      assert.fail('expected to throw error');
    } catch (e) {
      // Assert
      expect(e).to.be.instanceOf(LoginError);
      expect(e.message).to.equal('Could not login to Car Net');
      expect(fakeBrowser.close.called).to.equal(true);
    }
  });
});
