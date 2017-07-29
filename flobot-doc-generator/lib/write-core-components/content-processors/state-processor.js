
const Parser = require('./../../jsonschema-markdown')

module.exports = function stateContentProcessor (ctx, inventory, callback) {
  if (ctx.hasOwnProperty('schema')) {
    const generator = new Parser(ctx.schema, {depth: 2})
    ctx.config = generator.generateMarkdown()
  } else {
    ctx.config = null
  }

  callback(null)
}
