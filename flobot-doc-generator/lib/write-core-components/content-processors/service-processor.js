const Parser = require('./../../jsonschema-markdown')
const path = require('upath')
const documentation = require('documentation')

module.exports = function serviceContentProcessor (ctx, inventory, callback) {
  if (ctx.hasOwnProperty('schema')) {
    const generator = new Parser(ctx.schema, {depth: 2})
    ctx.config = generator.generateMarkdown()
  } else {
    ctx.config = null
  }

  if (!ctx.hasOwnProperty('bootBefore')) {
    ctx.bootBefore = null
  }

  if (!ctx.hasOwnProperty('bootAfter')) {
    ctx.bootAfter = null
  }

  if (ctx.doc.hasOwnProperty('blueprintDirs')) {
    ctx.blueprintDirs = []
    let description
    for (let dirName in ctx.doc.blueprintDirs) {
      if (ctx.doc.blueprintDirs.hasOwnProperty(dirName)) {
        description = ctx.doc.blueprintDirs[dirName]
        ctx.blueprintDirs.push(
          {
            dirName: '/' + dirName,
            description: description
          }
        )
      }
    }
  } else {
    ctx.blueprintDirs = null
  }

  // Get some doc info from the module...
  const indexFilePath = path.join(ctx.componentRootPath, 'index.js')
  const jsDocInfo = documentation.build([indexFilePath], {})

  if (jsDocInfo.length > 0) {
    documentation.formats.md(
      jsDocInfo,
      {},
      function (err, md) {
        if (err) {
          callback(err)
        } else {
          ctx.apiMd = md
          callback(null)
        }
      }
    )
  } else {
    ctx.apiMd = null
    callback(null)
  }
}
