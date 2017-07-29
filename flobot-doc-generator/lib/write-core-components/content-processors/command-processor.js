
const Parser = require('./../../jsonschema-markdown')

module.exports = function commandContentProcessor (ctx, inventory, callback) {
  if (ctx.hasOwnProperty('schema')) {
    const generator = new Parser(ctx.schema, {depth: 2})
    ctx.config = generator.generateMarkdown()
  } else {
    ctx.config = null
  }

  callback(null)
}
