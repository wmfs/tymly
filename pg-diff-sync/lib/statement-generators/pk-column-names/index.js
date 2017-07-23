const _ = require('lodash')
const fs = require('fs')
const path = require('path')
const ejs = require('ejs')
const templateString = fs.readFileSync(path.resolve(__dirname, './template.ejs')).toString()
const template = ejs.compile(templateString, {})

module.exports = function pkColumnNamesStatementGenerator (tableId, pkColumnNames, statements) {
  if (_.isUndefined(pkColumnNames.base)) {
    statements.push(
      template(
        {
          tableId: tableId,
          pkColumnNames: pkColumnNames.target
        }
      )
    )
  }
}
