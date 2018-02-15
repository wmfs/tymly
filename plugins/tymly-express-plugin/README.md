# tymly-express-plugin
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com) [![license](https://img.shields.io/github/license/mashape/apistatus.svg)](https://github.com/wmfs/tymly/blob/master/plugins/tymly-express-plugin/LICENSE)

> Exposes the [TymlyJS](http://www.tymlyjs.io) platform via an Express.js web app.


## <a name="tuning"></a>Proxy Configuration
This plugin provides a state resource that allows a state machine to get data from a rest API.  If you are behind a firewall which, you may optionally set the PROXY_URL environment variable.  This url will should look something like 'http://[USERNAME]:[PASSWORD]@[PROXY HOST]:[PROXY PORT]'.

Note that if your on a Active Directory network, your username may need to be prefixed with a domain, followed by the three characters '%5C', to separate the domain from the username.

So for example, if your domain is called 'WORLD', your username is 'j.smith', your password is 'superhero', your proxy host is 'proxy.world.net' and your proxy port is 1234, your proxy url would look like "http://world%5Cj.smith:superhero@proxy.world.net:1234".


## <a name="tuning"></a>Tuning
By default, when invoking external web API calls, a timeout is set to 3 seconds, but this can be overridden via the optional WEB_API_TIMEOUT_IN_MS environment variable.


## <a name="license"></a>License

MIT
