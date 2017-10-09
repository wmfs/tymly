# Form-maker
[![license](https://img.shields.io/github/license/mashape/apistatus.svg)](https://github.com/wmfs/tymly/blob/master/packages/form-maker/LICENSE)

> Automatically generates form schema and editor flow for all models specified in a [TymlyJS](http://www.tymlyjs.io) blueprint.

## <a name="tests"></a>Tests
```bash
$ npm test
```

## <a name="usage"></a>Usage
```javascript
const formMaker = require('form-maker')

formMaker (
  {
  blueprintDir: 'c:/development/blueprints/addressbox-blueprint'
  },
  function (err) {
    // form-schema and flow-editor are created in the provided blueprint directory in /flows and /forms respectively.
  }
)
```

## <a name="license"></a>License
[MIT](https://github.com/wmfs/tymly-runner/blob/master/LICENSE)