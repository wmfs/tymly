# tymly-doc-generator
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com) [![license](https://img.shields.io/github/license/mashape/apistatus.svg)](https://github.com/wmfs/tymly/blob/master/packages/tymly-doc-generator/LICENSE)

> A tool for generating static [TymlyJS](http://www.tymlyjs.io) documentation

## How to generate Tymly documentation

### Install Hugo

This tool requires that you have the [Hugo static-site generator]() installed and that the `hugo --help` command works from the command line, from any directory.

``` bash
$ npm run generate
```

### View generated content

``` bash
cd ./hugo-site
hugo server
```

* Content will be served at `http://localhost:1313/`

## <a name="license"></a>License
[MIT](https://github.com/wmfs/tymly/blob/master/LICENSE)
