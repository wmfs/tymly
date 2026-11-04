const fs = require('fs')
const os = require('os')
const path = require('path')
const { spawnSync } = require('child_process')
const { root } = require('./workspace-dirs')

// Private @wmfs packages are installed from npm, which needs a valid npm token.
// When the token is missing or expired, npm answers 404 Not Found for private
// packages (so it doesn't reveal they exist), and pnpm install fails with a
// misleading error. Checking up front gives a clear message instead.
// This confirms the token works; it can't confirm access to the @wmfs scope.

const WARN_DAYS = 14
const DAY_MS = 24 * 60 * 60 * 1000

function npm (args) {
  return spawnSync('npm', args, {
    cwd: root, // so a project .npmrc is read as well as ~/.npmrc
    encoding: 'utf8',
    timeout: 30000,
    shell: process.platform === 'win32'
  })
}

function checkNpmAuth () {
  const result = npm(['whoami'])
  if (result.status !== 0) throw whoamiError(result)
  warnIfExpiringSoon()
  return result.stdout.trim()
}

function whoamiError (result) {
  const output = `${result.stdout || ''}${result.stderr || ''}`
  if (/E401|ENEEDAUTH|Unable to authenticate/i.test(output)) {
    const err = new Error([
      'npm is not logged in, or your npm token has expired (they last 90 days).',
      'Private @wmfs packages cannot be installed without a valid token.',
      'Create a new read-only access token at https://www.npmjs.com (Access Tokens)',
      'and update it in ~/.npmrc, then try again.',
      'To sync without installing, run "pnpm sync:no-install" or "pnpm sync:public-only".'
    ].join('\n'))
    err.expected = true // a problem for the user to fix, not a bug, so no stack trace
    return err
  }
  return new Error(`Could not check npm login ("npm whoami" failed):\n${output.trim() || result.error}`)
}

// Warns two weeks before the token expires, rather than failing on the day.
// The expiry comes from "npm token list" when possible. If that isn't allowed
// (possibly with read-only tokens) or the token can't be identified, it falls
// back to TYMLY_NPM_TOKEN_EXPIRES, which developers can set themselves.
function warnIfExpiringSoon (now = Date.now()) {
  const found = expiryFromNpm(now) || expiryFromEnv()
  if (!found) return
  const daysLeft = Math.ceil((found.expiry - now) / DAY_MS)
  if (daysLeft < 0) {
    // Only possible with TYMLY_NPM_TOKEN_EXPIRES: npm doesn't list expired tokens as live
    console.warn('Warning: TYMLY_NPM_TOKEN_EXPIRES is in the past. Update it to your current token\'s expiry date.')
  } else if (daysLeft <= WARN_DAYS) {
    console.warn(
      `Warning: your npm token${found.name ? ` "${found.name}"` : ''} expires in ${daysLeft} day(s), ` +
      `on ${found.expiry.toISOString().slice(0, 10)}. Create a new one before then.`
    )
  }
}

function expiryFromNpm (now) {
  const result = npm(['token', 'list', '--json'])
  if (result.status !== 0) return null
  let tokens
  try {
    tokens = JSON.parse(result.stdout)
  } catch (e) {
    return null
  }
  return Array.isArray(tokens) ? pickToken(tokens, configuredToken(), now) : null
}

// Picks the token in use from "npm token list --json" output. Ignores revoked
// and expired tokens. If more than one is left, the one in use is found by
// matching the start of the token in .npmrc against the partial token npm shows.
function pickToken (tokens, configured, now) {
  const live = tokens.filter(t => !t.revoked && t.expiry && Date.parse(t.expiry) > now)
  const matching = configured ? live.filter(t => prefixMatches(t.token, configured)) : []
  const pick = matching.length === 1 ? matching[0] : live.length === 1 ? live[0] : null
  return pick ? { name: pick.name, expiry: new Date(pick.expiry) } : null
}

function prefixMatches (shown, configured) {
  // npm shows only the start of each token, followed by a mask such as "…" or "***"
  const prefix = String(shown || '').replace(/[^A-Za-z0-9_].*$/, '')
  return prefix.length >= 6 && configured.startsWith(prefix)
}

// The npm token as configured in the project or user .npmrc, if it can be found.
function configuredToken () {
  for (const file of [path.join(root, '.npmrc'), path.join(os.homedir(), '.npmrc')]) {
    let text
    try {
      text = fs.readFileSync(file, 'utf8')
    } catch (e) {
      continue
    }
    const match = text.match(/^\s*\/\/registry\.npmjs\.org\/:_authToken\s*=\s*(.+?)\s*$/m)
    if (match) return match[1].replace(/\$\{(\w+)\}/g, (_, name) => process.env[name] || '')
  }
  return null
}

function expiryFromEnv () {
  const value = process.env.TYMLY_NPM_TOKEN_EXPIRES
  if (!value) return null
  const expiry = new Date(value)
  if (Number.isNaN(expiry.getTime())) {
    console.warn(`Warning: TYMLY_NPM_TOKEN_EXPIRES is not a valid date: "${value}"`)
    return null
  }
  return { name: null, expiry }
}

module.exports = checkNpmAuth
module.exports.pickToken = pickToken

if (require.main === module) {
  try {
    console.log(`npm: logged in as ${checkNpmAuth()}`)
  } catch (err) {
    console.error(err.message)
    process.exitCode = 1
  }
}
