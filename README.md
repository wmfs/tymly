
# Tymly [![Build Status](https://travis-ci.org/wmfs/tymly.svg?branch=master)](https://travis-ci.org/wmfs/tymly) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

> An open source low-code platform built for collaboration

## <a name="installing"></a>Installing

Note this is a [Lerna](https://lernajs.io/) multi-repository to help manage Tymly's many constituent [Node.js](https://nodejs.org/en/) packages.

```bash
$ npm install --global lerna
$ git clone https://github.com/wmfs/tymly
$ cd tymly
$ lerna bootstrap
```

## <a name="environment-variables"></a>Environment 

### Node.js

Tymly is constructed from a collection of [Node.js](https://nodejs.org/en/) packages.
Please ensure you have installed Node __Version 8.4.0__ or above. 

### PostgreSQL

Tymly uses [PostgreSQL](https://www.postgresql.org/about/) for all its database needs. 
You'll therefore need to have access to PostgreSQL __Version 9.6__ or above and have created a database before running Tymly.   


* Note that Tymly refers to a `PG_CONNECTION_STRING` environment variable when establishing a pool of PostgreSQL connections, for example: 

``` bash
PG_CONNECTION_STRING=postgres://postgres:postgres@localhost:5432/my_test_db
```

Also, Tymly will require any database it uses to be capable of generating universally unique identifiers - this is easily achieved by running the following PostgreSQL statement on the appropriate database:

```
CREATE EXTENSION uuid-ossp;
```

## <a name="test"></a>Testing

``` bash
$ lerna run test
```


## <a name="running"></a>Running

* Please see the [flobot-runner](https://github.com/wmfs/tymly/tree/master/packages/flobot-runner) package for details about configuring and starting a [FlobotJS](http://www.flobotjs.io) server.

## <a name="documentation"></a>Documentation

* The [FlobotJS](http://www.flobotjs.io) site has a lot of information about several Tymly packages.
* Please refer to the `README.md` file inside each package for more specific information!


## <a name="license"></a>License

[MIT](https://github.com/wmfs/tymly/blob/master/LICENSE)

[![JavaScript Style Guide](https://cdn.rawgit.com/standard/standard/master/badge.svg)](https://github.com/standard/standard)