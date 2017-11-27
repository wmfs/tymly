# address-matcher
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com) [![license](https://img.shields.io/github/license/mashape/apistatus.svg)](https://github.com/wmfs/tymly/blob/master/packages/pg-delta-file/LICENSE)




> A package to link two database tables by addresses

## Usage

```
const addressMatch = require('address-matcher')

addressMatch(
    {
     source: {
       schema: 'link_test',
       table: 'food',
       id: 'fhrsid',
       type: 'bigint'
     },
     target: {
       schema: 'link_test',
       table: 'addressbase',
       id: 'uprn',
       type: 'bigint'
     },
     link: {
       schema: 'link_test_results',
       table: 'food_addressbase',
       map: {
         postcode: {
           source: 'postcode',
           target: 'postcode'
         },
         businessName: {
           source: ['business_name', 'address_line_1'],
           target: ['organisation_name', 'organisation', 'building_name']
         }
       }
     }
    }, 
    client, 
    (err) => {
        // Callback
    }
)
```

The package will look at the options and try to match the records from the source table to the records from the target table
and assign the id's given in the options to the link table. <br>
The package currently matches on postcode and business name where the column names are indicated in the options provided. 

## <a name="install"></a>Install
```bash
$ npm install address-matcher --save
```
This package requires the database to have the "fuzzystrmatch" extension for Postgres which is achieved by:
```
CREATE EXTENSION "fuzzystrmatch";
```

## <a name="license"></a>License
[MIT](https://github.com/wmfs/pg-delta-file/blob/master/LICENSE)
