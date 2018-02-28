
const xmlFlatten2csv = require('xml-flatten2csv')

class FlattenXmlFiles {
  init (resourceConfig, env, callback) {
    this.rootXMLElement = resourceConfig.rootXMLElement
    this.pivotPath = resourceConfig.pivotPath
    this.headerMap = resourceConfig.headerMap
    this.namespace = resourceConfig.namespace
    callback(null)
  }

  run (event, context) {
    xmlFlatten2csv(
      {
        xmlPath: event.xmlPath,
        csvPath: event.csvPath,
        rootXMLElement: this.rootXMLElement,
        pivotPath: this.pivotPath,
        headerMap: this.headerMap,
        namespace: this.namespace
      }
    )
      .then(() => context.sendTaskSuccess())
      .catch(err => context.sendTaskFailure({
        error: 'xmlFlatten2csvFail',
        cause: err
      })
      )
  } // run
} // class FlattenXmlFiles

module.exports = FlattenXmlFiles
