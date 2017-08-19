# pg-concat

> Takes an object with a structure for concatenating 1 or more database columns, exporting the concatenated string.

## Usage

```
const pgConcat = require('pg-concat')

const concatString = pgConcat(
    [
        { columnName: 'incident_no' },
        '/',
        { columnName: 'year', default: 1900 },
    ]
)

// concatString = 'incident_no||'/'||COALESCE(year, 1900)'
```

## <a name="install"></a>Install
```bash
$ npm install pg-concat --save
```

## <a name="license"></a>License
[MIT](https://github.com/wmfs/pg-concat/blob/master/LICENSE)
