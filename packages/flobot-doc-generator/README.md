# flobot-doc-generator
> A tool for generating static [FlobotJS](http://www.flobotjs.io) documentation

## How to generate Flobot documentation

### Install Hugo

This tool requires that you have the [Hugo static-site generator]() installed and that the `hugo --help` command works from the command line, from any directory.

### Environment Variables

You'll also need to ensure some environment variables are set:

| Variable Name          | Description |
| ---------------------- | ----------- |
| FLOBOT_PLUGINS_PATH    | Pointing to a directory where all the plugins that should be documented can be found - e.g. `/development/tymly/plugins/*-plugin`|

### Generating

``` bash
$ npm run generate
```

## <a name="license"></a>License
[MIT](https://github.com/wmfs/tymly/blob/master/LICENSE)
