# pg-delta-file
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com) [![license](https://img.shields.io/github/license/mashape/apistatus.svg)](https://github.com/wmfs/tymly/blob/master/packages/pg-delta-file/LICENSE)




> Outputs change-only-update CSV files (or “delta” files) that contain all the necessary actions required to re-synchronize rows in a cloned table.

## Usage

```
const generateDeltaFile = require('pg-delta-file')

generateDeltaFiles(
  since: '2017-07-16T20:37:26.847Z',
  outputFilepath: '/some/temp/dir/people-delta.csv',   
  actionAliases: {
    insert: 'u',
    update: 'u',
    delete: 'd'
  },
  createdColumnName: '_created',
  modifiedColumnName: '_modified',

  tables: [
    {
      tableName: 'people',
      csvColumns: [
        'PERSON', // Just output a literal
        '$ACTION', // Will output 'u' or 'd'
        '$ROW_NUM', // Row counter
        '@social_security_id', /// Column data
        '@first_name',
        '@last_name',
        '@age'    
      ] 
    }
  ],
  
  // Standard callback
  function (err, info) {
    // ...
  }
)
```

## <a name="install"></a>Install
```bash
$ npm install pg-delta-file --save
```

## <a name="license"></a>License
[MIT](https://github.com/wmfs/pg-delta-file/blob/master/LICENSE)
