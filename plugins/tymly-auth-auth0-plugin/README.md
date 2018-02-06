# tymly-auth-auth0-plugin
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com) [![license](https://img.shields.io/github/license/mashape/apistatus.svg)](https://github.com/wmfs/tymly/blob/master/plugins/tymly-auth-auth0-plugin/LICENSE)

> Provides auth0 utility functionality to the [TymlyJS](http://www.tymlyjs.io) platform

## <a name="install"></a>Install
```bash
$ npm install tymly-auth-auth0-plugin --save
```

Once installed, you will need to go to the auth0 management interface and create a new client (type: non-interactive).  On the settings screen, make a note of the DOMAIN, CLIENT ID and the CLIENT SECRET (these three values will need to be setup in three environment variables, respectively TYMLY_NIC_AUTH_DOMAIN, TYMLY_NIC_AUTH_CLIENT_ID and TYMLY_NIC_AUTH_CLIENT_SECRET).

Scroll down to the bottom of the page and click the Show Advanced Settings link.  Click the Grant Types tab and ensure that IMPLCIT, AUTHORIZATION CODE, REFRESH TOKEN and CLIENT CREDENTIALS grants are all ticked.

Finally, on the left-hand side of the screen, click on the APIs link.  Click on the Auth0 Management API link.  Click on the Non Interactive Clients tab.  After a few moments, a list of clients will be displayed - find the non-interactive client you just created and switch the toggle next to it to the Authorized position.  Finally, in the clients scopes, find the scope "read:users", tick it and click the update button.

## <a name="test"></a>Testing

Before running the tests (and indeed, using the utility functions the service provides), you'll need to set the following environment variables.

```
TYMLY_NIC_AUTH_DOMAIN=abc.de.auth0.com
TYMLY_NIC_AUTH_CLIENT_ID=abc...
TYMLY_NIC_AUTH_CLIENT_SECRET=abc...
```

Once the environment variables have been set, you can run the tests like this:

```bash
$ npm test
```


## <a name="license"></a>License

MIT
