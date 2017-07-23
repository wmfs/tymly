const _ = require('lodash')
const fs = require('fs')
const path = require('path')
const ejs = require('ejs')
const templateString = fs.readFileSync(path.resolve(__dirname, './template.ejs')).toString()
const template = ejs.compile(templateString, {})

module.exports = function tableStatementGenerator (tableId, table, statements) {
  if (_.isUndefined(table.base)) {
    statements.push(
      template(
        {
          tableId: tableId
        }
      )
    )
  }
}
