# Form-maker
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com) [![license](https://img.shields.io/github/license/mashape/apistatus.svg)](https://github.com/wmfs/tymly/blob/master/packages/form-maker/LICENSE)

> Generates a form and state machine in JSON format based on a given yaml.

## <a name="tests"></a>Tests
```bash
$ npm test
```

## <a name="usage"></a>Usage
const formMaker = require('form-maker')

```javascript
const formMaker = require('form-maker')

formMaker (
  {
    namespace: 'test',
    formName: 'peopleForm',
    modelName: 'peopleModel',
    yamlPath: 'path/to/yaml/file'
  },
  function (err, result) {
    // result.form - holds the generated form object
    // result.stateMachine - holds the generated state machine object
  }
)
```

## <a name="license"></a>License
[MIT](https://github.com/wmfs/tymly-runner/blob/master/LICENSE)