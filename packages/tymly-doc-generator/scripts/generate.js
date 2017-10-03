'use strict'

const path = require('path')
const Generator = require('./../lib')

const generator = new Generator(
  {
    destination: path.resolve(__dirname, './../hugo-site/public'),
    pluginPaths: [path.resolve(__dirname, './../../../plugins/*-plugin')],
    blueprintPaths: [path.resolve(__dirname, './../../../blueprints/*-blueprint')]
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
