const fs = require('fs')
const path = require('path')
const ejs = require('ejs')
const sqlSafe = require('../sql-safe')
const templateString = fs.readFileSync(path.resolve(__dirname, './template.ejs')).toString()
const template = ejs.compile(templateString, {})

module.exports = function columnCommentStatementGenerator (columnCommentId, columnComment, statements) {
  if ((columnComment.base || '') !== (columnComment.target || '')) {
    statements.push(
      template(
        {
          columnCommentId: columnCommentId,
          comment: sqlSafe(columnComment.target)
        }
      )
    )
  }
}

/*
{

  missing: function (statements, diff) {
    return template(
      {
        columnName: diff.name,
        tableName: diff.tableName,
        schemaName: diff.schemaName,
        comment: sqlSafe(diff.expected)
      }
    )
  },

  different: function (statements, diff) {
    return template(
      {
        columnName: diff.name,
        tableName: diff.tableName,
        schemaName: diff.schemaName,
        comment: sqlSafe(diff.expected)
      }
    )

  }

}
  */
