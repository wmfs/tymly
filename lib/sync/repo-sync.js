const chalk = require('chalk')
const logger = require('../utils/logger')
const path = require('path')
const { exec } = require('child_process')
const UP_TO_DATE_MESSAGE = /Already up.to.date/
const COMMIT_OR_STASH = /commit your changes or stash them /
const UNMERGED_CHANGES = /not possible because you have unmerged files/
const ACTION_SYMBOLS = {
  cloned: '◆',
  upToDate: '\u2713',
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

  const gitErrs = []
  const unstagedChangesErr = []

  let currentType = null
  const sorted = options.tymlyRepos.sort(typeCompare)
  for (const repo of sorted) {
    // New headings for each repo type
    if (repo.repoType !== currentType) {
      console.log('')
      console.log(`    ${chalk.cyan(`/${repo.repoType}s`)}`)
      process.stdout.write('      ')
      currentType = repo.repoType
    }
    const creds = `${options.gitHubUser}:${options.gitHubToken}@github.com`

    const [success, action] = await cloneOrPull(repo, creds, gitErrs, unstagedChangesErr)

    const symbol = ACTION_SYMBOLS[action]
    process.stdout.write(success ? chalk.green(symbol) : chalk.red(symbol))
  }

  if (unstagedChangesErr.length > 0) {
    console.log('\n\nUnstaged changes. Please commit or stash them.')
    unstagedChangesErr.forEach(i => {
      console.log(`  - ${i}`)
    })
  }

  if (gitErrs.length > 0) {
    console.log(chalk.red('Git errors.'))
    gitErrs.forEach(e => {
      console.log(chalk.red(`  - ${e}`))
    })
  }
  console.log('')
}

async function cloneOrPull (repo, creds, gitErrs, unstagedChangesErr) {
  const cloneUrl = repo.meta.clone_url
  const destPath = path.resolve(__dirname, '../..', repo.repoType + 's', repo.repoName)

  try {
    const [success, action] = await cloneRepo(cloneUrl, creds, destPath)
    if (success) return [success, action]

    return pullRepo(repo.repoName, destPath, gitErrs, unstagedChangesErr)
  } catch (err) {
    gitErrs.push(`${repo.repoName} : ${err.message}`)
    return [false, 'cloned']
  }
}

async function cloneRepo (cloneUrl, creds, destPath) {
  const cloneCmd = `git clone ${cloneUrl.replace('github.com', creds)} ${destPath}`

  try {
    await run(cloneCmd)
    return [true, 'cloned']
  } catch (err) {
    if (!err.message.includes('already exists and is not an empty directory')) {
      throw err
    }
  }
  return [false, 'cloned']
}

async function pullRepo (repoName, destPath, gitErrs, unstagedChangesErr) {
  try {
    const fetchCmd = 'git -c core.quotepath=false fetch origin --progress --prune'
    const pullCmd = 'git -c core.quotepath=false merge origin/master --no-stat -v'
    await run(fetchCmd, destPath)
    const result = await run(pullCmd, destPath)
    return [
      'true',
      UP_TO_DATE_MESSAGE.test(result) ? 'upToDate' : 'pulled'
    ]
  } catch (err) {
    if (COMMIT_OR_STASH.test(err.message) || UNMERGED_CHANGES.test(err.message)) {
      unstagedChangesErr.push(repoName)
      return [true, 'skipped']
    }
    gitErrs.push(`${repoName} : ${err.message}`)
    return [false, 'pulled']
  }
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
