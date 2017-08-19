const Generator = require('./generator')

function Parser (schema, options) {
  this.baseSchema = schema
  this.options = options
  this.schemas = [ ]
}

Parser.prototype.addSchema = function addSchema (schema) {
  this.schemas.push(schema)
}

Parser.prototype.generateMarkdown = function generateMarkdown () {
  const _this = this
  let gen
  let str = ''

  if (this.baseSchema) {
    gen = new Generator(this.baseSchema, this.options)
    str += gen.generate()
  }

  this.schemas.forEach(function (e, i, a) {
    gen = new Generator(e, _this.options)

    str += gen.generate()
  })

  return str
}

module.exports = exports = Parser
