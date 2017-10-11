'use strict'

module.exports = function () {
  return function animalConverter (sourceRow, callback) {
    const output = {
      animal: sourceRow.animal,
      colour: sourceRow.colour,
      yearBorn: (2017 - sourceRow.age)
    }
    callback(null, output)
  }
}
