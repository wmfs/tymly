'use strict'
const xml2csv = require('xml2csv')

class ProcessingXmlFiles {
  init (resourceConfig, env, callback) {
    this.rootXMLElement = resourceConfig.rootXMLElement
    this.headerMap = resourceConfig.headerMap
    callback(null)
  }

  run (event, context) {
    xml2csv(
      {
        xmlPath: event.xmlPath,
        csvPath: event.csvPath,
        rootXMLElement: this.rootXMLElement,
        headerMap: this.headerMap
      },
      function (err) {
        if (err) {
          context.sendTaskFailure(
            {
              error: 'xml2csvFail',
              cause: err
            }
          )
        } else {
          context.sendTaskSuccess()
        }
      }
    )
  }
}

module.exports = ProcessingXmlFiles
