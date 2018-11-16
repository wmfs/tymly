const octokit = require('@octokit/rest')()
const GITHUB_ORG = 'wmfs'

module.exports = async function (options) {
  const info = {
    repos: {}
  }

  octokit.authenticate({
    type: options.token ? 'token' : 'basic',
    username: options.username,
    password: options.password,
    token: options.token
  })

  // TODO: Needs pagination if > 100 repos
  const repoData = await octokit.repos.getForOrg({
    org: GITHUB_ORG,
    type: 'all',
    per_page: 100
  })

  if (options.token) {
    info.orgUrl = repoData.data[0]['ssh_url'].split('/').slice(0, -1).join('/')
  } else {
    const url = repoData.data[0]['clone_url'].split('/').slice(0, -1).join('/').split('//')
    info.orgUrl = url[0] + '//' + encodeURIComponent(options.username) + ':' + encodeURIComponent(options.password) + '@' + url[1]
  }

  const applyRepoData = async () => {
    await Promise.all(
      repoData.data.map(async repo => {
        try {
          const packageJson = await getPackageJson(repo.name)
          const packageJsonString = Buffer.from(packageJson.data.content, 'base64').toString('utf8')
          const keywords = JSON.parse(packageJsonString).keywords

          if (options.repoType) {
            // Only add to info repositories of this type
            if (Array.isArray(keywords) &&
              keywords.includes('tymly') &&
              keywords.includes(options.repoType)) {
              info.repos[repo.name] = {
                packageJson: JSON.parse(packageJsonString)
              }

              if (options.getCommits === true) {
                const commit = await getLastCommit(repo.name)
                info.repos[repo.name].meta = repo
                info.repos[repo.name].content = packageJson.data
                info.repos[repo.name].commit = commit.data
              }
            }
          } else {
            // Add all repositories
            info.repos[repo.name] = {
              packageJson: JSON.parse(packageJsonString)
            }

            if (options.getCommits === true) {
              const commit = await getLastCommit(repo.name)
              info.repos[repo.name].meta = repo
              info.repos[repo.name].content = packageJson.data
              info.repos[repo.name].commit = commit.data
            }
          }
        } catch (err) {
          if (err.code !== 404) {
            console.error('PROBLEM WITH ' + repo.name)
            console.error(err)
          }
        }
      })
    )
  }

  await applyRepoData()
  return info
}

function getPackageJson (name) {
  return octokit.repos.getContent({
    owner: GITHUB_ORG,
    repo: name,
    path: '/package.json'
  })
}

function getLastCommit (name) {
  return octokit.repos.getCommits({
    owner: GITHUB_ORG,
    repo: name,
    per_page: 1,
    page: 1
  })
}
