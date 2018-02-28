# xml-flatten2csv
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com) [![license](https://img.shields.io/github/license/mashape/apistatus.svg)](https://github.com/wmfs/tymly/blob/master/packages/xml2csv/LICENSE)

> Takes an XML file and transforms it into a CSV file, based on a mapping you provide.  
> One XML element and its contents can be transformed into multiple CSV output lines.  

## <a name="install"></a>Install
```bash
$ npm install xml-flatten2csv --save
```

## <a name="usage"></a>Usage

```javascript
const xmlFlatten2csv = require('xml-flatten2csv')

xmlFlatten2csv(
  {
    xmlPath: 'path/to/file.xml',
    csvPath: 'path/to/file.csv',
    rootXMLElement: 'Episode',
    pivotPath: '$.People.Person',
    headerMap: [
      ['$.Title', 'title', 'string'],
      ['@.Name', 'name', 'string'],
      [{ test: '@.Age<=16', value: 'yes'}, 'child', 'string'],
      [{ test: '@.Age>16', select: '@.Age'}, 'age', 'integer']
    ]
  }
)
.then(() => console.log("Done!"))
.catch(err => console.error(err))
```
Input: 
```xml
<Simpsons>
    <Episode>
        <Title>Cape Feare</Title>
        <People>
            <Person>
                <Name>Bart</Name>
                <Age>10</Age>
            </Person>
            <Person>
                <Name>Marge</Name>
                <Age>36</Age>
            </Person>
            <Person>
                <Name>Lisa</Name>
                <Age>8</Age>
            </Person>
            <Person>
                <Name>Sideshow Bob</Name>
            </Person>
        </People>
    </Episode>
    <Episode>
        <Title>Homer Loves Flanders</Title>
        <People>
            <Person>
                <Name>Homer</Name>
                <Age>39</Age>
            </Person>
            <Person>
                <Name>Ned Flanders</Name>
                <Age>60</Age>
            </Person>
        </People>
    </Episode>
</Simpsons>
```

Output:
```csv
"title","name","child","age"
"Cape Feare","Bart","yes",
"Cape Feare","Marge",,36
"Cape Feare","Lisa","yes",
"Cape Feare","Sideshow Bob",,
"Homer Loves Flanders","Homer",,39
"Homer Loves Flanders","Ned Flanders",,60
```

## xmlFlatten2csv(`options`)

### Options

| Property              | Type      | Notes  |
| --------              | ----      | -----  |
| `xmlPath`             | `string`  | A path to the xml input file.
| `csvPath`             | `string`  | The path and filename of the generated CSV output file (note that any intermediate folders will be created).
| `rootXMLElement`      | `string`  | The XML root tag for each subtree to process, 
| `pivotPath`           | `string`  | The jsonpath of the elements to split records on
| `headerMap`           | `[array]` | See the [Header Map](#headerMap) section for more details.
| `namespace`           | `string`  | How to handle namespace prefixes - omit to do nothing, 'strip' to remove prefixes, or any other string to replace the ':' with something else 

### <a name="headerMap"></a>options.headerMap

options.headerMap has the structure:

```javascript
[
    [selector, csvHeader, type],
    [selector, csvHeader, type],
    ...
]
```
* _selector_ is either a jsonpath into the subtree, or a condition consisting of a jsonpath test and either 
a value or a jsonpath into the subtree 
* _type_ must be integer, date or string

For straightforward linear transformations, where one XML subtree maps to one line of CSV output, consider 
__xml2csv__ instead.

## <a name="test"></a>Testing


```bash
$ npm test
```

## <a name="license"></a>License
[MIT](https://github.com/wmfs/tymly/xml2csv/blob/master/LICENSE)
