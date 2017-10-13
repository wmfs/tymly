# pg-telepods
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com) [![license](https://img.shields.io/github/license/mashape/apistatus.svg)](https://github.com/wmfs/tymly/blob/master/packages/pg-telepods/LICENSE)




> Takes the contents of one PostgreSQL table, applies a transformation function to each row and ensures a target table is kept in sync

## <a name="install"></a>Install
```bash
$ npm install pg-telepods --save
```

## <a name="usage"></a>Usage

```javascript
const pg = require('pg')
const startTelepods = require('pg-telepods')

// Make a new Postgres client
const client = new pg.Client('postgres://postgres:postgres@localhost:5432/my_test_db')
client.connect()

// Start the Telepods...

startTelepods(
  {
    client: client,
    outputDir: '/some/temp/dir',
    source: {  
      tableName: 'springfield.people',
      hashSumColumnName: 'hash_sum'
    },
    target: {
      tableName: 'government.census',
      hashSumColumnName: 'origin_hash_sum'
    },
    join: {
      'social_security_id': 'social_security_id' // key = source table column, value = target table column
    },
    transformFunction: function (sourceRow, callback) {
      callback(null, {
        'socialSecurityId': sourceRow.socialSecurityId,
        'name': sourceRow.firstName + ' ' + sourceRow.lastName,
        'town': 'Springfield'
      })
    }
  },
  function (err) {
    // All data synchronized from people -> census.
  }
)
```

## <a name="test"></a>Testing

Before running these tests, you'll need a test PostgreSQL database available and set a `PG_CONNECTION_STRING` environment variable to point to it, for example:

```PG_CONNECTION_STRING=postgres://postgres:postgres@localhost:5432/my_test_db```


```bash
$ npm test
```


## <a name="license"></a>License
[MIT](https://github.com/wmfs/pg-telepods/blob/master/LICENSE)
