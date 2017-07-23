'use strict'

class Destroyer {
  constructor (model) {
    this.fullTableName = model.fullTableName

    const where = []
    let i = 0
    model.pkColumnNames.forEach(
      function (columnName) {
        i++
        where.push(columnName + '=$' + i)
      }
    )
    this.sql = `DELETE FROM ${this.fullTableName} WHERE ${where.join(' AND ')}`
  }

  addStatements (script, id, options) {
    script.push(
      {
        statement: this.sql,
        values: id
      }
    )
  }
}

module.exports = Destroyer
