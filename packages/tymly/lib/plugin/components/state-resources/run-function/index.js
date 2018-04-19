const _ = require('lodash')

module.exports = class RunFunction {
  init (resourceConfig, env, callback) {
    this.env = env
    this.functions = env.bootedServices.functions
    this.functionName = resourceConfig.functionName
    callback(null)
  }

  async run (event, context) {
    const namespace = context.stateMachineMeta.namespace
    const funcName = `${namespace}_${this.functionName}`
    const func = this.functions.functions[funcName]

    if (!func) {
      return context.sendTaskFailure({
        error: 'UNKNOWN_FUNCTION',
        cause: `Cannot find function: ${funcName}`
      })
    }

    const isCallback = func.args.includes('callback')

    const args = func.args.map(arg => {
      if (arg !== 'callback') {
        if (arg === 'event') {
          return event
        } else if (arg === 'context') {
          return context
        } else if (arg === 'env') {
          return this.env
        } else {
          return event[arg]
        }
      }
    }).filter(arg => arg)

    let result
    if (isCallback) {
      result = await new Promise((resolve, reject) => {
        func.func(...args, (err, data) => {
          if (err) reject(err)
          else resolve(data)
        })
      })
    } else {
      result = await func.func(...args)
    }

    if (_.isString(result)) {
      context.sendTaskSuccess({result})
    } else {
      context.sendTaskSuccess(result)
    }
  }
}
