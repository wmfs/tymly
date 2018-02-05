# tymly-auth-auth0-plugin
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com) [![license](https://img.shields.io/github/license/mashape/apistatus.svg)](https://github.com/wmfs/tymly/blob/master/plugins/tymly-auth-auth0-plugin/LICENSE)

> Provides auth0 functionality to the [TymlyJS](http://www.tymlyjs.io) platform

## <a name="install"></a>Install
```bash
$ npm install tymly-auth-auth0-plugin --save
```


## <a name="test"></a>Testing

Before running the tests, you'll need to setup a number of environment variables.  The values for these variables can be found on the auth0 client settings screen.  Further, note that the values for these variables should be for a non interactive client.

```
TYMLY_AUTH_DOMAIN=abc.de.auth0.com
TYMLY_AUTH_CLIENT_ID=abc...
TYMLY_AUTH_CLIENT_SECRET=abc...
```

Once the environment variables have been set, you can run the tests like this:

```bash
$ npm test
```


## <a name="license"></a>License

MIT
