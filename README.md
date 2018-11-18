![Tymly Logo](https://github.com/wmfs/tymly/blob/master/assets/tymly_wordmark_and_logo_medium.svg)

# What is this?

__Tymly is the product of many inter-related [Node.js](https://nodejs.org/en/) packages. The source code for all these packages is maintained in separate GitHub repositories in the [WMFS organization](https://github.com/wmfs).__

However, for those wanting to develop the Tymly framework itself, it can be tricky to keep-track as new Tymly repos are added and existing Tymly repos evolve.
It's also important to ensure all these repos are linked together locally for the best possible developer experience.

_And that's what this repo can help with!_

Here we have an ___empty___ [Lerna](https://github.com/lerna/lerna)-powered [monorepo](https://medium.com/@maoberlehner/monorepos-in-the-wild-33c6eb246cb9).
By following the instructions below, it's possible to automatically fill the empty `/blueprints`, `/packages` and `/plugins` directories with the freshest Tymly code from https://github.com/wmfs.

* __Subsequent synchronization attempts will update the locally cloned repos as necessary, and clone anything new that's become available.__


# Environment

There are a couple of things you'll need installed for all this to work...

### Git

> Git is a version-control system for tracking changes in computer files and coordinating work on those files among multiple people.

* https://git-scm.com/downloads

### Node.js

> Node.js is an open-source, cross-platform JavaScript run-time environment that executes JavaScript code outside of a browser.

* https://nodejs.org

# GitHub Access Token

> Instead of using your GitHub password, we use a [Personal Github Access Token](https://help.github.com/articles/creating-a-personal-access-token-for-the-command-line/).
> This approach provides a few advantages - in particular finer access control and more specific monitoring. __Be sure to keep the value of your Access Token value secret!__

Assuming you've already signed-up with GitHub, you'll need to create a new **Access Token** for all your Tymly-related interactions.

* Generating a new token value is easy enough, first go here:
  * https://github.com/settings/tokens
* Then click the __"Generate new token"__ button.
* Feel free to give your new token any name you like, but something like "Tymly Monorepo" will do nicely.
* As for those __Scopes__, click this one:
  * [x] __repo__ (Full control of private repositories)
* Then hit __"Generate token"__.
* Copy the token value: we'll be setting an environment variable to it later.

# Cloning

Next you'll need to clone this repo. From the __Git__ shell:

`git clone https://github.com/wmfs/tymly.git`

Then, from the command prompt, install all the __Node.js__ packages required to make this repo work:

```
cd tymly
npm install
```

# Environment Variables

__To integrate this repo with your GitHub account, two [environment variables](https://www.twilio.com/blog/2017/01/how-to-set-environment-variables.html) will need defining...__

| Environment Variable | Notes                                                                 |
| -------------------- | --------------------------------------------------------------------- |
| `TYMLY_GITHUB_USER`  | The value of this environment variable should be set to the __username__ that you use to log into GitHub with (and the account you generated that access token with earlier).              |
| `TYMLY_GITHUB_TOKEN` | And the value of this environment variable should be set to the personal __Access Token__ you previously generated. |

# Synchronizing

Nearly there! To synchronize your empty Tymly [monorepo](https://medium.com/@maoberlehner/monorepos-in-the-wild-33c6eb246cb9), run this from within the `/tymly` directory:

### `npm run sync`

__Which will:__

* Connect to GitHub (using the username/token values defined in the environment variables)
* Clone or pull Tymly repos into the `/blueprints`, `/packages` and `/plugins` directories.

__...which should lead to output looking similar to:__

![Sync screenshot](https://github.com/wmfs/tymly/blob/master/assets/sync-screenshot.png)

__Just `npm run sync` anytime you want to ensure your local Tymly repos reflect those on GitHub.__

# Bootstrapping

To ensure the dependencies of all the Tymly repos are installed as things change, and that the Tymly repos are all linked together locally, we use the [Lerna](https://lernajs.io/) monorepo tool.

__From the command line, inside the `tymly` directory:__

### `npm run bootstrap`

And after a while, you're good to go! :sweat_smile:

# Next steps...

__With your Tymly repos cloned and packages installed, what next?__

1. Have a read of our contributor [Code of Conduct](https://github.com/wmfs/tymly/blob/master/CODE_OF_CONDUCT.md).
2. Also, please read our notes about [contributing](https://github.com/wmfs/tymly/blob/master/CONTRIBUTING.md).

# License

[MIT](https://github.com/wmfs/tymly/blob/master/LICENSE)
