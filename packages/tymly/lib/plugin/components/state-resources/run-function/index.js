module.exports = class RunFunction {
  init (resourceConfig, env, callback) {
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

    const args = {}
    func.args.forEach(arg => {
      if (arg !== 'callback') {
        if (arg === 'event') {
          args.event = event
        } else if (arg === 'context') {
          args.context = context
        } else {
          args[arg] = event[arg]
        }
      }
    })

    let result
    if (isCallback) {
      result = await new Promise((resolve, reject) => {
        func.func({...args}, (err, data) => {
          if (err) reject(err)
          else resolve(data)
        })
      })
    } else {
      result = func.func({...args})
    }

    context.sendTaskSuccess({result})
  }
}
