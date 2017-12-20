# concrete-paths
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com) [![license](https://img.shields.io/github/license/mashape/apistatus.svg)](https://github.com/wmfs/tymly/blob/master/packages/concrete-paths/LICENSE)

> An option-laden utility which takes general glob-paths, delimited paths etc. and returns an array of absolute paths.

## <a name="install"></a>Install
```bash
$ npm install concrete-paths --save
```

## <a name="usages"></a>Usages

__Given a directory containing:__

``` bash
/stuff
  /lib
    file1.js
    file2.js
  /logs
    log1.txt
    log2.txt
  /node_modules
    /some-package1
      foo.txt
      bar.txt
    /some-package2
      foo.txt
      bar.txt
  /test    
    test1.js
    test2.js
    
```

Then `concrete-paths` can be used in the following ways:

### Usage 1: Simple glob-pattern string usage

* Please see the `glob` package's [Glob primer](https://www.npmjs.com/package/glob#glob-primer) for more information with working with glob patterns. 

```javascript
concretePaths('/stuff/**/*.js').then(
  function(result) {
    // Result:
    // [
    //   '/stuff/lib/file1.js',
    //   '/stuff/lib/file2.js',
    //   '/stuff/test/test1.js',
    //   '/stuff/test/test2.js'
    // ]
  }
)

```

### Usage 2: Single `;` delimited string
* Useful when working with values derived from environment variables

```javascript
concretePaths('/stuff/lib/*.js;/stuff/logs/*.js').then(
  function(result) {
    // Result:
    // [
    //   '/stuff/lib/file1.js',
    //   '/stuff/lib/file2.js',
    //   '/stuff/logs/log1.txt',
    //   '/stuff/logs/log2.txt'
    // ]
  }
)

```


### Usage 3: Multiple strings via array
* Mix-and-match delimited strings, globs etc. in an array of strings.
```javascript
concretePaths(
  [
    '/stuff/node_modules/some-package1/*',
    '/stuff/lib/*.js;/stuff/logs/*.js'
  ]  
).then(
  function(result) {
    // Result:
    // [
    //   '/stuff/node_modules/some-package1/foo.txt',
    //   '/stuff/node_modules/some-package1/bar.txt',
    //   '/stuff/lib/file1.js',
    //   '/stuff/lib/file2.js',
    //   '/stuff/logs/log1.txt',
    //   '/stuff/logs/log2.txt'
    // ]
  }
)

```


## <a name="api"></a>API

### `concretePaths`(`sourcePaths`, `[options]`) returns `promise`

### `sourcePaths`

### `options`
| Option  | Type | Notes |
| ------  | ----- | ------ |


## <a name="test"></a>Testing

```bash
$ npm test
```

## <a name="license"></a>License
[MIT](https://github.com/wmfs/concrete-paths/blob/master/LICENSE)
