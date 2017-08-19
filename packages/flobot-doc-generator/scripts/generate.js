'use strict'

const process = require('process')
const path = require('path')

const Generator = require('./../lib')

let destination = process.env.FLOBOT_DOCS_DIR
if (!destination) {
  destination = path.resolve(__dirname, './../hugo-site/public')
}

const generator = new Generator(
  {
    destination: destination,
    pluginPaths: [process.env.FLOBOT_PLUGINS_PATH],
    blueprintPaths: [process.env.FLOBOT_BLUEPRINTS_PATH]
  }
)

generator.addDynamicContent(
  function (err) {
    if (err) {
      console.error(err)
    } else {
      generator.runHugo(
        function (err) {
          if (err) {
            console.error(err)
          } else {
            console.log('\nDone.')
          }
        }
      )
    }
  }
)
