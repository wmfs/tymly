# flobot-solr-plugin

> Plugin which handles interaction with Apache Solr

## <a name="install"></a>Install
```bash
$ npm install flobot-solr-plugin --save
```

## <a name="test"></a>Testing

Before running the tests, you'll need a test PostgreSQL database available and set a `PG_CONNECTION_STRING` environment variable to point to it, for example:

```PG_CONNECTION_STRING=postgres://postgres:postgres@localhost:5432/my_test_db```

You can also set an optional `SOLR_URL` environment variable to configure what Apache Solr instance to use.  If the environment variable is not set, the plugin will default to `http://localhost:8983/solr`.  You can however explicitly configure what instance to use like this:

```SOLR_URL=http://domain.com:8983/solr```

Once the environment variables have been set, you can run the tests like this:

```bash
$ npm test
```


## <a name="license"></a>License

[MIT](https://github.com/wmfs/tymly/blob/master/LICENSE)
