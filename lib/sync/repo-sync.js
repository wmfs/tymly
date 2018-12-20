const chalk = require('chalk')
const logger = require('../utils/logger')
const path = require('path')
const {exec} = require('child_process')
const UP_TO_DATE_MESSAGE = /Already up.to.date/
const ACTION_SYMBOLS = {
  cloned: '◆',
  upToDate: '🗸',
  pulled: '↓',
  skipped: '➝'
}

module.exports = async function repoSync (options) {
  logger.section('Synchronizing:')
  console.log('')
  logger.comment('Key:')
  logger.comment(`  ${chalk.green('▌')} = Git operation succeeded`)
  logger.comment(`  ${chalk.red('▌')} = Git operation failed`)
  logger.comment(`  ${chalk.white(ACTION_SYMBOLS.upToDate)} = Repo already up-to-date`)
  logger.comment(`  ${chalk.white(ACTION_SYMBOLS.pulled)} = Pulled repo`)
  logger.comment(`  ${chalk.white(ACTION_SYMBOLS.cloned)} = Cloned repo`)
  logger.comment(`  ${chalk.white(ACTION_SYMBOLS.skipped)} = Skipped repo`)

  const unstagedChangesErr = []
  let currentType = null
  const sorted = options.tymlyRepos.sort(typeCompare)
  let repo
  for (let i = 0; i < sorted.length; i++) {
    repo = sorted[i]
    // New headings for each repo type
    if (repo.repoType !== currentType) {
      console.log('')
      console.log(`    ${chalk.cyan(`/${repo.repoType}s`)}`)
      process.stdout.write('      ')
      currentType = repo.repoType
    }

    const cloneUrl = repo.meta.clone_url
    const creds = `${options.gitHubUser}:${options.gitHubToken}@github.com`
    const destPath = path.resolve(__dirname, '../..', repo.repoType + 's', repo.repoName)
    const cloneCmd = `git clone ${cloneUrl.replace('github.com', creds)} ${destPath}`

    let action = 'cloned'
    let success = true

    try {
      // Try and clone this repo...
      await run(cloneCmd)
    } catch (err) {
      if (!err.message.includes('already exists and is not an empty directory')) {
        // Failing because of something other than it being present locally already.
        success = false
      } else {
        success = true
        try {
          action = 'pulled'
          const fetchCmd = 'git -c core.quotepath=false fetch origin --progress --prune'
          const pullCmd = 'git -c core.quotepath=false merge origin/master --no-stat -v'
          await run(fetchCmd, destPath)
          const result = await run(pullCmd, destPath)
          if (UP_TO_DATE_MESSAGE.test(result)) {
            action = 'upToDate'
          }
        } catch (err) {
          if (err.message.includes(`Please commit your changes or stash them before you merge`)) {
            action = 'skipped'
            unstagedChangesErr.push(repo.repoName)
          } else {
            success = false
          }
        }
      }
    }
    let symbol = ACTION_SYMBOLS[action]
    if (success) {
      symbol = chalk.green(symbol)
    } else {
      symbol = chalk.red(symbol)
    }
    process.stdout.write(symbol)
  }

  if (unstagedChangesErr.length > 0) {
    console.log('Unstaged changes. Please commit or stash them.')
    unstagedChangesErr.forEach(i => {
      console.log(`  - ${i}`)
    })
  }
  console.log('')
}

function run (cmd, cwd = null) {
  return new Promise((resolve, reject) => {
    exec(cmd, { cwd: cwd }, (err, stdout, stderr) => {
      // console.log(stdout)
      if (err) reject(err)
      else resolve(stdout)
    })
  })
}

function typeCompare (a, b) {
  if (a.repoType < b.repoType) {
    return -1
  }
  if (a.repoType > b.repoType) {
    return 1
  }
  return 0
}
