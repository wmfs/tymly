const logger = require('../utils/logger')
const chalk = require('chalk')

module.exports = async function filterTymlyRepos (options) {
  logger.section(`Filtering ${options.gitHubRepos.length} Tymly repos:`)
  const applyRepoData = async () => {
    const tymlyRepos = []
    process.stdout.write('    ')
    for (const repo of options.gitHubRepos) {
      process.stdout.write('◽')
      try {
        const packageJson = await getPackageJson(options.octokit, repo.name, options.gitHubOrg)
        const packageJsonString = Buffer.from(packageJson.data.content, 'base64').toString('utf8')
        const keywords = JSON.parse(packageJsonString).keywords

        if (Array.isArray(keywords)) {
          // Only interested in repos with 'tymly' in package.keywords
          if (keywords.includes('tymly')) {
            // And also only those with a qualifying 'repoType' keyword
            let repoType = null
            options.repoTypes.forEach(rt => {
              if (keywords.includes(rt)) {
                if (repoType === null) {
                  repoType = rt
                } else {
                  // Multiple qualifying keywords should fail
                  throw new Error('Unable to determine repoType')
                }
              }
            })
            if (repoType) {
              // const commit = await getLastCommit(options.octokit, repo.name, options.gitHubOrg)
              tymlyRepos.push({
                repoName: repo.name,
                repoType: repoType,
                private: repo.private,
                packageJson: JSON.parse(packageJsonString),
                meta: repo,
                // commit: commit.data
                content: packageJson.data
              })
            }
          }
        }
      } catch (err) {
        if (err.status !== 404) {
          console.error('PROBLEM WITH ' + repo.name)
          console.error(err)
        }
      }
    }
    console.log('')
    return tymlyRepos
  }

  const tymlyRepos = await applyRepoData()
  // Generate some stats
  const stats = getRepoStats(tymlyRepos)
  let allTotal = 0
  let privateTotal = 0
  Object.getOwnPropertyNames(stats).forEach(repoType => {
    const stat = stats[repoType]
    logger.success(`Found ${chalk.bold(stat.total)} Tymly ${repoType}${repoType === 'cardscript' ? '' : 's'} ${stat.private > 0 ? `(${stat.private} of which are private)` : ''}`)
    allTotal += stat.total
    privateTotal += stat.private
  })
  logger.success(`In total ${chalk.bold(allTotal)} Tymly repos were found ${privateTotal > 0 ? `(${privateTotal} of which are private)` : ''}`)
  return tymlyRepos
}

async function getPackageJson (octokit, name, gitHubOrg) {
  const content = await octokit.repos.getContents({
    owner: gitHubOrg,
    repo: name,
    path: '/package.json'
  })
  return content
}

// async function getLastCommit (octokit, name, gitHubOrg) {
//   const commits = await octokit.repos.getCommits({
//     owner: gitHubOrg,
//     repo: name,
//     per_page: 1,
//     page: 1
//   })
//   return commits
// }

function getRepoStats (tymlyRepos) {
  const stats = {}
  tymlyRepos.forEach(repo => {
    if (stats.hasOwnProperty(repo.repoType)) {
      stats[repo.repoType].total++
      if (repo.private === true) {
        stats[repo.repoType].private++
      }
    } else {
      stats[repo.repoType] = {
        total: 1,
        private: repo.private === true ? 0 : 1
      }
    }
  })
  return stats
}
