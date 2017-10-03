const gitDetails = require('./git_details.js')
const whereAndWhen = require('./where_and_when.js')

function createManifest (packages) {
  const ww = whereAndWhen()
  const gitDeets = gitDetails()
  const pckDeets = { }
  packages.forEach(pkg => { pckDeets[pkg.name] = pkg.version })

  return {
    user: ww.user,
    hostname: ww.hostname,
    timestamp: ww.timestamp,
    git: gitDeets,
    packages: pckDeets
  }
} // createManifest

module.exports = createManifest
