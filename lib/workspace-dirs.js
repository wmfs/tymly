'use strict'

// Reads the `packages:` globs from pnpm-workspace.yaml.
// Only the simple "dir/*" form is supported, which is all this repo uses,
// so we avoid pulling in a YAML parser.

const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')

function workspaceGlobs () {
  const yaml = fs.readFileSync(path.join(root, 'pnpm-workspace.yaml'), 'utf8')
  const globs = []
  let inPackages = false

  for (const line of yaml.split(/\r?\n/)) {
    if (/^packages:\s*$/.test(line)) {
      inPackages = true
      continue
    }
    if (!inPackages || /^\s*(#.*)?$/.test(line)) continue
    const item = line.match(/^\s+-\s+['"]?([^'"\s#]+)['"]?/)
    if (!item) break // next top-level key
    globs.push(item[1])
  }

  for (const glob of globs) {
    if (!/^[^*]+\/\*$/.test(glob)) {
      throw new Error(`Unsupported workspace glob "${glob}" in pnpm-workspace.yaml (expected "dir/*")`)
    }
  }
  return globs
}

function workspaceDirs () {
  return workspaceGlobs().map(glob => path.join(root, glob.slice(0, -2)))
}

// Every package directory currently present, e.g. <root>/plugins/tymly-pg-plugin
function workspacePackageDirs () {
  const dirs = []
  for (const parent of workspaceDirs()) {
    if (!fs.existsSync(parent)) continue
    for (const entry of fs.readdirSync(parent, { withFileTypes: true })) {
      const dir = path.join(parent, entry.name)
      if (entry.isDirectory() && fs.existsSync(path.join(dir, 'package.json'))) {
        dirs.push(dir)
      }
    }
  }
  return dirs
}

module.exports = { root, workspaceGlobs, workspaceDirs, workspacePackageDirs }