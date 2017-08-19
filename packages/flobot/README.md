# flobot
> A framework for building and sharing workflows in Node.js.

## <a name="install"></a>Install
```bash
$ npm install flobot --save
```

## <a name="usage"></a>Usage
```javascript
const flobot = require('flobot')

flobot.boot(
  {
    // Blueprints are structured directories that describe a business function.
    // They contain 'flows' (e.g. Finite State Machines expressed in JSON)
    // along with the resources required for those flows to run (e.g. data 
    // model definitions, images, form-layouts, templates etc.)
    // This is just a simple list of directories where blueprints can be found...   
    blueprintPaths: [
      '/flobot/blueprints/hr',      // Some flows for HR-related things
      '/flobot/blueprints/payroll'  // Some flows for payroll-related activities 
    ],

    // Flobot is extended via plugins, each in-turn offer 'services' and other components...
    pluginPaths: [
      '/flobot/plugins/flobot-express-plugin',  // For accessing Flobot over HTTP/REST etc.
      '/flobot/plugins/flobot-import-plugin',   // Adds import-from-CSV capabilities
      '/flobot/plugins/flobot-pg-plugin'   // Persist to PostgreSQL instead of the default in-memory solution 
    ],
    
    // Config that will be offered to each of the plugins...
    config: {
    
      // Of use to the 'flobot-mongodb-plugin'
      mongodbConnection: {
        host: 'localhost',
        port: 27017,
        database: 'flobotTest'
      }
                 
    }
  },
  
  // Callback once everything has booted (or not)
  function (err, services) {   
    if (err) {
      // Handle something going wrong
      console.error(err)
    } else {
      // Do something with those services...
      // (e.g. the 'flobot-express-plugin' provides an Express-powered 'server' service)
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

Flobot has been developed as an alternative for organisations (especially non-profits and Government departments) who need continually-evolving business software - but can do without the complexity, expense and vendor lock-in that usually accompanies it. 

## <a name="documentation"></a>Documentation

For documentation, please visit https://www.flobotjs.io/

## <a name="tests"></a>Tests
```bash
$ npm test
```

## <a name="license"></a>License
[MIT](https://github.com/wmfs/flobot/blob/master/LICENSE)
