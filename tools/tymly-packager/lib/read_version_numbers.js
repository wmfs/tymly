const path = require('path')
const fs = require('fs')

function readVersionNumber (pkg) {
  const jsonFile = path.join(pkg, 'package.json')
  const json = JSON.parse(fs.readFileSync(jsonFile))
  return [ json.name, json.version ]
} // readVersionNumbers

function readVersionNumbers (searchRoot, packages) {
  const versions = { }

  for (const pkg of packages) {
    const [name, version] = readVersionNumber(path.join(searchRoot, pkg))

    versions[name] = version
  } // for ...

  return versions
} // readVersionNumbers

module.exports = readVersionNumbers
