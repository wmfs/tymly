
# Tymly [![Build Status](https://travis-ci.org/wmfs/tymly.svg?branch=master)](https://travis-ci.org/wmfs/tymly) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

_An open source low-code platform that's built for collaboration_

## <a name="environment-variables"></a>Environment
This here is a [monorepo](http://www.drmaciver.com/2016/10/why-you-should-use-a-single-repository-for-all-your-companys-projects/). Each of the [packages](https://github.com/wmfs/tymly/tree/master/packages) and [plugins](https://github.com/wmfs/tymly/tree/master/plugins) maintained inside this repository are independently published on [npmjs.com](https://www.npmjs.com/).

* __Ordinarily you should refer to each package's specific installation instructions.__

### Node.js

Tymly is constructed from a collection of __[Node.js](https://nodejs.org/en/)__ packages. To use any of them you'll need to have  Node __Version 8.4.0__ (or above) installed. 

### Lerna

We use the __[Lerna](https://lernajs.io/)__ multi-repository tool for managing Tymly's constituent [Node.js](https://nodejs.org/en/) packages. To quickly install all of Tymly's dependencies (along with other useful multi-package capabilities related to testing and publishing) you'll need to install Lerna:    

```bash
$ npm install --global lerna
```

### PostgreSQL

__[PostgreSQL](https://www.postgresql.org/about/) is Tymly's database of choice.__

To do anything beyond "_Hello world!_" you'll need to have access to PostgreSQL __Version 9.6__ (or above) and have created a database before running Tymly.

* Note that Tymly refers to a `PG_CONNECTION_STRING` environment variable when establishing a pool of PostgreSQL connections, for example: 

``` bash
PG_CONNECTION_STRING=postgres://postgres:postgres@localhost:5432/my_test_db
```

Any database used by Tymly must be capable of generating universally unique identifiers - this is easily achieved by running the following statement on the receiving database:

```
CREATE EXTENSION uuid-ossp;
```


## <a name="installing"></a>Installation

> __Important:__ Each component within this repository is published on [npmjs.com](https://www.npmjs.com/) as an independent package.
For example, `pg-info` is maintained [within this repo](https://github.com/wmfs/tymly/tree/master/packages/pg-info) and published as its own separate concern [here](https://www.npmjs.com/package/pg-info). Please refer to the README.md file within each package for specific usage/installation advice.

With your environment in place, grabbing the latest Tymly (most likely because you intend to develop Tymly as opposed to _using_ one of its published packages) is a simple matter of cloning this repo and running Lerna's [bootstrap](https://lernajs.io/#command-bootstrap) command: 

```
$ git clone https://github.com/wmfs/tymly
$ cd tymly
$ lerna bootstrap
```

## <a name="test"></a>Testing

The following Lerna command will run all tests in all of Tymly's packages (and also ensures everyting meets [Standard.js](https://standardjs.com/) style rules):

``` bash
$ lerna run test
```

## <a name="documentation"></a>Documentation

* The [FlobotJS](http://www.flobotjs.io) site has a lot of information about several Tymly packages.
* Please refer to the `README.md` file inside each package for more specific information!


## <a name="license"></a>License

[MIT](https://github.com/wmfs/tymly/blob/master/LICENSE)

[![JavaScript Style Guide](https://cdn.rawgit.com/standard/standard/master/badge.svg)](https://github.com/standard/standard)
