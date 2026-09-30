'use strict'

const fs = require('fs')
const path = require('path')
const { execFileSync } = require('child_process')

const root = path.resolve(__dirname, '..')
const apply = process.argv.includes('--apply')

function getGitRepositories (directory) {
  const repositories = []

  const entries = fs.readdirSync(directory, {
    withFileTypes: true
  })

  for (const entry of entries) {
    // Ignore node_modules and other directories that cannot contain
    // repositories relevant to Tymly.
    if (
      entry.isDirectory() &&
      ['node_modules', '.git'].includes(entry.name)
    ) {
      continue
    }

    if (!entry.isDirectory()) {
      continue
    }

    const fullPath = path.join(directory, entry.name)
    const gitPath = path.join(fullPath, '.git')

    if (fs.existsSync(gitPath)) {
      repositories.push(fullPath)
      continue
    }

    repositories.push(...getGitRepositories(fullPath))
  }

  return repositories
}

function getOriginUrl (repo) {
  try {
    return execFileSync(
      'git',
      ['-C', repo, 'remote', 'get-url', 'origin'],
      {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore']
      }
    ).trim()
  } catch (err) {
    return null
  }
}

function cleanGitHubUrl (url) {
  if (!url) {
    return null
  }

  const match = url.match(
    /^https:\/\/[^@]+@github\.com\/(.*)$/
  )

  if (!match) {
    return null
  }

  return `https://github.com/${match[1]}`
}

function setOriginUrl (repo, url) {
  try {
    execFileSync(
      'git',
      ['-C', repo, 'remote', 'set-url', 'origin', url],
      {
        stdio: 'inherit'
      }
    )

    return true
  } catch (err) {
    return false
  }
}

console.log('')
console.log('Scanning for Git repositories under:')
console.log(`  ${root}`)
console.log('')

const repositories = getGitRepositories(root)

let found = 0
let changed = 0

for (const repo of repositories) {
  const url = getOriginUrl(repo)

  if (!url) {
    continue
  }

  const cleanUrl = cleanGitHubUrl(url)

  if (!cleanUrl) {
    continue
  }

  found++

  console.log(repo)
  console.log(`  -> ${cleanUrl}`)

  if (apply) {
    if (setOriginUrl(repo, cleanUrl)) {
      console.log('  [updated]')
      changed++
    } else {
      console.log('  [ERROR] Failed to update remote')
    }
  } else {
    console.log('  [dry-run]')
  }

  console.log('')
}

console.log('----------------------------------------')
console.log(`Repositories requiring changes: ${found}`)

if (apply) {
  console.log(`Repositories changed:            ${changed}`)
} else {
  console.log('')
  console.log('This was a DRY RUN.')
  console.log('')
  console.log('Run with --apply to make the changes:')
  console.log('')
  console.log('  node scripts/clean-git-remotes.js --apply')
}

console.log('')
