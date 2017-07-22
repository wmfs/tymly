'use strict'

// Getting args from a function:
//   http://stackoverflow.com/questions/1007981/how-to-get-function-parameter-names-values-dynamically-from-javascript

const dottie = require('dottie')

const STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg
const ARGUMENT_NAMES = /(?:^|,)\s*([^\s,=]+)/g

class FunctionsService {

  boot (options, callback) {
    this.functions = {}

    let func
    let functionInfo
    let args

    const functions = dottie.get(options, 'blueprintComponents.functions')

    if (functions) {
      options.messages.info('Adding functions')

      for (let functionId in functions) {
        if (functions.hasOwnProperty(functionId)) {
          func = functions[functionId]

          args = this.getFunctionParameters(func)

          functionInfo = {
            functionId: functionId,
            func: func,
            args: args,
            functionIsAsync: (args.length > 0 && args[args.length - 1] === 'callback')
          }

          this.functions[functionId] = functionInfo

          options.messages.detail(functionId + ' (' + args.join(',') + ')')
        }
      }
    }

    callback(null)
  }

  /**
   * Returns a function that's been supplied via a blueprint
   * @param {string} namespace The namespace of the blueprint contributing the function that's required
   * @param {string} functionName And the name of the function, in the specified namespace, that's required
   * @returns {Function} A Javascript function as supplied via blueprint
   * @example
   * var func = functions.getFunction('myCompany', 'magicFormula')
   */
  getFunction (namespace, functionName) {
    const functionId = namespace + '_' + functionName
    return this.functions[functionId].func
  }

  /**
   * Returns an array of argument names from any specified function
   * @param {Function} func Any Javascript function
   * @returns {Array<string>} A list of argument names
   * @example
   * var argList = functions.getFunctionParameters(function (a,b,c){})
   * console.log(argList) // ['a','b','c']
   */
  getFunctionParameters (func) {
    const fnStr = func.toString().replace(STRIP_COMMENTS, '')
    const argsList = fnStr.slice(fnStr.indexOf('(') + 1, fnStr.indexOf(')'))
    const result = argsList.match(ARGUMENT_NAMES)

    if (result === null) {
      return []
    } else {
      const stripped = []
      for (let i = 0; i < result.length; i++) {
        stripped.push(result[i].replace(/[\s,]/g, ''))
      }
      return stripped
    }
  }

}

module.exports = {
  serviceClass: FunctionsService,
  bootBefore: ['flobots']
}

