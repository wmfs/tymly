# tymly
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com) [![license](https://img.shields.io/github/license/mashape/apistatus.svg)](https://github.com/wmfs/tymly/blob/master/packages/tymly/LICENSE)

> A framework for building and sharing workflows in Node.js.

## <a name="install"></a>Install
```bash
$ npm install tymly --save
```

## <a name="usage"></a>Usage
```javascript
const tymly = require('tymly')

tymly.boot(
  {
    // Blueprints are structured directories that describe a business function.
    // They contain 'flows' (e.g. Finite State Machines expressed in JSON)
    // along with the resources required for those flows to run (e.g. data 
    // model definitions, images, form-layouts, templates etc.)
    // This is just a simple list of directories where blueprints can be found...   
    blueprintPaths: [
      '/tymly/blueprints/hr',      // Some flows for HR-related things
      '/tymly/blueprints/payroll'  // Some flows for payroll-related activities 
    ],

    // Tymly is extended via plugins, each in-turn offer 'services' and other components...
    pluginPaths: [
      '/tymly/plugins/tymly-express-plugin',  // For accessing Tymly over HTTP/REST etc.
      '/tymly/plugins/tymly-etl-plugin',   // Adds import-from-CSV capabilities
      '/tymly/plugins/tymly-pg-plugin'   // Persist to PostgreSQL instead of the default in-memory solution 
    ],
    
  },
  
  // Callback once everything has booted (or not)
  function (err, services) {   
    if (err) {
      // Handle something going wrong
      console.error(err)
    } else {
      // Do something with those services...
      // (e.g. the 'tymly-express-plugin' provides an Express-powered 'server' service)
      const port = 3000
      const app = services.server.app
      app.listen(port, function () {        
        console.log('Example app listening on port ' + port);       
      })  
    }   
  }
)
```

## <a name="why"></a>Why?

Tymly has been developed as an alternative for organisations (especially non-profits and Government departments) who need continually-evolving business software - but can do without the complexity, expense and vendor lock-in that usually accompanies it. 

## <a name="documentation"></a>Documentation

For documentation, please visit http://www.tymlyjs.io/

## <a name="tests"></a>Tests
```bash
$ npm test
```

## <a name="license"></a>License
[MIT](https://github.com/wmfs/tymly/blob/master/LICENSE)
