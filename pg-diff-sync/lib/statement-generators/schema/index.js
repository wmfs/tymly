const fs = require('fs')
const path = require('path')
const ejs = require('ejs')
const templateString = fs.readFileSync(path.resolve(__dirname, './template.ejs')).toString()
const template = ejs.compile(templateString, {})

module.exports = function schemaStatementGenerator (schemaName, schema, statements) {
  if (!schema.base.hasOwnProperty('schemaExistsInDatabase') || !schema.base.schemaExistsInDatabase) {
    statements.push(
      template(
        {
          schemaName: schemaName
        }
      )
    )
  }
}
