'use strict'

// Replaces `lerna link --force-local`.
//
// Tymly repos are released with semantic-release, so a checked-out package.json
// usually says "0.0.0-semantically-released". That never satisfies the ranges
// other packages declare, so pnpm would fetch those packages from the registry
// instead of linking the local copy.
//
// This hook rewrites any dependency on a locally present package to
// `workspace:*` so the local copy is always linked. It only changes pnpm's
// in-memory view of the manifests: nothing on disk is modified, and each
// repo's package.json keeps its normal semver ranges for publishing.

const fs = require('fs')
const path = require('path')
const { workspacePackageDirs } = require('./lib/workspace-dirs')

// name -> version of every package checked out locally
const local = new Map()
for (const dir of workspacePackageDirs()) {
  try {
    const { name, version } = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'))
    if (name) local.set(name, version)
  } catch (err) {
    // An unreadable package.json is reported by pnpm itself.
  }
}

const DEPENDENCY_FIELDS = [
  'dependencies',
  'devDependencies',
  'optionalDependencies',
  'peerDependencies'
]

function isLocalWorkspacePackage (pkg) {
  // Matching the version as well as the name means a registry copy of a
  // package with the same name (pulled in transitively) is left alone.
  return local.has(pkg.name) && local.get(pkg.name) === pkg.version
}

function readPackage (pkg, context) {
  if (!isLocalWorkspacePackage(pkg)) return pkg

  for (const field of DEPENDENCY_FIELDS) {
    const deps = pkg[field]
    if (!deps) continue
    for (const name of Object.keys(deps)) {
      if (name !== pkg.name && local.has(name) && !deps[name].startsWith('workspace:')) {
        deps[name] = 'workspace:*'
      }
    }
  }
  return pkg
}

module.exports = { hooks: { readPackage } }