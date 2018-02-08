# tymly-auth-auth0-plugin
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com) [![license](https://img.shields.io/github/license/mashape/apistatus.svg)](https://github.com/wmfs/tymly/blob/master/plugins/tymly-auth-auth0-plugin/LICENSE)

> Provides auth0 utility functionality to the [TymlyJS](http://www.tymlyjs.io) platform

## <a name="install"></a>Install
```bash
$ npm install tymly-auth-auth0-plugin --save
```

Once installed, you will need to go to the auth0 management interface and create a new client (type: non-interactive).  On the settings screen, make a note of the DOMAIN, CLIENT ID and the CLIENT SECRET (these three values will need to be setup in three environment variables, respectively TYMLY_NIC_AUTH0_DOMAIN, TYMLY_NIC_AUTH0_CLIENT_ID and TYMLY_NIC_AUTH0_CLIENT_SECRET).

Scroll down to the bottom of the page and click the Show Advanced Settings link.  Click the Grant Types tab and ensure that IMPLCIT, AUTHORIZATION CODE, REFRESH TOKEN and CLIENT CREDENTIALS grants are all ticked.

Finally, on the left-hand side of the screen, click on the APIs link.  Click on the Auth0 Management API link.  Click on the Non Interactive Clients tab.  After a few moments, a list of clients will be displayed - find the non-interactive client you just created and switch the toggle next to it to the Authorized position.  Finally, in the clients scopes, find the scope "read:users", tick it and click the update button.


## <a name="tuning"></a>Proxy Configuration
It should be obvious, but please note that this plugin makes calls to various web APIs.  If you are behind a firewall which, you may optionally set the PROXY_URL environment variable.  This url will should look something like 'http://[USERNAME]:[PASSWORD]@[PROXY HOST]:[PROXY PORT]'.

Note that if your on a Active Directory network, your username may need to be prefixed with a domain, followed by the three characters '%5C', to separate the domain from the username.

So for example, if your domain is called 'WORLD', your username is 'j.smith', your password is 'superhero', your proxy host is 'proxy.world.net' and your proxy port is 1234, your proxy url would look like "http://world%5Cj.smith:superhero@proxy.world.net:1234".


## <a name="tuning"></a>Tuning
The service makes use of a cache so that expensive HTTP requests are kept to a minimum.
 - By default, the size of this cache is 500, but this can be overridden via the (optional) TYMLY_USER_CACHE_SIZE environment variable.
 - By default, entries in the cache have a lifetime of 30 minutes, but this can be overridden via the (again optional) TYMLY_USER_CACHE_MAX_AGE_IN_MS environment variable.
 - By default, when invoking external web API calls, a timeout is set to 3 seconds, but this can be overridden via the (optional, yet again) WEB_API_TIMEOUT_IN_MS environment variable.


## <a name="test"></a>Testing

Before running the tests (and indeed, using the utility functions the service provides), you'll need to set the following environment variables.

```
TYMLY_NIC_AUTH0_DOMAIN=abc.de.auth0.com
TYMLY_NIC_AUTH0_CLIENT_ID=abc...
TYMLY_NIC_AUTH0_CLIENT_SECRET=abc...
```

Once the environment variables have been set, you can run the tests like this:

```bash
$ npm test
```


## <a name="license"></a>License

MIT
