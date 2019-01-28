const REQUIRED_ENV_VARIABLES = [
  'TYMLY_GITHUB_TOKEN',
  'TYMLY_GITHUB_USER'
]
const path = require('path')
const LernaSync = require('@wmfs/lerna-sync')
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
      lernaPackageRouterFunction: function (gitHubPackageObj) {
        if (gitHubPackageObj) {
          const keywordToPackageMap = [
            ['package', 'packages'],
            ['plugin', 'plugins'],
            ['blueprint', 'blueprints'],
            ['cardscript', 'cardscript'],
            ['app', 'apps']
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
      }
    }
  )
  await lernaSync.sync()
}

(async () => {
  await main()
})().catch(e => {
  console.error(e)
})
