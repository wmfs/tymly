class DummyAuthService {
  boot (options, callback) {
    options.messages.info('Dummy Auth Service')
    callback(null)
  }

  /**
   * Converts a provider user id into an email address, via an auth0 web api
   * @param {string} userId a provider use id
   * @param callback callback function, whose first parameter holds error details or {undefined}, and whose second parameter holds the email address returned by the auth0 web api
   * @returns {undefined}
   */
  getEmailFromUserId (userId, callback) {
    const emails = {
      'auth0|5a157ade1932044615a1c502': 'tymly@xyz.com'
    }

    callback(null, emails[userId])
  }
}

module.exports = {
  serviceClass: DummyAuthService,
  bootBefore: ['statebox']
}
