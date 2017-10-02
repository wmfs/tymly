const cp = require('child_process')

function git(command) {
  return cp.execSync(`git ${command}`).toString()
} // git

function gitDetails() {
  return {
    repository: git('config --get remote.origin.url'),
    branch: git('rev-parse --abbrev-ref HEAD'),
    commit: git("log --pretty=format:'%h' -n 1")
  }
} // gitDetails

module.exports = gitDetails