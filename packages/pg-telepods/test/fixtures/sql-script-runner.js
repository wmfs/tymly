const fs = require('fs')
const path = require('path')

module.exports = async function scriptRunner (filename, client) {
  const fullFileName = path.resolve(__dirname, filename)
  const sql = fs.readFileSync(fullFileName, 'utf8')
  return client.query(sql)
}
