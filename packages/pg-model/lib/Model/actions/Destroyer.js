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

  makeStatements (id, options) {
    return [
      {
        sql: this.sql,
        params: id
      }
    ]
  }
}

module.exports = Destroyer
