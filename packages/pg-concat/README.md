# pg-concat
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com) [![license](https://img.shields.io/github/license/mashape/apistatus.svg)](https://github.com/wmfs/tymly/blob/master/packages/pg-concat/LICENSE)




> Takes an array of parts and returns the necessary PostgreSQL expression to concatenate them.

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
