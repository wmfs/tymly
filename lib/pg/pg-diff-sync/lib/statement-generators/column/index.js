const fs = require('fs')
const _ = require('lodash')
const path = require('path')
const ejs = require('ejs')
const isDifferent = require('../is-different')
const missingTemplateString = fs.readFileSync(path.resolve(__dirname, './missing-template.ejs')).toString()
const missingTemplate = ejs.compile(missingTemplateString, {})
const differentTemplateString = fs.readFileSync(path.resolve(__dirname, './different-template.ejs')).toString()
const differentTemplate = ejs.compile(differentTemplateString, {})

function buildConstraint (target) {
  let constraint = target.dataType

  if (_.isNumber(target.numericScale) && target.numericScale > 0) {
    constraint += `(${(target.numericPrecision || 9) + target.numericScale}, ${target.numericScale})`
  }

  if (target.array) {
    constraint += '[]'
  }

  if (target.isNullable === 'NO') {
    constraint += ' NOT NULL'
  }
  if (target.columnDefault) {
    constraint += ' DEFAULT ' + target.columnDefault
  }
  return constraint
}

module.exports = function columnStatementGenerator (columnId, column, statements) {
  const parts = columnId.split('.')
  const columnName = parts[2]

  const ctx = {
    columnName: columnName,
    tableId: parts[0] + '.' + parts[1],
    constraint: buildConstraint(column.target)
  }

  if (_.isUndefined(column.base)) {
    statements.push(
      missingTemplate(ctx)
    )
  } else {
    if (
      isDifferent(column.target.array, column.base.array) ||
      isDifferent(column.target.dataType, column.base.dataType) ||
      isDifferent(column.target.columnDefault, column.base.columnDefault) ||
      isDifferent(column.target.isNullable, column.base.isNullable) ||
      isDifferent(column.target.characterMaximumLength, column.base.characterMaximumLength) ||
      isDifferent(column.target.numericScale, column.base.numericScale)
    ) {
      differentTemplate(ctx)
    }
  }
}
