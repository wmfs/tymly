const chalk = require('chalk')
const logger = require('../utils/logger')

module.exports = async function discoverGithubRepos (options) {
  logger.section('Discovering GitHub repos:')
  logger.comment(`Accessing GitHub organization at https://github.com/${options.gitHubOrg}`)

  try {
    const data = await paginate(options.octokit, options.gitHubOrg)
    let privateCount = 0
    data.forEach(repo => {
      if (repo.private) {
        privateCount++
      }
    })
    logger.success(`Discovered ${chalk.bold(data.length)} repositories on GitHub ${privateCount > 0 ? `(${privateCount} are private)` : ''}`)
    return data
  } catch (e) {
    if (e.message.includes('Bad credentials')) {
      logger.failed(`Something went wrong authenticating with GitHub - is $${options.tokenEnvName} a valid token?`)
    } else {
      throw e
    }
  }
}

async function paginate (octokit, gitHubOrg) {
  const method = octokit.repos.getForOrg
  let response = await method(
    {
      org: gitHubOrg,
      type: 'all',
      per_page: 100
    }
  )
  let {data} = response
  while (octokit.hasNextPage(response)) {
    response = await octokit.getNextPage(response)
    data = data.concat(response.data)
  }
  return data
}
