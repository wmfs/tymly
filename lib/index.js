const credentials = require('./creds')
const gatherInfo = require('./gather-info')

const chalk = require('chalk')
const path = require('path')
const {exec} = require('child_process')

sync()

async function sync () {
  const {username, password, token} = await credentials()
  const info = await gatherInfo({username, password, token, getCommits: true})

  let count = 0
  const unstagedChangesErr = []

  for (const [repoName, repo] of Object.entries(info.repos)) {
    const keywords = repo.packageJson.keywords

    if (Array.isArray(keywords) && keywords.includes('tymly')) {
      let repoType
      if (keywords.includes('package')) {
        repoType = 'package'
      } else if (keywords.includes('plugin')) {
        repoType = 'plugin'
      } else if (keywords.includes('blueprint')) {
        repoType = 'blueprint'
      } else if (keywords.includes('build')) {
        repoType = 'build'
      }

      if (repoType) {
        count++

        console.log(chalk.underline.yellow(`${repoName} (${repo.commit[0].sha})`))
        console.log(' - ', chalk.cyan('Keywords:'), repo.packageJson.keywords)

        const cloneUrl = `${info.orgUrl}/${repoName}`
        const destPath = path.resolve(__dirname, '..', repoType + 's', repoName)

        console.log(' - ', chalk.cyan('Repo type: ') + repoType)
        console.log(' - ', chalk.cyan('Cloning'), repoName)
        console.log(chalk.cyan('     From:'), cloneUrl)
        console.log(chalk.cyan('     Into:'), destPath)

        try {
          const cloneCmd = `git clone ${cloneUrl} ${destPath}`
          console.log(chalk.black.bgYellow(cloneCmd))
          await run(cloneCmd)
        } catch (err) {
          if (!err.message.includes(`already exists and is not an empty directory`)) {
            console.log(chalk.red(`Problem cloning with ${repoName}`))
            throw new Error(err)
          } else {
            console.log(`${repoName} already exists. Gonna pull.`)
            try {
              const pullCmd = [
                `cd ${destPath}`,
                `git -c core.quotepath=false fetch origin --progress --prune`,
                `git -c core.quotepath=false merge origin/master --no-stat -v`
              ]
              // const pullCmd = [
              //   `cd ${destPath}`,
              //   `git remote set-url origin https://${username}:${password}@github.com/wmfs/${repoName}.git`,
              //   `git pull --rebase`
              // ]
              console.log(chalk.black.bgYellow(pullCmd.join(' & ')))
              await run(pullCmd.join(' & '))
            } catch (err) {
              // if (err.message.includes(`cannot pull with rebase: You have unstaged changes`)) {
              if (err.message.includes(`Please commit your changes or stash them before you merge`)) {
                unstagedChangesErr.push(repoName)
              } else {
                console.log(`Problem pulling ${repoName}`)
                throw new Error(err)
              }
            }
          }
        }

        console.log('Done.')
      }
    }
  }

  if (unstagedChangesErr.length > 0) {
    console.log('Unstaged changes. Please commit or stash them.')
    unstagedChangesErr.forEach(i => {
      console.log(`  - ${i}`)
    })
  }

  console.log('Repo count: ' + count)
  console.log(chalk.green('Done\n'))
}

function run (cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, (err, stdout, stderr) => {
      console.log(stdout)
      if (err) reject(err)
      else resolve()
    })
  })
}
