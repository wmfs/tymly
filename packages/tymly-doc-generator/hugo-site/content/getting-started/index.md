---
date: 2016-03-09T00:11:02+01:00
title: Getting started
weight: 20
---
> In this section we'll be installing a few things, writing a simple [blueprint](/key-concepts/#blueprints) and executing ourselves a [state machine](/key-concepts/#state-machines).

## Install Node.js

First ensure you have [Node.js](https://nodejs.org/en/) installed... Tymly requires at least `v8.5.0`.
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

To download packages from __[npmjs.com](https://www.npmjs.com/)__, `npm` will need access to all your internets.
If you're going to be using Tymly from behind a proxy server, then there's some one-off hurt to get through at his point:

``` sh
$ npm config set proxy       "http://domain%5Cusername:password@servername:port/"
$ npm config set https-proxy "http://domain%5Cusername:password@servername:port/"
```

> __Note:__ Use URL encoding to include `\` characters (i.e. replace them with `%5C` as above). More [here](http://stackoverflow.com/questions/25660936/using-npm-behind-corporate-proxy-pac).

To check `npm` is using your proxy correctly, try the following (which should contact __[npmjs.com](https://www.npmjs.com/)__ to find out the latest published version of the [tymly package](https://www.npmjs.com/package/tymly)):

```sh
$ npm show tymly version
0.0.15
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

  "organisation": "Tymly",
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
  "version": "1.0",
  "Comment": "Logs 'Hello World!' to the console",
  "StartAt": "HelloWorld",
  "States": {
    "HelloWorld": {
    "Type": "Task",
    "Resource": "module:logging",
    "ResourceConfig": {
      "template": "Hello World!"
    },
    "End": true
    }
  }
}
```

__That's the blueprint finished!__

- The keys of the `States` object are the unique names for each state in the State Machine. So in this example we're working with one state with the name `HelloWorld`
- The `StartsAt` property is mandatory: it indicates the first state which to run when the State Machine is executed
- Please see the [Amazon States Language specification](https://states-language.net/spec.html) for further information about how to conjure a State Machine

__Now we need to create a project to run our new blueprint...__

Make a totally fresh directory somewhere (__not__ inside the blueprint) and create an `/index.js` file inside it:

![Startings of a Tymly project structure](/images/execute-hello-world.png)

__Then, from _within that directory_, use the `npm` command to install the [tymly package](https://www.npmjs.com/package/tymly):__

``` sh
$ npm install tymly
```

After some huffing-and-puffing a new `/node_modules` directory should appear full of wondrous things:

![Shows a new node_modules dir has appeared](/images/node_modules.png)

__Now we'll make sure Tymly can boot without any problems... edit the `/index.js` to be:__

``` javascript
'use strict'
var tymly = require('tymly')

tymly.boot(
  {
    blueprintPaths: [
      'd:/development/temp/hello-world-blueprint' // Change me!
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

- This is a relatively exciting moment! Tymly has booted, consumed the demo blueprint and offered lots of ready-to-use [services](/reference/#list-of-services) - the reason we're not seeing `Hello World!` yet is that we haven't used any of those services.

__Let's execute a State Machine!__

Edit the `./index.js` file again, keep the changes you made previously but __replace__ the callback function with:

``` javascript
  // Callback function
  function (err, services) {
    if (err) {
      console.error(err)
    } else {
      // No problems booting, so execute the State Machine...
      services.statebox.startExecution(
        {},  // input
        'tutorial_helloWorld_1_0', // state machine name
        {
          sendResponse: 'COMPLETE'
        }, // options
        function (err, executionDescription) {
          if (err) {
            console.error(err)
          } else {
            console.log('Done.')
          }
        }
      )
    }
  }
```

- As before, if everything goes as expected during the boot process, Tymly will offer some `services`
- Several services are returned to the callback function, including [statebox](/reference/services/tymly-statebox/) that we're using here
- The `statebox` service offers an API with a few methods including `startExecution`. The minimum required to call `startExecution` (as seen in this example) is a __state machine name__ - here we're using `tutorial_helloWorld_1_0`.
- These unique names are conjured by combining the blueprint's namespace (`tutorial`), the state machines's name (`helloWorld` - which has been inferred from the `/state-machines/hello-world.json` filename) and the version number of the state machine (as defined in the `/state-machines/hello-world.json` file).

__...once the replacement callback function is in-place, re-run:__

``` sh
$ node index.js
```

__Boom!__ You should now see `Hello World!` printed on the console.

> In this first tutorial we've used some of the major components of the Tymly framework ([blueprints](/key-concepts/#blueprints), [state machines](/key-concepts/#state-machines) and [services](/reference/#list-of-services)). The good news is that the distance from this point to running more complex state machines only requires the introduction of a few more components.
