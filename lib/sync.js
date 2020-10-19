const REQUIRED_ENV_VARIABLES = [
  'TYMLY_GITHUB_TOKEN',
  'TYMLY_GITHUB_USER'
]
const path = require('path')

let LernaSync
try {
  // If the local lerna-sync package is available, then use that.
  LernaSync = require('../packages/lerna-sync')
} catch (e) {
  // If it's not been synced in yet and not available, then fallback to the lerna-sync dependency.
  // (as expected via an npm install).
  LernaSync = require('@wmfs/lerna-sync')
}

const process = require('process')

async function main () {
  REQUIRED_ENV_VARIABLES.forEach(
    varName => {
      if (!process.env.hasOwnProperty(varName)) {
        throw new Error(`Required environment variable ${varName} has not set!`)
      }
    }
  )

  const lernaSync = new LernaSync(
    {
      monorepoPath: path.resolve(__dirname, '..'),
      gitHubToken: process.env.TYMLY_GITHUB_TOKEN,
      gitHubOrgName: 'wmfs',
      gitHubUser: process.env.TYMLY_GITHUB_USER,
      lernaPackageRouterFunction: packageObjCallback
    }
  )
  await lernaSync.sync()
}

(async () => {
  await main()
})().catch(e => {
  console.error(e)
})

function packageObjCallback (gitHubPackageObj) {
  if (!gitHubPackageObj) return

  const keywordToPackageMap = [
    ['package', 'packages'],
    ['plugin', 'plugins'],
    ['blueprint', 'blueprints'],
    ['cardscript', 'cardscript'],
    ['app', 'apps'],
    ['mod', 'mods']
  ]

  if (gitHubPackageObj.hasOwnProperty('keywords') && gitHubPackageObj.keywords.indexOf('tymly') !== -1) {
    let lernaPackageName = null
    const keywords = gitHubPackageObj.keywords
    keywordToPackageMap.forEach(
      tuple => {
        if (keywords.indexOf(tuple[0]) !== -1) {
          lernaPackageName = tuple[1]
        }
      }
    )
    return lernaPackageName
  }
}
