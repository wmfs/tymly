# asl-choice-processor
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com) [![license](https://img.shields.io/github/license/mashape/apistatus.svg)](https://github.com/wmfs/tymly/blob/master/packages/asl-choice-processor/LICENSE)

> For determining the next state given an Amazon States Language "Choices" definition and a set of values. 

### Useful links

* [Amazon States Language specification (Apache License, Version 2.0)](https://states-language.net/spec.html#choice-state)
* [Choice](http://docs.aws.amazon.com/step-functions/latest/dg/amazon-states-language-choice-state.html#amazon-states-language-choice-state-rules) state documentation

## <a name="install"></a>Install
```bash
$ npm install asl-choice-processor --save
```

## <a name="usage"></a>Usage
```javascript
const choiceProcessor = require('asl-choice-processor')
const calculateNextState = choiceProcessor(
  {
    Choices: [
      {
        Variable: '$.foo',
        NumericEquals: 1,
        Next: 'FirstMatchState'
      },
      {
        Variable: '$.foo',
        NumericEquals: 2,
        Next: 'SecondMatchState'
      }
    ],
    Default: 'DefaultMatchState'
  }
)

calculateNextState( {foo: 1} ) // FirstMatchState
calculateNextState( {foo: 2} ) // SecondMatchState
calculateNextState( {foo: 3} ) // DefaultMatchState
```

## <a name="tests"></a>Tests
```bash
$ npm test
```

## <a name="license"></a>License
[MIT](https://github.com/wmfs/tymly/packages/asl-choice-processor/blob/master/LICENSE)
