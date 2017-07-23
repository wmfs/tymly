const fs = require('fs')
const path = require('path')
const ejs = require('ejs')
const sqlSafe = require('../sql-safe')
const templateString = fs.readFileSync(path.resolve(__dirname, './template.ejs')).toString()
const template = ejs.compile(templateString, {})

module.exports = function tableCommentStatementGenerator (tableId, tableComment, statements) {
  if ((tableComment.base || '') !== (tableComment.target || '')) {
    statements.push(
      template(
        {
          tableId: tableId,
          comment: sqlSafe(tableComment.target)
        }
      )
    )
  }
}
