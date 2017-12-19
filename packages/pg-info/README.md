# pg-info
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com) [![license](https://img.shields.io/github/license/mashape/apistatus.svg)](https://github.com/wmfs/tymly/blob/master/packages/pg-info/LICENSE)



	
> Grabs metadata from a PostgreSQL database

## <a name="install"></a>Install
```bash
$ npm install pg-info --save
```

## <a name="usage"></a>Usage

```javascript
const pg = require('pg')
const pgInfo = require('pg-info')

// Make a new Postgres client
const client = new pg.Client('postgres://postgres:postgres@localhost:5432/my_test_db')
client.connect()

pgInfo(
  {
    client: client,
    schemas: [
      'pginfo_people_test',
      'pginfo_planets_test',
      'pginfo_not_exists'
    ]    
  },
  function (err, info) {
    // Done!
    // - See below for notes about the 'info' object
  }
)
```

## <a name="api"></a>API

### pgInfo(options, callback)

### Options:
| Option  | Notes |
| ------  | ----- |
| `client`  | An already-connected [pg client](https://github.com/brianc/node-postgres/wiki/Client) or [pg pool](https://github.com/brianc/node-postgres/wiki) instance to your database |
| `schemas` | An array of schema names you'd like information about |


## <a name="output"></a>Output

> Taking a look at [the tests](https://github.com/wmfs/pg-info/blob/master/test/tests.js) is a good place to get a feel for what __pg-info__ will produce.
 
__In summary, the structure of the output is:__

* `info` object
    * `schema` object(s)
        * `table` object(s)
            * `column` object(s)
            * `index` object(s)
            * `trigger` object(s)           
            * `fkConstraint` object(s)
 
### `info` object

__Example__

```javascript
{
  generated: '2017-05-21T21:53:42.594Z',
  schemas: {} // Keys are schema names
}
```

__Properties__

| property | Type  | Notes |
| -------- | ----- | ----- |
| `generated` | `string` | Timestamp of when __pg-info__ interrogated the database |
| `schemas` | `object` | An object where the key refers to a schema name provided via the options, and the value is a `schema` object |

### `schema` object

__Example__

```javascript
{
  schemaExistsInDatabase: true,
  comment: 'Simple schema created to support testing of the pg-info package!',
  tables: {...} // Keys are table names
}
```

__Properties__

| property | Type | Notes   |
| -------- | ---- | ------- |
| `comment` | `string` | The database comment added for this schema, if available |
| `schemaExistsInDatabase` | `boolean` | Indicates if this schema is present in the database or not |
| `tables` | `object` | An object where the key refers to a table name within this schema, and the value is a `table` object |

### `table` object

__Example__

```javascript
{
  comment: 'For storing a list of planets',
  pkColumnNames: [
    'planet_name'
  ],
  columns: {...}, // Keys are column names
  indexes: {...}, // Keys are index names
  fkConstraints: {...} // Keys are foreign key constraint names
}
```

__Properties__

| property | Type | Notes |
| -------- | ---- | ----- |
| `comment` | `string` |  The database comment added for this table, if available |
| `pkColumnNames` | `[string]` | An array of column names that define this table's primary key |
| `columns` | `object` | An object where the key refers to a column name within this table, and the value is a `column` object |
| `indexes` | `object` | An object where the key refers to an index name defined for this table, and the value is an `index` object |
| `fkConstraints` | `object` | An object where the key refers to a foreign-key constraint name defined for this table, and the value is a `fkConstraint` object |

### `column` object

__Example__

```javascript
{
  array: false,
  columnDefault: null,
  isNullable: 'YES',
  dataType: 'integer',
  characterMaximumLength: null,
  numericScale: 0,
  comment: 'Age in years'
}
```

__Properties__

| property | Type | Notes |
| -------- | ---- | ----- |
| `array` | `boolean` | Is the column an array? |
| `comment` | `string` | The database comment added for this comment, if available |
| `columnDefault` | `string` | The value used to default the value of this column |
| `isNullable` | `string` | Indicates if null values are allowed in this column (`YES`) or not (`NO`) |
| `dataType` | `string` | The PostgreSQL data type assigned to this column |
| `characterMaximumLength` | `integer` | The maximum length of a string stored in this column | 
| `numericScale` | `integer` | For numeric columns, this refers to the number of digits permitted after the decimal point |

### `index` object

__Example__

```javascript
{
  columns: [
    [
      'moons_id'
    ]
  ],
  unique: false,
  method: 'btree'
}
```

__Properties__

| property | Type | Notes |
| -------- | ---- | ----- |
| `columns` | `[string]` | An array that contains the column names of the table that are covered by this index |
| `unique` | `boolean` | Indicates whether this is a unique index or not |
| `method` | `string` | The index method used, one of `btree`, `hash`, `gist` or `gin`) |

### `trigger` object

__Example__

```javascript
{
  triggers: {
    someInsertTriggerName: {
      eventManipulation: 'INSERT',      
      actionCondition: null,
      actionStatement: 'EXECUTE PROCEDURE append_inserted_craters_row()',
      actionOrientation: 'STATEMENT',
      actionTiming: 'BEFORE'
    }
  }
}
```

__Properties__

| property | Type | Notes |
| -------- | ---- | ----- |
| `eventManipulation` | `string` | Event that fires the trigger (`INSERT`, `UPDATE`, or `DELETE`) |
| `actionCondition` | `string` | `WHEN` condition of the trigger, null if none (also null if the table is not owned by a currently enabled role) |
| `actionStatement` | `string` | Statement that is executed by the trigger (currently always `EXECUTE PROCEDURE function(...)`) |
| `actionOrientation` | `string` | Identifies whether the trigger fires once for each processed row or once for each statement (`ROW` or `STATEMENT`) |
| `actionTiming` | `string` | Time at which the trigger fires (`BEFORE`, `AFTER`, or `INSTEAD OF`) |

### `fkConstraint` object

__Example__

```javascript
{
  targetTable: 'pginfo_planets_test.moons',
  sourceColumns: [
    'moons_id'
  ],
  targetColumns: [
    'id'
  ],
  updateAction: 'NO_ACTION',
  deleteAction: 'CASCADE',
  matchType: 'SIMPLE'
}
```

__Properties__

| property | Type | Notes |
| -------- | ---- | ----- |
| `targetTable` | `string` | The 'child' table that is related to this table - of the form `[schemaName].[tableName]` |
| `sourceColumns` | `[string]` | An array of foreign-key column names on this table |
| `targetColumns` | `[string]` | And this is an array of column names found the target table (often relating to its primary key) |
| `updateAction` | `string` | Identifies the update action, either `NO ACTION`, `RESTRICT`, `CASCADE`, `SET NULL` or `SET DEFAULT` |
| `deleteAction` | `string` | Identifies the delete action, either `NO ACTION`, `RESTRICT`, `CASCADE`, `SET NULL` or `SET DEFAULT` |
| `matchType` | `string` | Identifies the match type, either `FULL`, `PARTIAL`, or `SIMPLE` |

* Note the order of the columns provided in `sourceColumns` and `targetColumns` arrays correlate with each other.

## <a name="test"></a>Testing

Before running these tests, you'll need a test PostgreSQL database available and set a `PG_CONNECTION_STRING` environment variable to point to it, for example:

```PG_CONNECTION_STRING=postgres://postgres:postgres@localhost:5432/my_test_db```


```bash
$ npm test
```

## <a name="license"></a>License
[MIT](https://github.com/wmfs/pg-info/blob/master/LICENSE)
