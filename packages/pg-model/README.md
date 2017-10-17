# pg-model
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com) [![license](https://img.shields.io/github/license/mashape/apistatus.svg)](https://github.com/wmfs/tymly/blob/master/packages/pg-model/LICENSE)


> Takes a relational database structure and returns model objects for noSQL-like abilities.

## <a name="install"></a>Install
```bash
$ npm install pg-model --save
```

## <a name="usage"></a>Usage

```javascript
const pg = require('pg')
const pgInfo = require('pg-info')

// Make a new Postgres client
const client = new pg.Client('postgres://postgres:postgres@localhost:5432/my_test_db')
client.connect()

//Now get the structure of the 'space' database schema
pgInfo(
  {
    client: client,
    schemas: [
      'space',
    ]    
  },
  function (err, dbStructure) {
    
    // 'dbStructure' describes the content of the 'space' schema
    // (i.e. tables, columns, indexes, foreign-key constraints etc.)
    
    // Now make some models from that description...
    
    models = pgModel(
      {
        client: client,
        dbStructure: dbStructure
      }
    )
    
    // We've now one-model-per table.
    // So, assuming the 'space' schema contained tables named 'planets', 'moons' and 'craters'...
    // This sort of thing is possible...
    models.space.planets.create(
      {
        name: 'mars',
        title: 'Mars',
        type: 'Terrestrial',
        diameter: 6700,
        color: 'red',
        url: 'http://en.wikipedia.org/wiki/Mars',
        moons: [
          {
            title: 'Phobos',
            discoveredBy: 'Asaph Hall',
            discoveryYear: 1875,
            craters: [
              {
                title: 'Stickney',
                diameter: 10
              }
            ]
          },
          {
            title: 'Deimos',
            discoveredBy: 'Asaph Hall',
            discoveryYear: 1875
          }
        ]
      },
      {}
    ).then(() => {{
      //  * Four rows have been inserted amongst the 'space.planets', 'space.moons' and 'space.craters' tables
      //  * PostgreSQL's column defaults have been used to populate the missing primary key values
      //  * The foreign-key values for 'space.moons' and 'space.craters' have been auto-filled by
      //    inspecting FK constraints
      }
    )   
  }
)
```

## <a name="api"></a>API

Each model offers the following methods.

### create (`jsonData`, `options`)

Inserts the supplied JSON documents into relational tables.  
Resolves to the document's id properties.

__Example__

```javascript
models.hr.people.create(
    {
      employeeNo: 1
      firstName: 'Homer',
      lastName: 'Simpson',
      age: 39
    },
    {}
  ).then(idProperties => {
    // idProperties ==
    // {
    //   idProperties:
    //     {
    //       employeeNo: 1
    //     }
    // }
    }
  )
```

### findById (`id`)

Finds one 'document' by ID - all nested docs will be assembled too.

__Example__

```javascript
models.hr.people.findById(1)
  .then(doc => {
    // doc ==
    // {
    //   employeeNo: 1,
    //   firstName: 'Homer',
    //   lastName: 'Simpson',
    //   age: 39,
    //   created: 2017-06-02T22:00:55.221Z,
    //   createdBy: null,
    //   modified: 2017-06-02T22:00:55.221Z,
    //   modifiedBy: null 
    // }
    }
  )
```

### find (`options`)

Find zero-or-more docs - can be filtered, ordered, paginated etc. 
Resolves to the found document array.

__Example__

```javascript
models.hr.people.find(
    {
      where: {
        firstName: {equals: 'Homer'},
        lastName: {equals: 'Simpson'}
      }
    }
  ).then(docs => {
    // docs ==
    // [
    //   {
    //     employeeNo: 1,
    //     firstName: 'Homer',
    //     lastName: 'Simpson',
    //     age: 39,
    //     created: 2017-06-02T22:00:55.221Z,
    //     createdBy: null,
    //     modified: 2017-06-02T22:00:55.221Z,
    //     modifiedBy: null 
    //   }
    // ]
    }
  )
```

### findOne (`options`)

Like `find` but resolves to a single doc.

__Example__

```javascript
models.hr.people.findOne(
    {
      orderBy: ['age'],
      nullsLast: true,
      offset: 1
    }
  ).then(doc => {
    // doc ==
    // {
    //   employeeNo: 1,
    //   firstName: 'Homer',
    //   lastName: 'Simpson',
    //   age: 39,
    //   created: 2017-06-02T22:00:55.221Z,
    //   createdBy: null,
    //   modified: 2017-06-02T22:00:55.221Z,
    //   modifiedBy: null 
    // }
    }
  )
```

### update (`doc`, `options`)

Updates a single 'document'. The top-level primary key is inferred from the data - automatically inserts/updates/deletes nested docs.  

__Example__

```javascript
models.hr.people.update(
    {
      employeeNo: 1,
      firstName: 'Homer',
      lastName: 'Simpson',
      age: 39
    },
    {}
  ).then(() => { /* All done */ })
```

### patch (`doc`, `options`)

Same as `update`, but any omitted properties will be retained (i.e. they won't be turned into `null` values like `update` will). 

__Example__

```javascript
models.hr.people.patch(
    {
      employeeNo: 1,
      age: 39
    },
    {}
  ).then(() => { /* All done */ })
```

### upsert (`doc`, `options`)

A combination of `create` and `update`. If a document already exists then `upsert` will _update_ it, else it'll _create_ it.

__Example__

```javascript
models.hr.people.upsert(
    {
      employeeNo: 1,
      firstName: 'Homer',
      lastName: 'Simpson',
      age: 39
    },
    {}
  ).then(idProperties => {
    // idProperties ==
    // {
    //   idProperties:
    //     {
    //       employeeNo: 1
    //     }
    // }  
    }
  )
```

### destroyById (`id`)

Deletes one 'document' by ID - all nested docs will be cascade-deleted too.

__Example__

```javascript
models.hr.people.destroyById(1)
  .then(() => { /* All done */ })
```

### parseDoc (`doc`, `options`)

Takes a single doc and parses it into a form that's usable by several of the other methods.

__Example__

```javascript
const parsedDoc = models.hr.people.parseDoc(
  {
    employeeNo: 1,
    firstName: 'Homer',
    lastName: 'Simpson',
    age: 39
  },
  {
    includeNullFks: false
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
[MIT](https://github.com/wmfs/pg-model/blob/master/LICENSE)
