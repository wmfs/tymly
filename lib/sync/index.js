const chalk = require('chalk')
const octokit = require('@octokit/rest')()
const logger = require('../utils/logger')
const GITHUB_ORG_NAME = 'wmfs'
const TOKEN_ENV_NAME = 'TYMLY_GITHUB_TOKEN'
const discoverGithubRepos = require('./discover-github-repos')
const filterTymlyRepos = require('./filter-tymly-repos')
const repoSync = require('./repo-sync')

async function main () {
  logger.title('TYMLY MONOREPO SYNC')

  // Configure Octokit
  const gitHubToken = process.env[TOKEN_ENV_NAME]
  if (gitHubToken) {
    logger.comment('GitHub token provided, discovering all Tymly repos')
    octokit.authenticate({
      type: 'token',
      token: gitHubToken
    })
  } else {
    logger.comment('No GitHub token specified, discovering public repos only')
    logger.comment('NOTE: Chances are this will fail due to GitHub rate limiting!')
  }

  // Get a list of Github repos
  const gitHubRepos = await discoverGithubRepos({
    octokit: octokit,
    tokenEnvName: TOKEN_ENV_NAME,
    gitHubOrg: GITHUB_ORG_NAME
  })

  if (gitHubRepos) {
    const tymlyRepos = await filterTymlyRepos({
      repoTypes: ['blueprint', 'plugin', 'package', 'cardscript'],
      octokit: octokit,
      gitHubOrg: GITHUB_ORG_NAME,
      gitHubRepos: gitHubRepos
    })

    if (tymlyRepos) {
      await repoSync({
        tymlyRepos: tymlyRepos,
        gitHubToken: gitHubToken,
        gitHubOrg: GITHUB_ORG_NAME,
        gitHubUser: process.env.TYMLY_GITHUB_USER
      })
    }
  }
  console.log('')
  console.log(`Don't forget to ${chalk.bold('npm run bootstrap')} !`)
  console.log('Done.')
}

(async () => {
  await main()
})().catch(e => {
  console.error('SYNC FAILED')
  console.error('-----------')
  console.error(e)
})
