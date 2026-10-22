![Tymly Logo](https://github.com/wmfs/tymly/blob/master/assets/tymly_wordmark_and_logo_medium.svg)

[![Tymly Package](https://img.shields.io/badge/tymly-monorepo-blue.svg)](https://tymly.io/)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)
[![license](https://img.shields.io/github/license/mashape/apistatus.svg)](https://github.com/wmfs/tymly/blob/master/packages/pg-concat/LICENSE)
[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2Fwmfs%2Ftymly-core.svg?type=shield)](https://app.fossa.io/projects/git%2Bgithub.com%2Fwmfs%2Ftymly-core?ref=badge_shield)

# Introduction

__Tymly is the product of many inter-related [Node.js](https://nodejs.org/en/) packages. The source code for all these packages is maintained in separate GitHub repositories in the [WMFS organization](https://github.com/wmfs).__

However, for those wanting to develop the Tymly framework itself, it can be tricky to keep-track as new Tymly repos are added and existing Tymly repos evolve.
It's also important to ensure all these repos are linked together locally for the best possible developer experience.

_And that's what this repo can help with!_

Here we have an ___empty___ [Lerna](https://github.com/lerna/lerna)-powered [monorepo](https://medium.com/@maoberlehner/monorepos-in-the-wild-33c6eb246cb9).
By following the instructions below, it's possible to automatically fill the empty `/packages`, `/plugins`, `/blueprints`, `/cardscript`, `/apps`, `/mods` and `/e2e` directories with the freshest Tymly code from https://github.com/wmfs.

* __Subsequent synchronization attempts will update local repos as necessary, and clone anything new that's become available.__
* __Repos you're working on are safe:__ if you've checked out a branch, sync won't touch it. It just tells you what's new on `master`.


# Environment

__There are a couple of things you'll need installed for all this to work...__

### Git

> Git is a version-control system for tracking changes in computer files and coordinating work on those files among multiple people.

* https://git-scm.com/downloads

### Node.js

> Node.js is an open-source, cross-platform JavaScript run-time environment that executes JavaScript code outside of a browser.

* https://nodejs.org
* Node `v20` or later is required.

### Lerna

> We use the Lerna tool tool to link together all the various Tymly packages, and also "hoist" shared dependencies to help reduce space/memory overheads.

With Node installed, install Lerna globally via this command:

``` bash
npm install lerna@6 -g
```

> Lerna 7 and later removed the `lerna bootstrap` and `lerna link` commands used by `npm run bootstrap`, so stick with version 6 for now.

# GitHub Access Token

> Instead of using your GitHub password, we use a [Personal Github Access Token](https://help.github.com/articles/creating-a-personal-access-token-for-the-command-line/).
> This approach provides a few advantages - in particular finer access control and more specific monitoring. __Be sure to keep the value of your Access Token value secret!__

__Assuming you've already signed-up with GitHub, you'll need to create a new **Access Token** for all your Tymly-related interactions.__

* Generating a new token value is easy enough, first go here:
  * https://github.com/settings/tokens
* Then click the __"Generate new token"__ button.
* Feel free to give your new token any name you like, but something like "*Tymly Monorepo*" will be fine.
* As for those __Scopes__, click this one:
  * [x] __repo__ (Full control of private repositories)
* Then hit __"Generate token"__.
* Copy the token value: we'll be setting an environment variable to it later.

> If you use a fine-grained token instead, give it read access to __Contents__ and __Metadata__ for the `wmfs` organization's repositories.

# Git Credentials

__The token above is only used to ask GitHub which repos exist. Cloning and fetching use your own git credentials__, so git needs to be able to reach private `wmfs` repos without asking for a password:

* On Windows and macOS, [Git Credential Manager](https://github.com/git-ecosystem/git-credential-manager) (included with Git for Windows) handles this. Signing in once is enough.
* Alternatively, if you use the [GitHub CLI](https://cli.github.com/), run `gh auth setup-git`.

Sync runs git without interactive prompts, so if your credentials are missing, the affected private repos are reported as errors rather than leaving sync waiting for a password.

# Cloning

Next you'll need to clone this repo. From the __Git__ shell:

`git clone https://github.com/wmfs/tymly.git`

Then, from the command prompt, install all the __Node.js__ packages required to make this repo work:

```
cd tymly
npm install
```

# Environment Variables

__To integrate this repo with your GitHub account, an [environment variable](https://www.twilio.com/blog/2017/01/how-to-set-environment-variables.html) will need defining...__

| Environment Variable | Notes                                                                 |
| -------------------- | --------------------------------------------------------------------- |
| `TYMLY_GITHUB_TOKEN` | And the value of this environment variable should be set to the personal __Access Token__ you previously generated. |

# Synchronizing

Nearly there! :smiley:

To synchronize your empty Tymly [monorepo](https://medium.com/@maoberlehner/monorepos-in-the-wild-33c6eb246cb9), run this from within the `/tymly` directory:

### `npm run sync`

__Which will:__

* Connect to GitHub (using the token in `TYMLY_GITHUB_TOKEN`) and find every Tymly repo in the [WMFS organization](https://github.com/wmfs).
* Clone any you don't have yet into the right directory.
* Update the ones you do have, where it's safe to:
  * __On `master` with no local changes:__ fast-forwarded to the latest commit.
  * __On another branch:__ left exactly as it is. Sync fetches, then tells you how many new commits are on `master` so you can merge or rebase when you're ready.
  * __Uncommitted changes, unpushed commits, or a merge or rebase in progress:__ left alone and listed under *Needs your attention*.

__...which should lead to output looking similar to:__

```
Downloading repo information from https://github.com/wmfs
  Cloned      plugins/tymly-rbac-plugin
  On branch   plugins/tymly-pg-plugin  (feature/connection-pool, master has 1 new commit)
  Updated     plugins/tymly-core  (pulled 1 commit)

Cloned (1)
  plugins/tymly-rbac-plugin Plugin for Tymly

Updated (1)
  plugins/tymly-core 1 new commit
    ff3037f fix: handle missing state machine (Jane Smith, 2 hours ago)

Needs your attention (1)
  plugins/tymly-pg-plugin On feature/connection-pool: master has 1 commit(s) you don't
    8ccdfe1 feat: support schema search paths (Jane Smith, 3 hours ago)

1 up to date, 1 cloned, 1 updated, 1 need attention, 0 errors

Dependencies may have changed. Reinstall/relink before running anything.

Done (14 seconds).
```

__Just `npm run sync` anytime you want to ensure your local Tymly repos reflect those on GitHub.__

### Options

| Command | What it does |
| ------- | ------------ |
| `npm run sync:dry` | Shows what sync *would* do, without changing anything. |
| `npm run sync:verbose` | Also lists every repo that was skipped, and why. |
| `npm run sync public-only` | Only syncs public packages. |
| `npm run sync -- --concurrency=4` | Works on fewer repos at once (the default is 6). Useful on slow connections. |

Options can be combined, for example `npm run sync -- --dry-run public-only`.

If anything fails, sync finishes the other repos, lists the failures under *Errors*, and exits with a non-zero code.

### Which repos are synced, and where

A repo is synced if its `package.json` has `tymly` in its `keywords`. The directory it goes into comes from its other keywords:

| Keyword | Directory |
| ------- | --------- |
| `e2e` | `/e2e` |
| `mod` | `/mods` |
| `app` | `/apps` |
| `cardscript` | `/cardscript` |
| `blueprint` | `/blueprints` |
| `plugin` | `/plugins` |
| `package` | `/packages` |

If a repo has more than one of these keywords, the one highest in the table wins. To choose the directory explicitly instead, add it to the repo's `package.json`:

``` json
"config": {
  "tymly": { "type": "blueprint" }
}
```

To stop a repo from being synced at all, set `"sync": false` in the same place:

``` json
"config": {
  "tymly": { "sync": false }
}
```

# Bootstrapping

After synchronizing, this message may appear:

> Dependencies may have changed. Reinstall/relink before running anything.

It's shown when a repo was cloned or an update changed a `package.json`. When you see it, from within the `/tymly` directory, you'll need to:

### `npm run bootstrap`

And after a while, you're good to go! :sweat_smile:

# Next steps

__With your Tymly repos cloned and packages installed, what next?__

1. Check out our [Tymly docs](https://wmfs.github.io/tymly-website/) site.
2. Have a read of our contributor [Code of Conduct](https://github.com/wmfs/tymly/blob/master/CODE_OF_CONDUCT.md).
3. Also, please read our notes about [contributing](https://github.com/wmfs/tymly/blob/master/CONTRIBUTING.md).

# License

[MIT](https://github.com/wmfs/tymly/blob/master/LICENSE)