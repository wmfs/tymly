const _ = require('lodash')
const fs = require('fs')
const path = require('path')
const ejs = require('ejs')
const templateString = fs.readFileSync(path.resolve(__dirname, './template.ejs')).toString()
const template = ejs.compile(templateString, {})

module.exports = function fkConstraintStatementGenerator (fkConstraintId, fkConstraint, statements) {
  const parts = fkConstraintId.split('.')
  const tableId = parts[0] + '.' + parts[1]

  if (_.isUndefined(fkConstraint.base)) {
    statements.push(
       template(
         {
           fkConstraintName: parts[2],
           schemaName: parts[0],
           tableId: tableId,
           targetTableId: fkConstraint.target.targetTable,
           sourceColumns: fkConstraint.target.sourceColumns,
           targetColumns: fkConstraint.target.targetColumns,
           matchType: fkConstraint.target.matchType,
           updateAction: fkConstraint.target.updateAction,
           deleteAction: fkConstraint.target.deleteAction
         }
       )
     )
  }
}
