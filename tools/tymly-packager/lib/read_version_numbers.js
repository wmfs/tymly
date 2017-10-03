const path = require('path')
const fs = require('fs')
const clone = require('lodash.clone')

function readVersionNumber (pkg) {
  const jsonFile = path.join(pkg, 'package.json')
  const json = JSON.parse(fs.readFileSync(jsonFile))
  return [ json.name, json.version ]
} // readVersionNumbers

function readVersionNumbers (searchRoot, packages) {
  const updatedPackages = [ ]

  for (const pkg of packages) {
    const [name, version] = readVersionNumber(path.join(searchRoot, pkg.directory))

    const update = clone(pkg)
    update.name = name
    update.version = version

    updatedPackages.push(update)
  } // for ...

  return updatedPackages
} // readVersionNumbers

module.exports = readVersionNumbers
