![Tymly Logo](https://github.com/wmfs/tymly/blob/master/assets/tymly_wordmark_and_logo_medium.svg)

> A Tymly shaped shell used to mimic [monorepo](https://medium.com/@maoberlehner/monorepos-in-the-wild-33c6eb246cb9) behaviour.
>
> You will note that the blueprints/packages/plugins folders are all empty.  In a normal monorepo these folders would hold
> other projects.  Instead of this, we use various scripts to download the source code for these other projects into these folders.


## Installing

To setup tymly locally, you should first clone this repository.

Once you have done so, do an "npm install" to download the dependencies as normal...

``` bash
$ npm install
```

To populate the aforementioned empty folders, execute the sync script.  This will run a series of git clone commands to download the various blueprints/packages/plugins...

```bash
$ npm run sync
```

You'll need to login to npm to be able to pull in the private packages.
```bash
$ npm login
```

In the future, you can re-run this script to get any missing repos or pull the latest commits.

Finally, execute the bootstrap script to have lerna download/hoist all the dependencies...

```bash
$ npm run bootstrap
```


## Running Locally in WebStorm

To run tymly locally, create a new npm run configuration named "npm start".

Change the package.json drop-down so that the tymly-runner package.json is selected.

Set the command drop-down to "start".

Finally configure the various environment variables as specified in the README.md file for the tymly-runner repository.

Thereafter, you can start tymly using the run configuration.


## Making Changes to Blueprints/Packages/Plugins

Be aware that the build system (wmfs-bot) is configured to automatically release new versions of blueprints/packages/plugins after changes to them have been committed and pushed.

However, this will only occur if the commit messages are prefixed with certain tags.  Memorising those tags are unneccessary as you can
use commitizen to [handle it](https://github.com/wmfs/tymly-monorepo/wiki/Using-Commitizen).


## <a name="license"></a>License

[MIT](https://github.com/wmfs/tymly/blob/master/LICENSE)

