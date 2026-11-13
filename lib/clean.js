'use strict'

// Replaces `lerna clean`: removes node_modules from the root and every workspace package.
// Plain Node so it works the same on Windows.

const fs = require('fs')
const path = require('path')
const { root, workspacePackageDirs } = require('./workspace-dirs')

const targets = [root, ...workspacePackageDirs()]
.map(dir => path.join(dir, 'node_modules'))
.filter(dir => fs.existsSync(dir))

for (const dir of targets) {
  console.log(`Removing ${path.relative(root, dir)}`)
  fs.rmSync(dir, { recursive: true, force: true })
}

console.log(`Removed ${targets.length} node_modules director${targets.length === 1 ? 'y' : 'ies'}`)