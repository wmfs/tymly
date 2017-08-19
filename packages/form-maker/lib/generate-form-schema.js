'use strict'

const _ = require('lodash')
const path = require('path')
const fs = require('fs')

module.exports = function generateFormSchema (filepath, content) {
  let form = {} // The whole form
  let formDefinition = [] // The form inside the form

  processProperties(filepath, content, formDefinition)
  formDefinition.push({
    type: 'actions',
    items: [
      {
        type: 'button',
        style: 'btn-default',
        title: 'Cancel',
        onClick: 'vm.cancelFlobot()'
      },
      {
        type: 'submit',
        style: 'btn-info',
        title: 'OK'
      }
    ]
  })
  form.version = '1.0'
  form.label = 'A form for editing ' + content.description
  form.form = formDefinition
  form.schema = {
    type: content.type,
    properties: content.properties
  }

  // Output JSON to file
  let outputDir = path.join(filepath, 'forms')
  let formFilename = path.basename(filepath, '-blueprint') + '-form.json'
  console.log('outputDir: ', outputDir)
  console.log('formFilename: ', formFilename)

  fs.mkdir(outputDir, function (err) {
    if (err && (err.code !== 'EEXIST')) {
      console.log(err)
    } else {
      console.log('Making directory.')
      fs.writeFile(path.join(outputDir, formFilename), JSON.stringify(form, null, 2), function (err) {
        if (err) {
          console.log(err)
        } else {
          console.log('Creating file.')
        }
      })
    }
  })
}

function processProperties (filepath, content, objectAddedTo) {
  if (content.hasOwnProperty('properties')) {
    let properties = content.properties

    _.forEach(properties, function (property, key) {
      if (property.type === 'array') {
        let arrayAddedTo = []
        processProperties(filepath, property.items, arrayAddedTo)
        // Add the ''key'[].' before each child key in items[]
        _.forEach(arrayAddedTo, function (value) {
          value.key = key + '[].' + value.key
        })
        objectAddedTo.push({
          key: key,
          add: 'Add ' + key,
          style: {
            add: 'btn-success'
          },
          items: arrayAddedTo,
          title: generateTitle(key)
        })
      } else if (property.type === 'integer' || property.type === 'number') {
        objectAddedTo.push({
          key: key,
          type: 'number',
          title: generateTitle(key)
        })
      } else if (property.type === 'string' && property.maxLength > 60) {
        objectAddedTo.push({
          key: key,
          type: 'textarea',
          title: generateTitle(key)
        })
      } else if (property.type === 'string' && property.format === 'date-time') {
        objectAddedTo.push({
          key: key,
          type: 'datepicker',
          title: generateTitle(key)
        })
      } else {
        objectAddedTo.push({
          key: key,
          type: 'text',
          title: generateTitle(key)
        })
      }
    })
  }
}

function generateTitle (key) {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, function (i) { return i.toUpperCase() })
}
