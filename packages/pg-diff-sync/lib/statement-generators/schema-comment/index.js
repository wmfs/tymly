const fs = require('fs')
const path = require('path')
const ejs = require('ejs')
const sqlSafe = require('../sql-safe')
const templateString = fs.readFileSync(path.resolve(__dirname, './template.ejs')).toString()
const template = ejs.compile(templateString, {})

module.exports = function schemaCommentStatementGenerator (schemaName, schemaComment, statements) {
  if ((schemaComment.base || '') !== (schemaComment.target || '')) {
    statements.push(
      template(
        {
          schemaName: schemaName,
          comment: sqlSafe(schemaComment.target)
        }
      )
    )
  }
}
