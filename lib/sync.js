const path = require('path')
const process = require('process')

let LernaSync
try {
  // If the local lerna-sync package is available, then use that.
  LernaSync = require('../packages/lerna-sync')
} catch (e) {
  // If it's not been synced in yet, fall back to the npm dependency.
  LernaSync = require('@wmfs/lerna-sync')
}

const REQUIRED_ENV_VARIABLES = ['TYMLY_GITHUB_TOKEN']

// Keyword → monorepo folder. Checked in this order and the first match wins,
// which preserves the old behaviour (where the last entry in the list won).
// Every folder here must also appear in lerna.json's "packages".
const KEYWORD_FOLDERS = [
  ['e2e', 'e2e'],
  ['mod', 'mods'],
  ['app', 'apps'],
  ['cardscript', 'cardscript'],
  ['blueprint', 'blueprints'],
  ['plugin', 'plugins'],
  ['package', 'packages']
]

function parseArgs (argv) {
  const args = new Set(argv)
  const concurrencyArg = argv.find(a => a.startsWith('--concurrency='))
  return {
    dryRun: args.has('--dry-run'),
    verbose: args.has('--verbose'),
    publicOnly: args.has('public-only') || args.has('--public-only'),
    concurrency: concurrencyArg ? Number(concurrencyArg.split('=')[1]) : undefined
  }
}

function createRouter ({ publicOnly }) {
  return function routePackage (pkg) {
    // Not a Tymly package: return null so it's silently ignored
    if (!isTymlyPackage(pkg)) return null

    const tymlyConfig = (pkg.config && pkg.config.tymly) || {}

    if (tymlyConfig.sync === false) {
      return { skip: 'Opted out (config.tymly.sync = false)' }
    }

    if (publicOnly && !isPublicPackage(pkg)) {
      return { skip: 'Private package (public-only mode)' }
    }

    // An explicit folder in package.json wins over keywords
    if (tymlyConfig.type) {
      const match = KEYWORD_FOLDERS.find(([keyword]) => keyword === tymlyConfig.type)
      return match ? match[1] : { skip: `Unknown config.tymly.type "${tymlyConfig.type}"` }
    }

    const match = KEYWORD_FOLDERS.find(([keyword]) => pkg.keywords.includes(keyword))
    return match ? match[1] : { skip: 'Tymly package with no folder keyword (plugin, blueprint, ...)' }
  }
}

function isTymlyPackage (pkg) {
  return Array.isArray(pkg.keywords) && pkg.keywords.includes('tymly')
}

function isPublicPackage (pkg) {
  return Boolean(pkg.publishConfig && pkg.publishConfig.access === 'public')
}

async function main () {
  const missing = REQUIRED_ENV_VARIABLES.filter(name => !process.env[name])
  if (missing.length > 0) {
    throw new Error(`Required environment variable(s) not set: ${missing.join(', ')}`)
  }

  const args = parseArgs(process.argv.slice(2))

  const lernaSync = new LernaSync({
    monorepoPath: path.resolve(__dirname, '..'),
    gitHubToken: process.env.TYMLY_GITHUB_TOKEN,
    gitHubOrgName: 'wmfs',
    lernaPackageRouterFunction: createRouter(args),
    dryRun: args.dryRun,
    verbose: args.verbose,
    concurrency: args.concurrency
  })

  const { errorCount } = await lernaSync.sync()
  if (errorCount > 0) process.exitCode = 1
}

main().catch(err => {
  console.error(err)
  process.exitCode = 1
})
