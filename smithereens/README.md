# smithereens
[![Build Status](https://travis-ci.org/wmfs/smithereens.svg?branch=master)](https://travis-ci.org/wmfs/smithereens) [![Standard - JavaScript Style Guide](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)

> Smash CSV files into more manageable files based on column values

## <a name="install"></a>Install
```bash
$ npm install smithereens --save
```

## <a name="usage"></a>Usage

```javascript
const smithereens = require('smithereens')

smithereens(
  [
    '/some/input/csv/files/people.csv'

    // people.csv:
    //
    // personNo,firstName,LastName,personType,action
    // 10,"Lisa","Simpson","c","u"
    // 20,"Homer","Simpson","a","u"
    // 30,"Bart","Simpson","c","d"
    // 40,"Marge","Simpson","a","d"
    // 50,"Maggie","Simpson","c","x"
    // 60,"Grampa","Simpson","x","u"
    // 70,"Milhouse","Van Houten","c","u"

  ],
  {
  
    outputDirRootPath: '/some/output/dir',

    parser: {
      quote: '"',
      delimiter: ',',
      newline: '\n',
      skipFirstLine: true,
      trimWhitespace: true
    },
  
    dirSplits: [
      {
        columnIndex: 3,
        valueToDirMap: {
          'c': 'children',
          'a': 'adults'
        }
      }
    ],
    
    fileSplits: {
      columnIndex: 4,
      valueToFileMap: {
        'u': {
          filename: 'changes',
          outputColumns: [
            {name: 'person_no', columnIndex: 0},
            {name: 'first_name', columnIndex: 1},
            {name: 'last_name', columnIndex: 2}
          ]
        },
        'd': {
          filename: 'deletes',
          outputColumns: [
            {name: 'person_no', columnIndex: 0}
          ]
        }
      }
    }
  },
  
  function (err, manifest) {
  
    // File output
    // -----------
    //   /some/output/dir
    //   ./adults
    //     changes.csv:
    //       person_no,first_name,last_name
    //       20,Homer,Simpson
    //     deletes.csv:
    //       person_no
    //       40
    //   ./children
    //     changes.csv:
    //       person_no,first_name,last_name
    //       10,Lisa,Simpson
    //       70,Milhouse,Van Houten
    //     deletes.csv:
    //       person_no
    //       30
    //     unknown.csv:
    //       50,Maggie,Simpson,c,x    
    //   ./unknown
    //     changes.csv:
    //       person_no,first_name,last_name
    //       60,Grampa,Simpson

  }
)

```

## smithereens(`sourceFilePaths`, `options`, `callback`)

| Arg | Type | Description |
| --- | ---- | ----------- |
| `sourceFilePaths` | `string` \| `[string]`  | A string or an array of strings identifying one or more files. Uses `glob` so `/some/dir/*.csv` style patterns are supported, as is directory recursion via `/some/dir/**/*.csv` |
| `options`         | `object`   | An object configuring how output should be produced. See [Options](#options) for more information. |
| `callback`        | `function` | To be of the form `function(err, manifest)`. Manifest contains a summary of the output files produced. |

## <a name="options"></a>Options

| Property | Type | Description |
| --- | ---- | ----------- |
| `outputDirRootPath` | `string` | An absolute directory path where to write output to. All missing directories will be created. |
| `parser` | `object` | An `parser` object for configuring how input CSV files should be parsed. |
| `dirSplits` | `[object]` | An array of of `dirSplit` objects |
| `fileSplits` | `object` | A `fileSplit` object |

### `parser` object

Configures how to parse incoming CSV lines. Uses [csv-streamify](https://www.npmjs.com/package/csv-streamify) under the bonnet.   

| Property | Type | Description |
| --- | ---- | ----------- |
| `skipFirstLine` | `boolean` | Should the first line of each file be ignored? Set to `true` if files include a header line, for example. |
| `delimiter` | `string` | Comma, semicolon, whatever - defaults to comma. |
| `newline` | `string` | Newline character (use \\r\\n for CRLF files).  |
| `quote` | `string` | What's considered a quote. |
| `empty` | `string` | Empty fields are replaced by this value. |

### `dirSplit` object

Smithereens can break CSV files across a nested set of directories based on values defined in each line. 

| Property | Type | Description |
| --- | ---- | ----------- |
| `columnIndex` | `integer` | Each line of each CSV file will be parsed into an array of strings. This value identifies which value to split on. |
| `valueToDirMap` | `object` | A simple mapping of an expected string value (as identified by `columnIndex`) and the directory name that this line should be routed to. |

### `fileSplit` object

In a similar way, Smithereens can route lines to different files, based on the contents of a parsed CSV column. 

| Property | Type | Description |
| --- | ---- | ----------- |
| `columnIndex` | `integer`  | Identifies which of the parsed string values from each CSV line should be used to determine a filename that a row should be routed to. |
| `valueToFileMap` | `object`  | A key/value map where key is a string value that is expected via `columnIndex` and value is a `file` object. |

### `file` object

Defines which filename a CSV row should be routed to, along with some output-formatting configuration. 

| Property | Type | Description |
| --- | ---- | ----------- |
| `filename` | `string` | The filename which a row should be routed to. All output files will be in CSV format. Note that the `.csv` extension is added automatically, so don't include it here. |
| `outputColumns` | `[object]` | An array of objects - each defining a column that should appear in the output file. Each object in this array should contain two properties: `name` refers to the column header name (as included in the first line of each output file) and `columnIndex` identifies a value in the parsed incoming CSV array to use. |


## <a name="test"></a>Testing


```bash
$ npm test
```

## <a name="license"></a>License
[MIT](https://github.com/wmfs/smithereens/blob/master/LICENSE.md)
