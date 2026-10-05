const fs = require('fs')
const path = require('path')
const process = require('process')
const { spawnSync } = require('child_process')
const { root, workspaceGlobs } = require('./workspace-dirs')

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
// Every folder here must also appear in pnpm-workspace.yaml's "packages".
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
    noInstall: args.has('--no-install'),
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

  writeLernaJson()

  const lernaSync = new LernaSync({
    monorepoPath: root,
    gitHubToken: process.env.TYMLY_GITHUB_TOKEN,
    gitHubOrgName: 'wmfs',
    lernaPackageRouterFunction: createRouter(args),
    dryRun: args.dryRun,
    verbose: args.verbose,
    concurrency: args.concurrency
  })

  const { errorCount } = await lernaSync.sync()
  if (errorCount > 0) process.exitCode = 1

  if (args.dryRun || args.noInstall) return

  // pnpm install is incremental, so it's quick to run every time. It takes
  // care of the "Reinstall/relink" step lerna-sync may have just asked for.
  // Failed repos don't stop it: the ones that did sync still need linking.
  console.log('\nRunning pnpm install...')
  const result = spawnSync('pnpm', ['install'], {
    cwd: root,
    stdio: 'inherit',
    shell: process.platform === 'win32'
  })
  if (result.status !== 0) {
    throw new Error('pnpm install failed')
  }
}

// lerna-sync reads its target folders from lerna.json. Lerna itself is no
// longer used, so generate that file from pnpm-workspace.yaml to keep one
// list of folders. (lerna.json is gitignored.)
function writeLernaJson () {
  fs.writeFileSync(
    path.join(root, 'lerna.json'),
    JSON.stringify({ packages: workspaceGlobs() }, null, 2) + '\n'
  )
}

main().catch(err => {
  console.error(err)
  process.exitCode = 1
})
