const COMPLETE = 'COMPLETE'

class RunStateMachine {
  init (stateConfig, options, callback) {
    this.statebox = options.bootedServices.statebox
    this.stateMachine = stateConfig.stateMachine

    callback(null)
  } // init

  async run (event, context, done) {
    const responseName = desiredResponse(context)
    const execDesc = await this.statebox.startExecution(
      event,
      this.stateMachine,
      {
        sendResponse: responseName
      }
    )

    if (COMPLETE === responseName) {
      context.sendTaskSuccess(execDesc.ctx)
    } else {
      context.sendTaskHeartbeat(execDesc.ctx, (err, executionDescription) => {
        if (err) throw new Error(err)
        executionDescription.currentResource = execDesc.currentResource
        done(executionDescription)
      })
    }
  } // run
} // class RunStateMachine

function desiredResponse (context) {
  const callback = context.task.options.callbackManager.callbacks[context.executionName]
  return callback ? callback.eventName : COMPLETE
} // desiredResponse

module.exports = RunStateMachine
