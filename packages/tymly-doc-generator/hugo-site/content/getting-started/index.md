---
date: 2016-03-09T00:11:02+01:00
title: Getting started
weight: 20
---
> In this section we'll be installing a few things, writing a simple [Blueprint](/key-concepts/#blueprints) and executing ourselves a [State Machine](/key-concepts/#state-machines).

## Install Node.js

First ensure you have [Node.js](https://nodejs.org/en/) installed... Tymly requires at least `v8.5`.
To check everything's OK, try the following from the command line:

``` sh
$ node --version
v8.5.0
```

## Configure npm

The `npm` command (Node Package Manager) comes bundled with Node.js. But again, might be worth a quick check:

``` sh
$ npm --version
3.10.10
```

### Running npm behind a proxy

To download packages from the __[mothership](https://www.npmjs.com/)__, `npm` will need access to all your internets.
If you're going to be using Tymly from behind a proxy server, then there's some one-off hurt to get through at his point:

``` sh
$ npm config set proxy       "http://domain%5Cusername:password@servername:port/"
$ npm config set https-proxy "http://domain%5Cusername:password@servername:port/"
```

> __Note:__ Use URL encoding to include `\` characters (i.e. replace them with `%5C` as above). More [here](http://stackoverflow.com/questions/25660936/using-npm-behind-corporate-proxy-pac).

To check `npm` is using your proxy correctly, try the following (which should contact the __[mothership](https://www.npmjs.com/)__ to find out the latest published version of the [tymly package](https://www.npmjs.com/package/tymly)):

```sh
$ npm show tymly version
0.0.14
```

<hr>

## Hello World!

__To help show what Tymly is about we'll go through the steps to get `Hello World!` printed to the console.__

All functionality in Tymly is delivered via a [state machine](/key-concepts/#state-machines) and state machines are defined inside [blueprints](/key-concepts/#blueprints).
So to get `Hello World!` onto the screen, we're going to need ourselves a blueprint...

Nothing to it: make a directory, with a `/state-machines` sub-directory and a `/blueprint.json` file:

![Directory structure for the Hello World! tutorial](/images/hello-world-directory-structure.png)

__Edit the content of the `/blueprint.json` file, so it looks like:__
 
``` json
{
  "namespace": "tutorial",
  "name": "helloWorld",
  "version": "1.0",

  "label": "Hello World! tutorial",
  "author": "John Doe",

  "organisation": "Flobots",
  "description": "Provides a simple flow to print 'Hello World!' to the console",
  "tags": ["tutorial", "test"] 
}
```

- The important takeaway here is that our blueprint is named `helloWorld` and it will live within the `tutorial` namespace. Blueprints which share the same namespace can refer to each others components. The rest of the `blueprint.json` is meta tinsel.
 
__Now we need to define a [state machine](/key-concepts/#state-machines) for Tymly to execute__

Create a `/state-machines/hello-world.json` file:

![Revised structure showing hello-world.json file](/images/hello-world-json.png)

__...and edit its content to:__

``` json
{
  "Comment": "Logs 'Hello World!' to the console",
  "StartAt": "HelloWorld",
  "States": {
    "HelloWorld": {
      "Type": "Task",
      "Resource": "module:logging",
      "End": true
    }
  }
}
```

__That's the blueprint finished!__

- The `fsm` property is the meat of each flow and defines one or more [states](/key-concepts/#states)
- The keys of the `fsm` object are the ids for each state in the flow. So in this example we're working with one state with an id of `logging`
- The `initialStateId` property is important: it indicates which state things should start from

As a quick aside, to keep things simple, some shorthand is in-play in this flow.
Each state needs associating with a [State Class](/core-components/#list-of-state-classes). This can be done explicitily using the `className` property:
 
``` json
"fsm": {
  "logging": {
    "className": "logging"
    "options": {
      "text": "Hello World!"     
    }    
  }  
}
```

...but if you omit `className` (like we did in our example flow) it will be inferred from the state's id.

__Now we need to create a project to run our new blueprint...__

Make a totally fresh directory somewhere (__not__ inside the blueprint) and create an `/index.js` file inside it:

![Startings of a FlobotJS project structure](/images/hello-world-flobot.png)

__Then, from _within that directory_, use the `npm` command to install the [flobot package](https://www.npmjs.com/package/flobot):__

``` sh
$ npm install flobot
```

After some huffing-and-puffing a new `/node_modules` directory should appear full of wondrous things:

![Shows a new node_modules dir has appeared](/images/node_modules.png)

__Now we'll make sure FlobotJS can boot without any problems... edit the `/index.js` to be:__
 
``` javascript
 'use strict'
 var flobot = require('flobot')
 
 flobot.boot(
   {
     blueprintPaths: [
     
       // Change the path below to point to wherever you created
       // that blueprint directory earlier...
      '/myProjects/blueprints/hello-world-blueprint'
      
     ]
   },
   
   // Callback function
   function (err, services) { 
     if (err) {
       console.error('There were errors.')
     } else {
       console.log('Done booting.')
     }         
   }
   
 )
```
 
 Make sure you change the blueprint path to point to your `hello-world-blueprint` directory, then from the same directory that the __`index.js`__ file is located, run:
 
``` sh
$ node index.js
```

...a chunk of output should then appear - for everything to have worked it should end with `Done booting`.

- This is a relatively exciting moment! FlobotJS has booted, consumed our demo blueprint and offered us lots of ready-to-use [services](/core-components/#list-of-services) - the reason we're not seeing `Hello World!` yet is that we haven't used any of those services.

__Let's run a Flobot!__

Edit the `./index.js` file again, keep the changes you made previously but replace the callback function with:
 
``` javascript

  // Callback function
  function (err, services) {
    if (err) {
      console.error('There were errors booting.')
    } else {
      // No problems booting, so start a new Flobot...
      services.flobots.startNewFlobot(
        'tutorial_helloWorld_1_0', // flowId
        {}, // Flobot options
        function (err, flobot) {
          if (err) {
            console.error('There were errors running the Flobot')
          }
        }
      )
    }
  }
  
```

- As before, if everything goes as expected during the boot process, FlobotJS will now offer some `services`
- Several services are returned to the callback function, including [flobots](http://localhost:1313/core-components/services/flobot-flobots/) that we're using here
- The `flobots` service offers an API with a few methods including `startNewFlobot`. The minimum required to call `startNewFlobot` (as seen in this example) is a __flowId__ - here we're using the flowId `tutorial_helloWorld_1_0`.
- These flowIds are conjured by combining the name of the blueprint's namespace (`tutorial`), the flow's name (`helloWorld` - which has been inferred from the `/flows/hello-world.json` filename) and the version number of the flow (as defined in the `/flows/hello-world.json` file). 

__...once the replacement callback function is in-place, re-run:__

``` sh
$ node index.js
```

__Boom!__ You should now see `Hello World!` printed on the console.

> In this first tutorial we've used some of the major components of the framework ([blueprints](/key-concepts/#blueprints), [flows](/key-concepts/#flows), [states](/key-concepts/#states) and [flobots](/key-concepts/#flobots)). The good news is that the distance from this point to running more complex flows only requires the introduction of a few more components. 

