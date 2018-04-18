
const xmlFlatten2csv = require('xml-flatten2csv')
const getFunction = require('tymly/lib/getFunction.js')

class FlattenXmlFiles {
  init (resourceConfig, env, callback) {
    this.rootXMLElement = resourceConfig.rootXMLElement
    this.pivotPath = resourceConfig.pivotPath
    this.headerMap = this.preProcessHeaderMap(env, resourceConfig.headerMap)
    this.namespace = resourceConfig.namespace
    this.xmllang = resourceConfig.xmllang
    this.transform = resourceConfig.transform ? getFunction(env, resourceConfig.transform) : null
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
        namespace: this.namespace,
        xmllang: this.xmllang,
        transform: this.transform
      }
    )
      .then(() => context.sendTaskSuccess())
      .catch(err => context.sendTaskFailure({
        error: 'xmlFlatten2csvFail',
        cause: err
      })
      )
  } // run

  preProcessHeaderMap (options, headerMap) {
    return headerMap.map(entry => {
      const transformer = entry[0].transform
      if (transformer) {
        const fn = getFunction(options, transformer)
        entry[0].transform = fn
      }
      return entry
    })
  } // preProcessHeaderMap
} // class FlattenXmlFiles

module.exports = FlattenXmlFiles
