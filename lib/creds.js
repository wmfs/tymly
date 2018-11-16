const promisify = require('util').promisify
const promptCb = require('prompt')
const prompt = promisify(promptCb.get)
const fs = require('fs')

const credsPath = './.creds'

async function credentials () {
  const savedCreds = load()

  const envUsername = process.env.GITHUB_USERNAME
  const envPassword = process.env.GITHUB_PASSWORD
  const envToken = process.env.GITHUB_TOKEN

  let username = savedCreds.username || envUsername
  let password = savedCreds.password || envPassword
  let token = savedCreds.token || envToken

  if (needsPrompt(username, password, token)) {
    const results = await askUser(username, password)
    username = results.username
    password = results.password
    token = results.token
  }

  const creds = {
    username,
    password,
    token
  }

  save(creds)

  return creds
} // credentials

function needsPrompt (username, password, token) {
  return (!username || !password)
} // needsPrompt

async function askUser (username, password) {
  const usernameSchema = {
    properties: {
      username: {
        description: 'Github username  ',
        required: true,
        default: username
      },
      password: {
        description: 'Password (or SSH)',
        required: true,
        default: password,
        hidden: true,
        replace: '*'
      }
    }
  }
  const tokenSchema = {
    properties: {
      token: {
        description: 'Personal Access Token',
        required: true
      }
    }
  }

  const un = await prompt(usernameSchema)
  const token = await ((un.password === 'SSH') ? prompt(tokenSchema) : {token: null})

  return {
    username: un.username,
    password: un.password,
    token: token.token
  }
} // askUser

function load () {
  try {
    const credStr = fs.readFileSync(credsPath)
    return JSON.parse(credStr)
  } catch (err) {
    // ah well
  }
  return {}
} // load

function save (credObj) {
  fs.writeFileSync(credsPath, JSON.stringify(credObj))
} // save

module.exports = credentials
