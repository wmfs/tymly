const fs = require('fs')
const path = require('upath')
const ejs = require('ejs')

const configTemplate = fs.readFileSync(path.resolve(__dirname, './templates/config.ejs'))

module.exports = function (rootDir, inventory) {
  const ctx = {}

  const toml = ejs.render(
    configTemplate.toString(),
    ctx
  )

  const destination = path.resolve(__dirname, './../../hugo-site/config.toml')
  console.log('Writing ' + destination)
  fs.writeFileSync(destination, toml)
}
