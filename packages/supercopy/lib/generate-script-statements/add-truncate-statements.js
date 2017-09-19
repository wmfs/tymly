'use strict'

module.exports = function addTruncateStatements (scriptStatements, fileInfo) {
  if (fileInfo.hasOwnProperty('truncates')) {
    for (const tableToBeTruncated of fileInfo.truncates) {
      scriptStatements.push(
        `TRUNCATE TABLE ${tableToBeTruncated};`
      )
    }
  }
}
